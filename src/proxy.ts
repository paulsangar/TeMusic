import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/session';

export async function proxy(request: NextRequest) {
  const token = request.cookies.get('temusc_session')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const session = await verifySessionToken(token);
  if (!session) {
    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.delete('temusc_session');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/lab/:path*', '/discovery/:path*', '/settings/:path*'],
};
