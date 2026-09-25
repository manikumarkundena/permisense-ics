import type {
  HealthResponse,
  SystemStatusResponse,
  TelemetryEvent,
  IncidentSummary,
  IncidentDetail,
  IncidentStatus,
  ResponsePlan,
  RecoveryVerificationResult,
  DemoStatusResponse,
  CopilotBriefResponse,
  CopilotChatResponse,
} from './types';

export class ApiError extends Error {
  status: number;
  detail?: string;
  endpoint: string;

  constructor(status: number, message: string, endpoint: string, detail?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
    this.endpoint = endpoint;
  }
}

const getBaseUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!envUrl) {
    throw new Error('NEXT_PUBLIC_API_URL is not configured. Point the frontend at the real PermiSense API.');
  }
  return envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: HeadersInit = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      cache: 'no-store',
    });

    if (!res.ok) {
      let detailMsg = `HTTP Error ${res.status}`;
      try {
        const errorJson = await res.json();
        const rawDetail = errorJson?.detail ?? errorJson?.message ?? errorJson?.error;
        detailMsg =
          typeof rawDetail === 'string'
            ? rawDetail
            : rawDetail != null
            ? JSON.stringify(rawDetail)
            : JSON.stringify(errorJson);
      } catch {
        const text = await res.text();
        if (text) detailMsg = text;
      }
      throw new ApiError(res.status, `Request to ${endpoint} failed: ${detailMsg}`, endpoint, detailMsg);
    }

    return (await res.json()) as T;
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err;
    const message = err instanceof Error ? err.message : 'Unknown network failure';
    throw new ApiError(0, `Network failure requesting ${endpoint}: ${message}`, endpoint, message);
  }
}

function unwrapList<T>(payload: T[] | { incidents?: T[]; events?: T[] }): T[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.incidents)) return payload.incidents;
  if (Array.isArray(payload.events)) return payload.events;
  return [];
}

function normalizeIncidentStatus(status: unknown): IncidentStatus {
  const value = String(status ?? 'open').toUpperCase();
  if (value === 'RESPONDED' || value === 'ACTION_PENDING') return 'CONTAINED';
  if (value === 'OPEN' || value === 'INVESTIGATING' || value === 'CONTAINED' || value === 'RECOVERED' || value === 'CLOSED') {
    return value as IncidentStatus;
  }
  return 'OPEN';
}

function normalizeResponsePlan(raw: Record<string, any>): ResponsePlan | null {
  const recommendations = Array.isArray(raw.recommendations) ? raw.recommendations : [];
  const first = recommendations[0];
  if (!first) return null;

  const registerAddress = Number(first.register_address);
  const verificationRegister =
    first.verification_register === null || first.verification_register === undefined
      ? null
      : Number(first.verification_register);

  const approvalState = raw.approval_state ?? (raw.approved ? 'APPROVED' : 'PENDING');
  const executionState = raw.execution_state ?? (raw.executed ? 'EXECUTED' : 'PENDING');
  const recoveryState =
    raw.recovery_state ??
    (raw.recovered ? 'RECOVERED' : raw.executed ? 'VERIFYING' : 'UNRECOVERED');

  return {
    ...raw,
    incident_id: String(raw.incident_id ?? ''),
    recommendations: recommendations.map((item: any) => ({
      action: String(item.action ?? ''),
      description: String(item.description ?? ''),
      register_address: Number(item.register_address),
      register_name: item.register_name ? String(item.register_name) : undefined,
      current_value: item.current_value == null ? undefined : Number(item.current_value),
      target_value: Number(item.target_value ?? 0),
      unit: item.unit ? String(item.unit) : '',
      requires_human_approval: item.requires_human_approval !== false,
      verification_register: item.verification_register == null ? null : Number(item.verification_register),
      verification_register_name: item.verification_register_name
        ? String(item.verification_register_name)
        : null,
      verification_type: item.verification_type ? String(item.verification_type) : undefined,
      verification_threshold: item.verification_threshold
        ? String(item.verification_threshold)
        : undefined,
    })),
    approved: Boolean(raw.approved),
    approved_by: raw.approved_by ? String(raw.approved_by) : null,
    approved_at: raw.approved_at ? String(raw.approved_at) : null,
    executed: Boolean(raw.executed),
    executed_at: raw.executed_at ? String(raw.executed_at) : null,
    recovered: Boolean(raw.recovered),
    approval_state: String(approvalState) as ResponsePlan['approval_state'],
    execution_state: String(executionState) as ResponsePlan['execution_state'],
    recovery_state: String(recoveryState) as ResponsePlan['recovery_state'],
    recommended_action: String(first.action ?? ''),
    description: String(first.description ?? ''),
    register: Number.isFinite(registerAddress) ? 'R' + registerAddress : 'UNKNOWN',
    register_name: String(first.register_name ?? ('Register ' + registerAddress)),
    current_value: Number(first.current_value ?? 0),
    target_value: Number(first.target_value ?? 0),
    unit: String(first.unit ?? ''),
    verification_register: verificationRegister == null ? 'N/A' : 'R' + verificationRegister,
    verification_threshold: String(first.verification_threshold ?? 'Backend-defined recovery criterion'),
  };
}


function normalizeCopilotBrief(raw: Record<string, any>): CopilotBriefResponse {
  const copilot = raw.copilot ?? raw;
  const evidence = Array.isArray(copilot.evidence)
    ? copilot.evidence.map((item: unknown) => String(item))
    : [];

  return {
    incident_id: String(raw.incident_id ?? ''),
    generated_at: String(raw.generated_at ?? new Date().toISOString()),
    summary: String(copilot.summary ?? ''),
    evidence_breakdown: evidence,
    operational_impact: String(copilot.impact ?? ''),
    recommended_action: String(copilot.recommended_action ?? 'No response recommendation returned.'),
    confidence_and_limitations: String(
      copilot.confidence_note ?? 'The backend did not provide additional confidence notes.'
    ),
    model: String(copilot.model ?? 'backend-configured model'),
  };
}

function normalizeCopilotChat(raw: Record<string, any>): CopilotChatResponse {
  const copilot = raw.copilot ?? raw;

  return {
    incident_id: String(raw.incident_id ?? ''),
    question: String(raw.question ?? ''),
    answer: String(copilot.answer ?? ''),
    evidence_used: Array.isArray(copilot.evidence_used)
      ? copilot.evidence_used.map((item: unknown) => String(item))
      : [],
    action_advisory: String(copilot.action_advisory ?? ''),
    limitations: String(copilot.limitation ?? copilot.limitations ?? ''),
  };
}

function normalizeIncident(raw: Record<string, any>): IncidentDetail {
  const control = raw.control ?? {};
  const impact = raw.impact ?? {};
  const riskRaw = raw.risk ?? {};
  const detections = Array.isArray(raw.detections) ? raw.detections : [];
  const firstDetection = detections[0] ?? {};
  const mitre = Array.isArray(raw.mitre_mappings) ? raw.mitre_mappings : [];
  const graph = raw.evidence_graph ?? {};
  const processEvents = Array.isArray(raw.process_events) ? raw.process_events : [];

  const impactRegister = Number(impact.evidence?.register_address);
  const relevantProcessEvents = processEvents.filter((event: any) => {
    const register = Number(event?.register_address);
    return Number.isFinite(impactRegister)
      ? register === impactRegister
      : register === 30001;
  });
  const processPeak = (relevantProcessEvents.length ? relevantProcessEvents : processEvents).reduce(
    (peak: number | null, event: any) => {
      const value = Number(event?.value);
      return Number.isFinite(value) ? Math.max(peak ?? value, value) : peak;
    },
    null
  );

  const riskScore = Number(riskRaw.score ?? raw.risk_score ?? 0);
  const riskFactors = Array.isArray(riskRaw.factors)
    ? riskRaw.factors
    : Object.entries(riskRaw.factors ?? {}).map(([name, value]) => ({
        name,
        contributed: Number(value ?? 0),
        weight: Number(value ?? 0),
        reason: '',
      }));

  return {
    ...raw,
    incident_id: String(raw.incident_id ?? 'UNKNOWN'),
    title: String(raw.title ?? 'Industrial incident'),
    severity: String(raw.severity ?? 'MEDIUM').toUpperCase() as IncidentSummary['severity'],
    status: normalizeIncidentStatus(raw.status),
    asset_id: String(raw.asset_id ?? 'UNKNOWN'),
    process_id: raw.process_id ? String(raw.process_id) : undefined,
    timestamp: String(raw.timestamp ?? new Date().toISOString()),
    asset: {
      id: String(raw.asset_id ?? 'UNKNOWN'),
      name: String(raw.asset_id ?? 'Industrial Asset'),
      zone: 'Industrial Cell',
    },
    process: {
      id: String(raw.process_id ?? 'UNKNOWN'),
      name: String(raw.process_id ?? 'Industrial Process'),
    },
    process_name: String(raw.process_id ?? 'Industrial Process'),
    control_change: {
      register: control.register_address != null ? 'R' + control.register_address : 'UNKNOWN',
      register_name: String(
        control.register_name ??
          ({
            40001: 'Motor enable',
            40002: 'Operating mode',
            40003: 'Speed setpoint',
            40004: 'Acceleration limit',
            40005: 'Production target',
            40010: 'Overspeed limit',
            40011: 'High-load limit',
            40012: 'Jam timeout',
            40013: 'Configuration version',
          } as Record<number, string>)[Number(control.register_address)] ??
          'Control register'
      ),
      previous_value: Number(control.previous_value ?? 0),
      new_value: Number(control.new_value ?? 0),
      unit: String(
        control.unit ??
          ({
            40003: '%',
            40004: '%/s',
            40005: 'parts/min',
            40010: '%',
            40011: '%',
            40012: 's',
          } as Record<number, string>)[Number(control.register_address)] ??
          ''
      ),
    },
    process_deviation: {
      register: impact.evidence?.register_address != null
        ? 'R' + impact.evidence.register_address
        : processEvents[0]?.register_address != null
        ? 'R' + processEvents[0].register_address
        : 'UNKNOWN',
      physical_sensor: String(impact.title ?? 'Process telemetry'),
      peak_observed: Number(
        impact.evidence?.value ??
          impact.observed_value ??
          processPeak ??
          0
      ),
      unit: String(impact.evidence?.unit ?? impact.unit ?? 'value'),
    },
    detection: {
      rule_id: String(firstDetection.rule_id ?? firstDetection.detection_id ?? 'CORRELATION'),
      detector: String(firstDetection.detector ?? firstDetection.description ?? 'Deterministic correlation engine'),
      confidence: String(firstDetection.confidence ?? 'CORRELATED'),
    },
    correlation: {
      time_delta_ms:
        raw.correlation?.time_delta_ms == null
          ? null
          : Number(raw.correlation.time_delta_ms),
      causality_score:
        raw.correlation?.causality_score == null
          ? null
          : Number(raw.correlation.causality_score),
      window_seconds:
        raw.window_seconds == null
          ? (Number(raw.evidence?.window_seconds) || null)
          : Number(raw.window_seconds),
    },
    mitre_attack: mitre.map((item: any) => ({
      technique_id: String(item.technique_id ?? item.id ?? 'UNKNOWN'),
      tactic: String(item.tactic ?? 'ICS'),
      technique_name: String(item.technique_name ?? item.name ?? 'Mapped technique'),
      description: String(item.description ?? ''),
    })),
    operational_impact: {
      physical_process_state: String(
        impact.title ??
          impact.impact_type ??
          impact.physical_process_state ??
          'PROCESS DEVIATION'
      ),
      safe_limit: Number(impact.evidence?.threshold ?? impact.safe_limit ?? 0),
      observed_value: Number(
        impact.evidence?.value ??
          impact.observed_value ??
          processPeak ??
          0
      ),
      unit: String(impact.evidence?.unit ?? impact.unit ?? 'value'),
      summary: String(
        impact.description ??
          impact.summary ??
          raw.reason ??
          'Correlated cyber-physical process deviation.'
      ),
    },
    risk: {
      score: Number.isFinite(riskScore) ? riskScore : 0,
      level: String(riskRaw.level ?? 'unknown'),
      calculation_timestamp: String(riskRaw.calculation_timestamp ?? raw.timestamp ?? new Date().toISOString()),
      factors: riskFactors.map((factor: any) => ({
        name: String(factor.name ?? 'Risk factor'),
        contributed: Number(factor.contributed ?? 0),
        weight: Number(factor.weight ?? 0),
        reason: String(factor.reason ?? ''),
      })),
    },
    evidence_graph: {
      nodes: Array.isArray(graph.nodes) ? graph.nodes.map((node: any, index: number) => ({
        id: String(node.id ?? node.type ?? `evidence-${index}`),
        type: String(node.type ?? 'EVIDENCE'),
        label: String(node.label ?? node.name ?? ''),
        sublabel: node.sublabel ? String(node.sublabel) : undefined,
        status: node.status ? String(node.status) : undefined,
      })) : [],
      edges: Array.isArray(graph.edges) ? graph.edges.map((edge: any) => ({
        label: edge.label ? String(edge.label) : edge.relation ? String(edge.relation) : undefined,
        source: edge.source ? String(edge.source) : undefined,
        target: edge.target ? String(edge.target) : undefined,
      })) : [],
    },
    response_plan: null,
    risk_score: Number.isFinite(riskScore) ? riskScore : undefined,
  };
}

export const apiClient = {
  getHealth: () => request<HealthResponse>('/api/health'),

  getSystemStatus: async (): Promise<SystemStatusResponse> => {
    const backend = await request<Record<string, any>>('/api/system/status');
    const status = String(backend.status ?? '').toLowerCase();

    const componentStatus = (value: unknown): SystemStatusResponse['components']['plc']['status'] => {
      const normalized = String(value ?? '').toLowerCase();
      if (normalized === 'online' || normalized === 'configured') return 'ONLINE';
      if (normalized === 'degraded') return 'DEGRADED';
      if (normalized === 'offline') return 'OFFLINE';
      return 'UNAVAILABLE';
    };

    return {
      status:
        status === 'operational'
          ? 'HEALTHY'
          : status === 'degraded'
          ? 'WARNING'
          : 'OFFLINE',
      timestamp: new Date().toISOString(),
      version: String(backend.version ?? 'backend'),
      runtime_mode: 'REAL_MODBUS_VIRTUAL_PLC',
      components: {
        plc: {
          status: componentStatus(backend.components?.modbus),
          protocol: 'Modbus/TCP',
        },
        gateway: {
          status: 'ONLINE',
          protocol: 'Passive DPI',
        },
        database: {
          status: componentStatus(backend.components?.database),
        },
        copilot: {
          status: componentStatus(backend.components?.ai_copilot),
        },
      },
      backend,
    };
  },

  // Telemetry history is not exposed by the authoritative backend.
  // Live telemetry arrives through /ws/events instead.
  getTelemetryEvents: async (limit = 80) => {
    const payload = await request<TelemetryEvent[] | { events?: TelemetryEvent[] }>(
      `/api/telemetry/events?limit=${limit}`
    );
    return unwrapList(payload);
  },

  getIncidents: async () => {
    const payload = await request<IncidentSummary[] | { incidents?: IncidentSummary[] }>(
      '/api/incidents'
    );
    return unwrapList(payload).map((item) => normalizeIncident(item as unknown as Record<string, any>));
  },

  getIncident: async (incidentId: string) => {
    const payload = await request<Record<string, any>>(
      `/api/incidents/${encodeURIComponent(incidentId)}`
    );
    return normalizeIncident(payload);
  },

  updateIncidentStatus: (incidentId: string, status: IncidentStatus) => {
    const backendStatus =
      status === 'CONTAINED'
        ? 'responded'
        : String(status).toLowerCase();

    return request<IncidentSummary>(
      `/api/incidents/${encodeURIComponent(incidentId)}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status: backendStatus }),
      }
    );
  },

  getResponsePlan: async (incidentId: string): Promise<ResponsePlan | null> => {
    const payload = await request<Record<string, any>>(
      `/api/incidents/${encodeURIComponent(incidentId)}/response`
    );
    return normalizeResponsePlan(payload);
  },

  approveResponse: (incidentId: string, action: string, approvedBy = 'operator') =>
    request<{ success?: boolean; status: string; response?: unknown }>(
      `/api/incidents/${encodeURIComponent(incidentId)}/response/approve`,
      {
        method: 'POST',
        body: JSON.stringify({ action, approved_by: approvedBy }),
      }
    ),

  verifyRecovery: (incidentId: string) =>
    request<RecoveryVerificationResult>(
      `/api/incidents/${encodeURIComponent(incidentId)}/response/verify`,
      { method: 'POST' }
    ),

  getDemoStatus: async (): Promise<DemoStatusResponse> => {
    const payload = await request<{
      status: 'ready' | 'offline' | 'degraded';
      plc: string | DemoStatusResponse['plc'];
      process: DemoStatusResponse['process'];
      controls?: DemoStatusResponse['controls'];
      scenarios?: {
        speed?: string;
        mode?: string;
        speed_attack_active?: boolean;
        mode_attack_active?: boolean;
        last_scenario_time?: string | null;
      };
      error?: string;
    }>('/api/demo/status');

    // Normalize the live backend response once so every UI surface consumes
    // the same contract. The backend returns raw PLC status strings; the
    // frontend route may return the richer PLC object.
    const plc =
      typeof payload.plc === 'string'
        ? {
            id: 'PLC-01',
            name: 'PermiSense Virtual PLC',
            protocol: 'Modbus/TCP',
            host: 'backend',
            port: 5020,
            connection: payload.plc,
          }
        : payload.plc;

    const controls = payload.controls ?? {
      motor_enable: 0,
      operating_mode: 0,
      speed_setpoint: 0,
      acceleration_limit: 0,
      production_target: 0,
      overspeed_limit: 75,
      high_load_limit: 80,
      jam_timeout: 5,
      config_version: 0,
    };

    const process =
      payload.process === 'unavailable'
        ? 'unavailable'
        : {
            ...payload.process,
            state_label:
              payload.process.state_label ??
              ({ 0: 'STOPPED', 1: 'STARTING', 2: 'RUNNING', 3: 'DEGRADED', 4: 'JAMMED', 5: 'FAULT' } as Record<number, string>)[payload.process.state] ??
              `STATE_${payload.process.state}`,
          };

    return {
      status: payload.status,
      plc,
      process,
      controls,
      scenarios: {
        speed_attack_active:
          payload.scenarios?.speed_attack_active ??
          (Number(controls.speed_setpoint) > Number(controls.overspeed_limit)),
        mode_attack_active:
          payload.scenarios?.mode_attack_active ??
          (Number(controls.operating_mode) === 0),
        last_scenario_time: payload.scenarios?.last_scenario_time ?? null,
      },
      error: payload.error,
    };
  },

  triggerSpeedScenario: () =>
    request<{ scenario?: string; description?: string; result?: { register_address?: number; previous_value?: number; value?: number; execution?: string; allowlisted?: boolean } }>(
      '/api/demo/scenarios/speed',
      { method: 'POST' }
    ),

  triggerModeScenario: () =>
    request<{ scenario?: string; description?: string; result?: { register_address?: number; previous_value?: number; value?: number; execution?: string; allowlisted?: boolean } }>(
      '/api/demo/scenarios/mode',
      { method: 'POST' }
    ),

  resetDemo: () =>
    request<{ success?: boolean; message?: string; description?: string; state?: unknown }>(
      '/api/demo/reset',
      { method: 'POST' }
    ),

  generateCopilotBrief: async (incidentId: string): Promise<CopilotBriefResponse> => {
    const payload = await request<Record<string, any>>(
      `/api/incidents/${encodeURIComponent(incidentId)}/copilot`,
      { method: 'POST' }
    );
    return normalizeCopilotBrief(payload);
  },

  askCopilot: async (incidentId: string, question: string): Promise<CopilotChatResponse> => {
    const payload = await request<Record<string, any>>(
      `/api/incidents/${encodeURIComponent(incidentId)}/copilot/chat`,
      {
        method: 'POST',
        body: JSON.stringify({ question }),
      }
    );
    return normalizeCopilotChat(payload);
  },
};
