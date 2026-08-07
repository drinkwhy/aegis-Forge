import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSql } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; action: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resolvedParams = await params;
  const { id, action } = resolvedParams;

  const sql = getSql();
  const users = await sql`SELECT tenant_id FROM users WHERE auth0_sub = ${userId}`;
  if (!users || users.length === 0) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }
  
  const tenantId = users[0].tenant_id;
  const baseUrl = (process.env.NEXT_PUBLIC_CONTROL_PLANE_URL || 'http://localhost:8080').replace(/\/$/, '');
  
  const body = await request.json().catch(() => ({}));

  const res = await fetch(`${baseUrl}/api/v1/organizations/${tenantId}/security-passports/${id}/${action}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'CONTROL_PLANE_API_SECRET': process.env.CONTROL_PLANE_API_SECRET || '',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: text || 'Action failed' }, { status: res.status });
  }

  return NextResponse.json({ success: true });
}
