// ============================================================
// GET /api/auth/debug
// Debug endpoint: inspects all headers and tests cookies.
// ============================================================

import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  const action = request.nextUrl.searchParams.get('action');

  if (action === 'headers') {
    // Dump all headers to find how to get the real host
    const allHeaders: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      allHeaders[key] = value;
    });
    return Response.json({
      requestUrl: request.url,
      nextUrlOrigin: request.nextUrl.origin,
      nextUrlHost: request.nextUrl.host,
      headers: allHeaders,
    });
  }

  if (action === 'read') {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const session = await getSession();

    return Response.json({
      allCookieNames: allCookies.map((c) => c.name),
      sessionCookie: cookieStore.get('temusc_session')?.value
        ? '(present, length=' + cookieStore.get('temusc_session')!.value.length + ')'
        : null,
      sessionPayload: session,
    });
  }

  return Response.json({
    help: 'Use ?action=headers or ?action=read',
  });
}
