import { NextRequest, NextResponse } from 'next/server';
import { getSql } from '@/lib/db';

const TRUST_SCORE_DELTA: Record<string, number> = {
  policy_violation: -5,
  prompt_injection_attempt: -8,
  sensitive_data_access: -3,
  drift_detected: -4,
  tool_call: 0,
  api_call: 0,
  db_query: 0,
  human_approval: +2,
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orgId: string; id: string }> }
) {
  const { orgId, id } = await params;
  try {
    const sql = getSql();
    const [system] = await sql`
      SELECT 
        id,
        organization_id as "organizationId",
        name,
        display_name as "displayName",
        purpose,
        owner,
        model_provider as "modelProvider",
        model_name as "modelName",
        environment,
        status,
        tags,
        connected_tools as "connectedTools",
        connected_mcp_servers as "connectedMcpServers",
        connected_databases as "connectedDatabases",
        data_classifications as "dataClassifications",
        trust_score as "trustScore",
        trust_trend as "trustTrend",
        risk_level as "riskLevel",
        last_event_at as "lastEventAt",
        passport_id as "passportId",
        version,
        registered_at as "registeredAt",
        updated_at as "updatedAt"
      FROM ai_systems
      WHERE id = ${id} AND organization_id = ${orgId}
    `;

    if (!system) {
      return NextResponse.json({ error: 'System not found' }, { status: 404 });
    }
    return NextResponse.json(system);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string; id: string }> }
) {
  // POST to system ID = record a runtime event
  const { orgId, id } = await params;
  try {
    const sql = getSql();
    const body = await req.json();
    const {
      eventType = 'tool_call',
      actor = '',
      action = '',
      resource = '',
      outcome = 'allowed',
      severity = 'info',
      metadata = {},
    } = body;

    // Insert event
    const [event] = await sql`
      INSERT INTO runtime_events (
        system_id, organization_id, event_type, actor, action,
        resource, outcome, severity, metadata
      ) VALUES (
        ${id}, ${orgId}, ${eventType}, ${actor}, ${action},
        ${resource}, ${outcome}, ${severity}, ${JSON.stringify(metadata)}
      )
      RETURNING
        id,
        system_id as "systemId",
        event_type as "eventType",
        actor,
        action,
        resource,
        outcome,
        severity,
        occurred_at as "occurredAt"
    `;

    // Update trust score
    const delta = TRUST_SCORE_DELTA[eventType] ?? 0;
    const shouldDrop = outcome === 'blocked' || outcome === 'flagged';
    const totalDelta = delta + (shouldDrop ? -2.5 : 0);

    if (totalDelta !== 0) {
      await sql`
        UPDATE ai_systems SET
          trust_score = GREATEST(0, LEAST(100, trust_score + ${totalDelta})),
          trust_trend = CASE
            WHEN ${totalDelta} > 0 THEN 'improving'
            WHEN ${totalDelta} < 0 THEN 'degrading'
            ELSE 'stable'
          END,
          risk_level = CASE
            WHEN trust_score + ${totalDelta} >= 85 THEN 'low'
            WHEN trust_score + ${totalDelta} >= 60 THEN 'medium'
            WHEN trust_score + ${totalDelta} >= 40 THEN 'high'
            ELSE 'critical'
          END,
          last_event_at = NOW(),
          updated_at = NOW()
        WHERE id = ${id}
      `;
    } else {
      await sql`
        UPDATE ai_systems SET last_event_at = NOW(), updated_at = NOW()
        WHERE id = ${id}
      `;
    }

    return NextResponse.json(event, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
