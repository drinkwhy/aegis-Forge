import { NextRequest, NextResponse } from 'next/server';
import { getSql } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  try {
    const sql = getSql();

    // Try to query ai_systems — return empty summary if table doesn't exist yet
    const [stats] = await sql`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE trust_score >= 85) AS trusted,
        COUNT(*) FILTER (WHERE trust_score >= 50 AND trust_score < 85) AS needs_attention,
        COUNT(*) FILTER (WHERE trust_score < 50) AS critical,
        COALESCE(AVG(trust_score), 100)::float AS avg_score
      FROM ai_systems
      WHERE organization_id = ${orgId}
    `.catch(() => [{ total: 0, trusted: 0, needs_attention: 0, critical: 0, avg_score: 100 }]);

    const [findingStats] = await sql`
      SELECT
        COUNT(*) FILTER (WHERE severity = 'critical' AND status = 'open') AS critical_findings,
        COUNT(*) FILTER (WHERE severity = 'high' AND status = 'open') AS high_findings
      FROM findings
      WHERE workspace_id IN (
        SELECT id FROM workspaces WHERE tenant_id = ${orgId}
      )
    `.catch(() => [{ critical_findings: 0, high_findings: 0 }]);

    const [passportStats] = await sql`
      SELECT
        COUNT(*) AS total_passports,
        COUNT(*) FILTER (WHERE status = 'VALID') AS valid_passports
      FROM security_passports
      WHERE organization_id = ${orgId}
    `.catch(() => [{ total_passports: 0, valid_passports: 0 }]);

    const [violations] = await sql`
      SELECT COUNT(*) AS count
      FROM runtime_events
      WHERE organization_id = ${orgId}
        AND (outcome = 'blocked' OR outcome = 'flagged')
        AND occurred_at > NOW() - INTERVAL '24 hours'
    `.catch(() => [{ count: 0 }]);

    return NextResponse.json({
      totalSystems: Number(stats?.total ?? 0),
      trustedSystems: Number(stats?.trusted ?? 0),
      needsAttention: Number(stats?.needs_attention ?? 0),
      criticalSystems: Number(stats?.critical ?? 0),
      avgTrustScore: Number(stats?.avg_score ?? 100),
      openCriticalFindings: Number(findingStats?.critical_findings ?? 0),
      openHighFindings: Number(findingStats?.high_findings ?? 0),
      validPassports: Number(passportStats?.valid_passports ?? 0),
      totalPassports: Number(passportStats?.total_passports ?? 0),
      violations24h: Number(violations?.count ?? 0),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[trust-summary]', err);
    return NextResponse.json({
      totalSystems: 0, trustedSystems: 0, needsAttention: 0, criticalSystems: 0,
      avgTrustScore: 100, openCriticalFindings: 0, openHighFindings: 0,
      validPassports: 0, totalPassports: 0, violations24h: 0,
      updatedAt: new Date().toISOString(),
    });
  }
}
