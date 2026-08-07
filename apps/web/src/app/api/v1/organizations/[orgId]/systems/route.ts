import { NextRequest, NextResponse } from 'next/server';
import { getSql } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Ensure ai_systems table exists
const ENSURE_TABLE = `
  CREATE TABLE IF NOT EXISTS ai_systems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    purpose TEXT DEFAULT '',
    owner TEXT DEFAULT '',
    model_provider TEXT DEFAULT '',
    model_name TEXT DEFAULT '',
    environment TEXT DEFAULT 'production',
    status TEXT DEFAULT 'active',
    tags JSONB DEFAULT '[]',
    connected_tools JSONB DEFAULT '[]',
    connected_mcp_servers JSONB DEFAULT '[]',
    connected_databases JSONB DEFAULT '[]',
    data_classifications JSONB DEFAULT '[]',
    trust_score DOUBLE PRECISION DEFAULT 100.0,
    trust_trend TEXT DEFAULT 'stable',
    risk_level TEXT DEFAULT 'low',
    last_event_at TIMESTAMPTZ,
    passport_id TEXT DEFAULT '',
    version TEXT DEFAULT '',
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS runtime_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    system_id UUID NOT NULL REFERENCES ai_systems(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL,
    event_type TEXT NOT NULL,
    actor TEXT DEFAULT '',
    action TEXT NOT NULL,
    resource TEXT DEFAULT '',
    outcome TEXT NOT NULL,
    severity TEXT DEFAULT 'info',
    metadata JSONB DEFAULT '{}',
    occurred_at TIMESTAMPTZ DEFAULT NOW()
  );
`;

async function ensureTables() {
  const sql = getSql();
  await sql.unsafe(ENSURE_TABLE);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  try {
    const sql = getSql();
    await ensureTables();

    const systems = await sql`
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
      WHERE organization_id = ${orgId}
      ORDER BY registered_at DESC
    `;

    return NextResponse.json(systems);
  } catch (err) {
    console.error('[systems GET]', err);
    return NextResponse.json({ error: 'Database error', detail: String(err) }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  try {
    const sql = getSql();
    await ensureTables();

    const body = await req.json();
    const {
      name = body.displayName?.toLowerCase().replace(/\s+/g, '-') || 'unnamed',
      displayName = 'Unnamed System',
      purpose = '',
      owner = '',
      modelProvider = '',
      modelName = '',
      environment = 'production',
    } = body;

    const [system] = await sql`
      INSERT INTO ai_systems (
        organization_id, name, display_name, purpose, owner,
        model_provider, model_name, environment
      ) VALUES (
        ${orgId}, ${name}, ${displayName}, ${purpose}, ${owner},
        ${modelProvider}, ${modelName}, ${environment}
      )
      RETURNING
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
        trust_score as "trustScore",
        trust_trend as "trustTrend",
        risk_level as "riskLevel",
        registered_at as "registeredAt"
    `;

    return NextResponse.json(system, { status: 201 });
  } catch (err) {
    console.error('[systems POST]', err);
    return NextResponse.json({ error: 'Failed to register system', detail: String(err) }, { status: 500 });
  }
}
