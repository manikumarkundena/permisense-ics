export type LiveEvent = {
  event_id: string;
  timestamp: string;
  source: string;
  event_type: string;
  asset_id?: string | null;
  asset_type?: string | null;
  source_address?: string | null;
  destination_address?: string | null;
  protocol?: string | null;
  command?: string | null;
  register_address?: number | null;
  previous_value?: number | null;
  value?: number | null;
  unit?: string | null;
  process_id?: string | null;
  severity?: string | null;
  metadata?: Record<string, unknown>;
};

export type Incident = {
  incident_id: string;
  timestamp: string;
  asset_id: string;
  process_id: string;
  severity: string;
  title: string;
  reason: string;
  status?: string;
  event_ids?: string[];
  detection_ids?: string[];
  detections?: Array<Record<string, unknown>>;
  mitre_mappings?: Array<Record<string, unknown>>;
  impact?: Record<string, unknown> | null;
  risk?: Record<string, unknown> | null;
  evidence_graph?: Record<string, unknown> | null;
  response?: Record<string, unknown>;
  control?: Record<string, unknown>;
  process_events?: Array<Record<string, unknown>>;
};

export type SystemStatus = {
  service: string;
  status: string;
  components: Record<string, string>;
};

export type ResponsePlan = {
  incident_id: string;
  recommendations: Array<{
    action: string;
    description: string;
    register_address: number;
    current_value?: number | null;
    target_value: number;
    requires_human_approval: boolean;
  }>;
  approved: boolean;
  executed: boolean;
  recovered: boolean;
};

export type ResponseExecution = {
  status: string;
  incident_id: string;
  response: Record<string, unknown>;
};

export type RecoveryResult = {
  incident_id: string;
  recovered: boolean;
  actual_speed: number;
  threshold: number;
  status: string;
};
