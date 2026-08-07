import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sql = getSql();
    await sql`SELECT 1`;
    return NextResponse.json({ status: 'ready', service: 'aegis-web' }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { status: 'not ready', error: 'db unreachable' },
      { status: 503 }
    );
  }
}
