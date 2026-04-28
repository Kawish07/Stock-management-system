import { type NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const FORWARDED_HEADERS = ['cookie', 'x-frappe-csrf-token', 'authorization'];

// ───── SAFE STRINGIFY HELPERS ─────────────────
// Clean helper to handle complex objects and avoid circular references
function safeStringify(data: any): string {
  if (typeof data === 'string') return data;
  if (!data) return '';
  if (data instanceof Buffer) {
      // Handle Buffers
      return data.toString('utf-8');
  }
  if (typeof data === 'boolean' || typeof data === 'number') {
      return String(data);
  }
  try {
    return JSON.stringify(data);
  } catch (e: any) {
    console.warn('[SafeStringify] Could not stringify data, attempting fallback:', (e as Error).message);
    return String(data);
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, (await params).path, 'GET');
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, (await params).path, 'POST');
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, (await params).path, 'PUT');
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, (await params).path, 'DELETE');
}

// ───── PROXY LOGIC ─────────────────
// Main proxy function
async function proxyRequest(req: NextRequest, pathSegments: string[], method: string) {
  // 1. Check Configuration
  const erpnextUrl = process.env.ERPNEXT_URL;
  if (!erpnextUrl) {
    return NextResponse.json(
      { message: 'ERPNEXT_URL is not configured on the server.' },
      { status: 500 }
    );
  }

  const path = pathSegments.join('/');
  const searchParams = req.nextUrl.searchParams.toString();
  const targetUrl = `${erpnextUrl}/api/${path}${searchParams ? `?${searchParams}` : ''}`;
  
  console.log(`[PROXY] Incoming: ${method} ${targetUrl}`);

  // 2. Prepare Headers
  const headers: Record<string, string> = {
    Accept: 'application/json',
    // Explicitly clear Expect to prevent Node.js from sending "Expect: 100-continue"
    // which causes upstream servers (e.g. Frappe/Nginx) to respond with 417.
    Expect: '',
  };

  for (const name of FORWARDED_HEADERS) {
    const value = req.headers.get(name);
    if (value) {
      headers[name] = value;
    }
  }

  // 3. Prepare Body
  let body = null;
  if (method !== 'GET' && method !== 'DELETE') {
    headers['Content-Type'] = 'application/json';
    try {
      body = await req.json();
    } catch (e) {
      console.warn('[PROXY] Body parsing failed:', (e as Error).message);
      body = null;
    }
  }

  try {
    console.log('[PROXY] Sending request...');
    
    // ── AXIOS CONFIG ─────────────────────────────────────────
    const upstream = await axios({
      method: method.toLowerCase() as any,
      url: targetUrl,
      headers,
      data: body,
      // Never throw for non-2xx — forward all HTTP statuses as-is
      validateStatus: () => true,
      // Serialize body as JSON (required when overriding transformRequest)
      transformRequest: [(data: any) => {
        if (data !== null && data !== undefined && typeof data === 'object') {
          return JSON.stringify(data);
        }
        return data;
      }],
      // 10s timeout for slow Frappe
      timeout: 10000,
    });

    // ── RESPONSE DATA ─────────────────────────────────
    const data = upstream.data;
    const status = upstream.status;

    console.log(`[PROXY] Response Status: ${status}`);
    console.log(`[PROXY] Data Type: ${typeof data}`);
    if (data instanceof Buffer || data instanceof ArrayBuffer) {
      console.log(`[PROXY] Buffer Received of length: ${data instanceof Buffer ? data.length : data.byteLength}`);
    }

    // ───── SAFE RESPONSE HANDLING ─────────────────────────────────

    // ── CASE 1: BINARY DATA ─────────────────────────
    // PDFs, Images, Buffers
    if (data instanceof Buffer) {
      // NextResponse handles Buffers automatically
      return new Response(data, { status });
    } 
    else if (data instanceof ArrayBuffer) {
      return new Response(data, { status, headers: { 'Content-Type': 'application/octet-stream' } });
    }

    // ── CASE 2: STRING DATA ─────────────────────────
    if (typeof data === 'string') {
      // ── FIX: Detect HTML Errors (503 Bad Gateway) ─────────
      // Often Frappe returns HTML on auth failure
      if (data.includes('<!DOCTYPE html>')) {
        console.error('[PROXY] Frappe returned HTML Page instead of JSON.');
        return NextResponse.json(
          { message: 'Frappe Authentication failed. Check credentials or Token.' },
          { status: 503 } // 503 Bad Gateway
        );
      }
      // Regular JSON
      return NextResponse.json(data, { status });
    }

    // ── CASE 3: OBJECT DATA (JSON) ─────────────────
    console.log(`[PROXY] Sending response...`);
    const res = NextResponse.json(data ?? {}, { status });

    // ───── COOKIES ─────────────────────────────────
    const rawCookies = upstream.headers['set-cookie'] || [];
    if (Array.isArray(rawCookies)) {
      for (const cookieStr of rawCookies) {
        const parts = cookieStr.split(';').map(s => s.trim());
        const firstPart = parts[0];
        const eqIdx = firstPart.indexOf('=');
        if (eqIdx === -1) continue;

        const cookieName = firstPart.slice(0, eqIdx).trim();
        let cookieValue: string;
        try {
          cookieValue = decodeURIComponent(firstPart.slice(eqIdx + 1).trim());
        } catch {
          cookieValue = firstPart.slice(eqIdx + 1).trim();
        }
        if (!cookieName) continue;

        const maxAgePart = parts.find((p) => /^max-age=/i.test(p));
        const maxAge = maxAgePart
          ? parseInt(maxAgePart.split('=')[1], 10)
          : 60 * 60 * 24 * 7;

        const pathPart = parts.find((p) => /^path=/i.test(p));
        const cookiePath = pathPart ? pathPart.split('=').slice(1).join('=') : '/';

        res.cookies.set(cookieName, cookieValue, {
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          path: cookiePath,
          maxAge,
        });
      }
    }

    return res;

  } catch (error: any) {
    const msg = error?.message ?? 'Unknown error';
    const code = error?.code ?? '';
    console.error(`[PROXY] Proxy Exception (${code}): ${msg}`);
    return NextResponse.json(
      { message: `Failed to connect to ERPNext. ${msg}` },
      { status: 502 }
    );
  }
}