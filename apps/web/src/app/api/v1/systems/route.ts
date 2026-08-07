import { NextRequest, NextResponse } from 'next/server';
import { getSql } from '@/lib/db';

export const dynamic = 'force-dynamic';

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
`;

export async function GET(req: NextRequest) {
  try {
    const sql = getSql();
    await sql.unsafe(ENSURE_TABLE);

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
        trust_score as "trustScore",
        trust_trend as "trustTrend",
        risk_level as "riskLevel",
        registered_at as "registeredAt"
      FROM ai_systems
      ORDER BY registered_at DESC
    `;

    return NextResponse.json(systems);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = getSql();
    await sql.unsafe(ENSURE_TABLE);

    const body = await req.json();
    const {
      organizationId = 'd3b07384-d113-4a11-b541-ef81f212239e',
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
        ${organizationId}, ${name}, ${displayName}, ${purpose}, ${owner},
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
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
