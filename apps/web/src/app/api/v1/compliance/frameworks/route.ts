import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';

/**
 * GET /api/v1/compliance/frameworks
 * 
 * Public endpoint — returns all compliance frameworks and their controls.
 * Used by the verification page and passport display to show framework coverage.
 */
export async function GET() {
  try {
    const sql = getSql();
    const frameworks = await sql`
      SELECT id, name, version, jurisdiction, mandatory, description, 
             effective_date, penalty_description, controls, created_at
      FROM compliance_frameworks
      ORDER BY mandatory DESC, name ASC
    `;

    return NextResponse.json({ frameworks });
  } catch {
    return NextResponse.json({ frameworks: [] });
  }
}
