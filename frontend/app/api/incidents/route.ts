import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function GET() {
  if (!API_URL) return NextResponse.json({ error: 'NEXT_PUBLIC_API_URL is not configured' }, { status: 500 });
  const response = await fetch(`${API_URL.replace(/\/$/, '')}/api/incidents`, { cache: 'no-store' });
  const text = await response.text();
  return new NextResponse(text, {
    status: response.status,
    headers: { 'Content-Type': response.headers.get('content-type') || 'application/json' },
  });
}
