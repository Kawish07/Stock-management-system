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
  let body: string | null = null;
  if (method !== 'GET' && method !== 'DELETE') {
    headers['Content-Type'] = 'application/json';
    try {
      const json = await req.json();
      body = JSON.stringify(json);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown body parsing error';
      console.warn('[PROXY] Body parsing failed:', message);
      body = null;
    }
  }

  try {
    console.log('[PROXY] Sending request...');

    // Use native fetch — unlike axios/Node http, it never sends Expect: 100-continue
    const upstream = await fetch(targetUrl, {
      method,
      headers,
      body: body ?? undefined,
      // @ts-expect-error — Node 18+ fetch supports this to disable keep-alive
      duplex: 'half',
    });

    const status = upstream.status;
    console.log(`[PROXY] Response Status: ${status}`);

    // Read raw response text
    const rawText = await upstream.text();
    if (status >= 400) {
      console.log(`[PROXY] Error Response Body:`, rawText.slice(0, 500));
    }

    // Collect set-cookie for forwarding
    const setCookieRaw = upstream.headers.getSetCookie?.() ?? [];

    // ── CASE 1: HTML error page ─────────────────────────────────
    if (rawText.includes('<!DOCTYPE html>')) {
      console.error('[PROXY] Frappe returned HTML page instead of JSON.');
      return NextResponse.json(
        { message: 'Frappe authentication failed. Check credentials or token.' },
        { status: 503 }
      );
    }

    // ── CASE 2: Parse JSON ──────────────────────────────────────
    let parsed: unknown;
    try {
      parsed = rawText ? JSON.parse(rawText) : {};
    } catch {
      // Non-JSON response — return as plain text
      return new Response(rawText, { status, headers: { 'Content-Type': 'text/plain' } });
    }

    const response = NextResponse.json(parsed ?? {}, { status });
    applyUpstreamCookies(response, setCookieRaw);
    return response;

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