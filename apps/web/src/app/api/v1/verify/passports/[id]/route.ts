import { NextRequest, NextResponse } from 'next/server';
import { getSql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sql = getSql();

  try {
    const [passport] = await sql`
      SELECT 
        id,
        organization_id as "organizationId",
        subject_id as "subjectId",
        subject_name as "subjectName",
        certification_standard as "certificationStandard",
        status,
        assurance_level as "assuranceLevel",
        scope_summary as "scopeSummary",
        results_summary as "resultsSummary",
        limitations,
        issuer,
        signature,
        payload_hash as "payloadHash",
        issued_at as "issuedAt",
        valid_until as "validUntil",
        revoked_at as "revokedAt",
        revocation_reason as "revocationReason"
      FROM security_passports
      WHERE id = ${id}
    `;

    if (!passport) {
      return NextResponse.json({ error: 'Passport not found' }, { status: 404 });
    }

    return NextResponse.json(passport);
  } catch (err) {
    console.error('[verify passport GET]', err);
    return NextResponse.json({ error: 'Database error', detail: String(err) }, { status: 500 });
  }
}
