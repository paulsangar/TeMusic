import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/session';

const PUBLIC_PATHS = ['/'];
const PUBLIC_PREFIXES = ['/_next', '/favicon', '/api/auth/'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  if (
    PUBLIC_PATHS.includes(pathname) ||
    PUBLIC_PREFIXES.some(p => pathname.startsWith(p))
  ) {
    return NextResponse.next();
  }
  
  const token = request.cookies.get('temusc_session')?.value;
  
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }
  
  const session = await verifySessionToken(token);
  
  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    const response = NextResponse.redirect(url);
    response.cookies.delete('temusc_session');
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
