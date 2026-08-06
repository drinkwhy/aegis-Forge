import { NextRequest, NextResponse } from 'next/server';
import { getSql } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ orgId: string; id: string }> }
) {
  const { orgId, id } = await context.params;
  try {
    const sql = getSql();
    const events = await sql`
      SELECT
        id,
        event_type as "eventType",
        actor,
        action,
        resource,
        outcome,
        severity,
        metadata,
        occurred_at as "occurredAt"
      FROM runtime_events
      WHERE system_id = ${id} AND organization_id = ${orgId}
      ORDER BY occurred_at DESC
      LIMIT 100
    `;
    return NextResponse.json(events);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ orgId: string; id: string }> }
) {
  const { orgId, id } = await context.params;
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
        event_type as "eventType",
        actor,
        action,
        resource,
        outcome,
        severity,
        occurred_at as "occurredAt"
    `;

    // Update last_event_at on system
    await sql`
      UPDATE ai_systems SET last_event_at = NOW() WHERE id = ${id}
    `;

    return NextResponse.json(event, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
