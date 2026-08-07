import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getSql } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { orgId } = await params;
  const sql = getSql();

  const passports = await sql`
    SELECT
      passport_id AS "passportId",
      organization_id AS "organizationId",
      system_id AS "systemId",
      system_display_name AS "systemDisplayName",
      framework_id AS "frameworkId",
      assurance_level AS "assuranceLevel",
      status,
      issued_at AS "issuedAt",
      valid_until AS "validUntil",
      results_summary->>'overallScore' AS "overallScore",
      scope_summary,
      limitations
    FROM security_passports
    WHERE organization_id = ${orgId}::uuid
    ORDER BY issued_at DESC
  `;

  return NextResponse.json(passports);
}
