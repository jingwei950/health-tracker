// src/proxy.ts — replaces the deprecated middleware.ts (Next.js 16+)
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_ROUTES       = ['/login', '/signup', '/forgot-password'];
const PUBLIC_API_PREFIXES = [
  '/api/auth',
  '/api/health',
  '/api/ai/test-tools',
  '/api/nutrition',   // TODO: require Bearer auth once user session is wired to nutrition search
  '/api/food-search', // TODO: require Bearer auth once user session is wired to food search
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_API_PREFIXES.some(p => pathname.startsWith(p)))               return NextResponse.next();
  if (pathname.startsWith('/_next') || pathname.includes('.'))             return NextResponse.next();

  const session = request.cookies.get('__session') ?? request.cookies.get('firebase_auth_token');

  // Redirect already-authenticated users away from login
  if (PUBLIC_ROUTES.includes(pathname) && session) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (PUBLIC_ROUTES.includes(pathname))                                    return NextResponse.next();

  if (pathname.startsWith('/api/')) {
    if (!request.headers.get('Authorization')?.startsWith('Bearer '))
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.next();
  }

  if (!session) {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
