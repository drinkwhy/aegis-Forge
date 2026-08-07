import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getSql } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { orgId } = await params;
  const sql = getSql();

  // Verify user has access to this org
  const [member] = await sql`
    SELECT 1 FROM organizations o
    LEFT JOIN organization_members m ON m.organization_id = o.id AND m.user_id = ${userId}
    WHERE o.id = ${orgId} AND (o.owner_user_id = ${userId} OR m.user_id = ${userId})
  `;

  if (!member) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const assets = await sql`
    SELECT id, organization_id, name, description, asset_type, created_at
    FROM assets
    WHERE organization_id = ${orgId}
    ORDER BY created_at DESC
  `;

  return NextResponse.json({ assets });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { orgId } = await params;
  const sql = getSql();

  // Verify org access
  const [member] = await sql`
    SELECT 1 FROM organizations o
    LEFT JOIN organization_members m ON m.organization_id = o.id AND m.user_id = ${userId}
    WHERE o.id = ${orgId} AND (o.owner_user_id = ${userId} OR m.user_id = ${userId})
  `;

  if (!member) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { name, description, assetType } = body;

  if (!name || !assetType) {
    return NextResponse.json({ error: 'name and assetType are required' }, { status: 400 });
  }

  if (!['openai_compatible', 'mcp_server'].includes(assetType)) {
    return NextResponse.json(
      { error: 'assetType must be openai_compatible or mcp_server' },
      { status: 400 }
    );
  }

  const [asset] = await sql`
    INSERT INTO assets (organization_id, owner_user_id, name, description, asset_type)
    VALUES (${orgId}, ${userId}, ${name}, ${description ?? null}, ${assetType})
    RETURNING id, organization_id, name, description, asset_type, created_at
  `;

  return NextResponse.json(asset, { status: 201 });
}
