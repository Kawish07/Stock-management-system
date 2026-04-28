import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/maintenance'];
const BYPASS_PATTERNS = ['/api/', '/_next/', '/favicon.ico'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (BYPASS_PATTERNS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const sid = request.cookies.get('sid');
  const userId = request.cookies.get('user_id');
  const isLoggedIn =
    sid?.value && sid.value !== 'Guest' && userId?.value && userId.value !== 'Guest';

  // ── Public paths ──────────────────────────────────────────────────────────
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // ── Protected paths ───────────────────────────────────────────────────────
  if (!isLoggedIn) {
    const loginUrl = new URL('/login', request.url);

    // Session-expiry: cookies exist but have been reset to Guest
    const hadSession =
      (sid?.value === 'Guest' || userId?.value === 'Guest') &&
      (sid?.value !== undefined || userId?.value !== undefined);

    if (hadSession) {
      loginUrl.searchParams.set('message', 'session_expired');
    } else {
      loginUrl.searchParams.set('redirect', pathname);
    }

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
