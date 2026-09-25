import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
  if (!base) {
    return NextResponse.json(
      { error: 'NEXT_PUBLIC_API_URL is not configured' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(`${base}/api/demo/reset`, {
      method: 'POST',
      cache: 'no-store',
    });
    const text = await response.text();

    return new NextResponse(text, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Network failure' },
      { status: 502 }
    );
  }
}
