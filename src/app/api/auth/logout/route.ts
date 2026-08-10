// ============================================================
// POST /api/auth/logout
// Clears session cookie.
// ============================================================

import { clearSession } from '@/lib/session';

export async function POST() {
  await clearSession();
  return Response.json({ data: { success: true }, error: null, status: 200 });
}
