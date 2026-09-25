import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    {
      error: 'The live event stream is WebSocket-based.',
      websocket: '/ws/events',
    },
    { status: 426 }
  );
}
