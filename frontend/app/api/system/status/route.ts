import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
  if (!base) return NextResponse.json({ error: 'NEXT_PUBLIC_API_URL is not configured' }, { status: 500 });

  const response = await fetch(`${base}/api/system/status`, { cache: 'no-store' });
  const backend = await response.json().catch(() => null);

  if (!response.ok || !backend) {
    return NextResponse.json(backend || { error: 'Backend system status unavailable' }, { status: response.status || 502 });
  }

  const online = (value: unknown) => ['online', 'configured'].includes(String(value).toLowerCase());
  const operational = String(backend.status || '').toLowerCase() === 'operational';

  return NextResponse.json({
    status: operational ? 'HEALTHY' : 'WARNING',
    timestamp: new Date().toISOString(),
    version: backend.version || 'backend',
    runtime_mode: 'REAL_MODBUS_VIRTUAL_PLC',
    components: {
      plc: { status: online(backend.components?.modbus) ? 'ONLINE' : 'OFFLINE', protocol: 'Modbus/TCP' },
      gateway: { status: 'ONLINE', protocol: 'Passive DPI' },
      database: { status: online(backend.components?.database) ? 'ONLINE' : 'OFFLINE' },
      copilot: { status: online(backend.components?.ai_copilot) ? 'ONLINE' : 'DEGRADED' },
    },
    backend,
  });
}
