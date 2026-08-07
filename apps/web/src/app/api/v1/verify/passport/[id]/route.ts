import { NextResponse } from 'next/server';

const CONTROL_PLANE_URL = process.env.CONTROL_PLANE_URL || 'http://localhost:8080';

/**
 * GET /api/v1/verify/passport/[id]
 * 
 * Public endpoint — no auth required.
 * Proxies to the Go control-plane's passport verification endpoint.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const resp = await fetch(`${CONTROL_PLANE_URL}/api/v1/verify/passports/${id}`, {
      headers: { 'Accept': 'application/json' },
    });

    if (!resp.ok) {
      const body = await resp.json().catch(() => ({ error: 'Passport not found' }));
      return NextResponse.json(body, { status: resp.status });
    }

    const passport = await resp.json();
    return NextResponse.json(passport);
  } catch {
    return NextResponse.json(
      { error: 'Verification service unavailable' },
      { status: 503 }
    );
  }
}
