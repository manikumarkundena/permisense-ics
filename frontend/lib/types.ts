/**
 * PermiSense: Cyber-Physical Incident Intelligence & Response
 * TypeScript Definitions matching authoritative OpenAPI & Backend Contracts
 */

export type ProcessStateCode = 0 | 1 | 2 | 3 | 4 | 5;

export const PROCESS_STATE_MAP: Record<ProcessStateCode, string> = {
  0: 'STOPPED',
  1: 'STARTING',
  2: 'RUNNING',
  3: 'DEGRADED',
  4: 'JAMMED',
  5: 'FAULT',
};

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentStatus = 'OPEN' | 'INVESTIGATING' | 'CONTAINED' | 'RECOVERED' | 'CLOSED';
export type ResponseApprovalState = 'PENDING' | 'APPROVED';
export type ResponseExecutionState = 'PENDING' | 'EXECUTING' | 'EXECUTED';
export type RecoveryState = 'UNRECOVERED' | 'VERIFYING' | 'RECOVERED';

export interface SystemComponentStatus {
  status: 'ONLINE' | 'OFFLINE' | 'DEGRADED' | 'UNAVAILABLE';
  protocol?: string;
  ip?: string;
  port?: number;
  connection?: string;
  last_check?: string;
  details?: Record<string, unknown>;
}

export interface SystemStatusResponse {
  status: 'HEALTHY' | 'WARNING' | 'ALERT' | 'OFFLINE';
  timestamp: string;
  version?: string;
  runtime_mode?: string;
  components: {
    plc: SystemComponentStatus;
    gateway: SystemComponentStatus;
    database: SystemComponentStatus;
    copilot: SystemComponentStatus;
  };
  backend?: Record<string, unknown>;
}

export interface HealthResponse {
  status: 'ok' | 'degraded';
  timestamp?: string;
  version?: string;
  mode?: string;
  service?: string;
  environment?: string;
  checks?: Record<string, unknown>;
}

export interface TelemetryEvent {
  event_id: string;
  timestamp: string;
  source: string;
  event_type: string;
  asset_id?: string;
  asset_type?: string;
  source_address?: string;
  destination_address?: string;
  protocol?: string;
  command?: string;
  register_address?: number;
  register?: string;
  value?: number;
  previous_value?: number;
  unit?: string;
  process_id?: string;
  severity?: string;
  message: string;
  channel?: 'MODBUS_DPI' | 'PLC_TELEMETRY' | 'CORRELATION_ENGINE' | 'RESPONSE_EXEC' | 'SYSTEM';
  raw_payload?: Record<string, unknown>;
}

export interface ResponseRecommendation {
  action: string;
  description: string;
  register_address: number;
  register_name?: string;
  current_value?: number;
  target_value: number;
  unit?: string;
  requires_human_approval: boolean;
  verification_register?: number | null;
  verification_register_name?: string | null;
  verification_type?: string;
  verification_threshold?: string;
}

export interface ResponsePlan {
  incident_id: string;
  recommendations: ResponseRecommendation[];
  approved: boolean;
  approved_by?: string | null;
  approved_at?: string | null;
  executed: boolean;
  executed_at?: string | null;
  recovered: boolean;
  approval_state: ResponseApprovalState;
  execution_state: ResponseExecutionState;
  recovery_state: RecoveryState;
  recommended_action: string;
  description: string;
  register: string;
  register_name: string;
  current_value: number;
  target_value: number;
  unit: string;
  verification_register: string;
  verification_threshold: string;
  approved_by_display?: string;
  [key: string]: unknown;
}

export interface RecoveryVerificationResult {
  incident_id?: string;
  recovered: boolean;
  control_register?: number;
  control_value?: number;
  target_value?: number;
  process_register?: number | null;
  process_value?: number | null;
  verification_type?: string;
  verification_threshold?: string;
  verified_at?: string;
  status?: string;
  [key: string]: unknown;
}

export interface IncidentSummary {
  incident_id: string;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  asset_id: string;
  process_id?: string;
  timestamp: string;
  summary?: string;
  reason?: string;
  process_name?: string;
  risk_score?: number;
  risk?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface IncidentDetail extends IncidentSummary {
  asset: {
    id: string;
    name: string;
    zone: string;
  };
  process: {
    id: string;
    name: string;
  };
  control_change: {
    register: string;
    register_name: string;
    previous_value: number;
    new_value: number;
    unit: string;
  };
  process_deviation: {
    register: string;
    physical_sensor: string;
    peak_observed: number;
    unit: string;
  };
  detection: {
    rule_id: string;
    detector: string;
    confidence: string;
  };
  correlation: {
    time_delta_ms: number | null;
    causality_score: number | null;
    window_seconds?: number | null;
  };
  mitre_attack: Array<{
    technique_id: string;
    tactic: string;
    technique_name: string;
    description: string;
  }>;
  operational_impact: {
    physical_process_state: string;
    safe_limit: number;
    observed_value: number;
    unit: string;
    summary: string;
  };
  risk: {
    score: number;
    level: string;
    calculation_timestamp: string;
    factors: Array<{
      name: string;
      contributed: number;
      weight: number;
      reason: string;
    }>;
  };
  evidence_graph: {
    nodes: Array<{
      id: string;
      type: string;
      label: string;
      sublabel?: string;
      status?: string;
    }>;
    edges: Array<{
      label?: string;
      source?: string;
      target?: string;
    }>;
  };
  response_plan?: ResponsePlan | null;
  [key: string]: unknown;
}

export interface DemoPlcStatus {
  id: string;
  name: string;
  protocol: string;
  host: string;
  port: number;
  connection: 'online' | 'offline' | 'degraded' | string;
  cycle_time_ms?: number;
  scans_completed?: number;
}

export interface DemoControls {
  motor_enable: number | boolean;
  operating_mode: number;
  speed_setpoint: number;
  acceleration_limit: number;
  production_target: number;
  overspeed_limit: number;
  high_load_limit: number;
  jam_timeout: number;
  config_version: number;
}

export interface DemoProcess {
  speed: number;
  current: number;
  load: number;
  position: number;
  workpieces: number;
  jam: number | boolean;
  state: number;
  state_label?: string;
}

export interface DemoStatusResponse {
  status: 'ready' | 'offline' | 'degraded';
  plc: DemoPlcStatus;
  process: DemoProcess | 'unavailable';
  controls: DemoControls;
  scenarios: {
    speed_attack_active: boolean;
    mode_attack_active: boolean;
    last_scenario_time: string | null;
  };
  error?: string;
}

export interface CopilotBriefResponse {
  incident_id: string;
  generated_at: string;
  summary: string;
  evidence_breakdown: string[];
  operational_impact: string;
  recommended_action: string;
  confidence_and_limitations: string;
  model: string;
}

export interface CopilotChatResponse {
  incident_id: string;
  question: string;
  answer: string;
  evidence_used: string[];
  action_advisory: string;
  limitations: string;
}
