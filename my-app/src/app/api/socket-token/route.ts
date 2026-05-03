import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * GET /api/socket-token
 *
 * Server-side bridge: reads the httpOnly `access_token` cookie and returns it
 * as JSON so the Socket.IO client can pass it via `auth: { token }`.
 *
 * This is needed because:
 *  - The httpOnly cookie cannot be read by client-side JS.
 *  - WebSocket connections bypass Next.js rewrites, so the cookie may not
 *    reach the backend when the domains differ (e.g. local dev with a remote
 *    backend). Passing the token via Socket.IO's `auth` option works in all
 *    environments.
 */
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value ?? null;
  return NextResponse.json({ token });
}
