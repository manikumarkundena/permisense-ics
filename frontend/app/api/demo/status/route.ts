import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function stateLabel(state: number) {
  return ({ 0: 'STOPPED', 1: 'STARTING', 2: 'RUNNING', 3: 'DEGRADED', 4: 'JAMMED', 5: 'FAULT' } as Record<number, string>)[state] || `STATE_${state}`;
}

export async function GET() {
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
  if (!base) return NextResponse.json({ error: 'NEXT_PUBLIC_API_URL is not configured' }, { status: 500 });

  const response = await fetch(`${base}/api/demo/status`, { cache: 'no-store' });
  const backend = await response.json().catch(() => null);

  if (!response.ok || !backend) {
    return NextResponse.json(backend || { error: 'Virtual PLC status unavailable' }, { status: response.status || 502 });
  }

  if (backend.status !== 'ready' || backend.process === 'unavailable') {
    return NextResponse.json(backend, { status: response.status });
  }

  return NextResponse.json({
    status: backend.status,
    plc: {
      id: 'PLC-01',
      name: 'PermiSense Virtual PLC',
      protocol: 'Modbus/TCP',
      host: 'backend',
      port: 5020,
      connection: backend.plc,
    },
    process: {
      ...backend.process,
      state_label: stateLabel(Number(backend.process.state)),
    },
    controls: backend.controls,
    scenarios: {
      speed_attack_active: Number(backend.controls?.speed_setpoint) > Number(backend.controls?.overspeed_limit),
      mode_attack_active: Number(backend.controls?.operating_mode) === 0,
      last_scenario_time: null,
    },
  });
}
