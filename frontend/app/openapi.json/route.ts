import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');

  if (!base) {
    return NextResponse.json(
      { error: 'NEXT_PUBLIC_API_URL is not configured' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(base + '/openapi.json', {
      cache: 'no-store',
    });

    const schema = await response.json().catch(() => null);

    if (!response.ok || !schema) {
      return NextResponse.json(
        schema || { error: 'Backend OpenAPI schema unavailable' },
        { status: response.status || 502 }
      );
    }

    return NextResponse.json(schema);
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Backend OpenAPI schema unavailable',
        detail: error instanceof Error ? error.message : 'Unknown network failure',
      },
      { status: 502 }
    );
  }
}
