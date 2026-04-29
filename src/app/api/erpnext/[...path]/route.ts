import { type AxiosRequestTransformer, type Method } from 'axios';
import axios from 'axios';
import { type NextRequest, NextResponse } from 'next/server';

const FORWARDED_HEADERS = ['cookie', 'x-frappe-csrf-token', 'authorization'];

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

function applyUpstreamCookies(response: NextResponse, setCookieHeader: string[] | string | undefined) {
  const rawCookies = Array.isArray(setCookieHeader)
    ? setCookieHeader
    : setCookieHeader
      ? [setCookieHeader]
      : [];

  for (const cookieStr of rawCookies) {
    const parts = cookieStr.split(';').map((s) => s.trim());
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

    response.cookies.set(cookieName, cookieValue, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: cookiePath,
      maxAge,
    });
  }

  return response;
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
  };

  for (const name of FORWARDED_HEADERS) {
    const value = req.headers.get(name);
    if (value) {
      headers[name] = value;
    }
  }

  // 3. Prepare Body
  let body: unknown = null;
  if (method !== 'GET' && method !== 'DELETE') {
    headers['Content-Type'] = 'application/json';
    try {
      body = await req.json();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown body parsing error';
      console.warn('[PROXY] Body parsing failed:', message);
      body = null;
    }
  }

  try {
    console.log('[PROXY] Sending request...');
    
    // ── AXIOS CONFIG ─────────────────────────────────────────
    const transformRequest: AxiosRequestTransformer = (data: unknown) => {
      if (data !== null && data !== undefined && typeof data === 'object') {
        return JSON.stringify(data);
      }

      return data;
    };

    const upstream = await axios({
      method: method.toLowerCase() as Method,
      url: targetUrl,
      headers,
      data: body,
      // Never throw for non-2xx — forward all HTTP statuses as-is
      validateStatus: () => true,
      // Serialize body as JSON (required when overriding transformRequest)
      transformRequest: [transformRequest],
      // 10s timeout for slow Frappe
      timeout: 10000,
    });

    // ── RESPONSE DATA ─────────────────────────────────
    const data = upstream.data;
    const status = upstream.status;

    console.log(`[PROXY] Response Status: ${status}`);
    console.log(`[PROXY] Data Type: ${typeof data}`);
    if (status >= 400) {
      console.log(`[PROXY] Error Response Body:`, JSON.stringify(data))
    }
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
      return applyUpstreamCookies(NextResponse.json(data, { status }), upstream.headers['set-cookie']);
    }

    // ── CASE 3: OBJECT DATA (JSON) ─────────────────
    console.log(`[PROXY] Sending response...`);
    return applyUpstreamCookies(NextResponse.json(data ?? {}, { status }), upstream.headers['set-cookie']);

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    const code =
      typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string'
        ? error.code
        : '';
    console.error(`[PROXY] Proxy Exception (${code}): ${msg}`);
    return NextResponse.json(
      { message: `Failed to connect to ERPNext. ${msg}` },
      { status: 502 }
    );
  }
}