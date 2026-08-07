import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getSql } from '@/lib/db';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sql = getSql();

  const orgs = await sql`
    SELECT o.id, o.display_name, o.slug, o.created_at, o.updated_at
    FROM organizations o
    LEFT JOIN organization_members m ON m.organization_id = o.id AND m.user_id = ${userId}
    WHERE o.owner_user_id = ${userId} OR m.user_id = ${userId}
    ORDER BY o.created_at DESC
  `;

  return NextResponse.json({ organizations: orgs });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { displayName } = body;

  if (!displayName || typeof displayName !== 'string' || displayName.trim().length < 2) {
    return NextResponse.json(
      { error: 'displayName must be at least 2 characters' },
      { status: 400 }
    );
  }

  const sql = getSql();

  // Generate a slug from the display name
  const baseSlug = displayName.trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);

  // Make slug unique by checking if it exists
  const [existing] = await sql`SELECT id FROM organizations WHERE slug = ${baseSlug}`;
  const slug = existing ? `${baseSlug}-${Date.now().toString(36)}` : baseSlug;

  const [org] = await sql`
    INSERT INTO organizations (owner_user_id, display_name, slug)
    VALUES (${userId}, ${displayName.trim()}, ${slug})
    RETURNING id, display_name, slug, created_at, updated_at
  `;

  // Also add as owner member
  await sql`
    INSERT INTO organization_members (organization_id, user_id, role)
    VALUES (${org.id}, ${userId}, 'owner')
    ON CONFLICT (organization_id, user_id) DO NOTHING
  `;

  return NextResponse.json(org, { status: 201 });
}
