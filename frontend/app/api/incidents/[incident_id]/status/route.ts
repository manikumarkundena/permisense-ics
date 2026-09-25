import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ incident_id: string }> }
) {
  const { incident_id } = await params;
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
  if (!base) return NextResponse.json({ error: 'NEXT_PUBLIC_API_URL is not configured' }, { status: 500 });

  const body = await req.text();
  let payload: Record<string, unknown> = {};
  try { payload = JSON.parse(body); } catch {}

  if (typeof payload.status === 'string') {
    payload.status = payload.status.toLowerCase();
  }

  const response = await fetch(`${base}/api/incidents/${encodeURIComponent(incident_id)}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  const text = await response.text();
  return new NextResponse(text, {
    status: response.status,
    headers: { 'Content-Type': response.headers.get('content-type') || 'application/json' },
  });
}
