export type LiveEvent = {
  event_id: string;
  timestamp: string;
  source: string;
  event_type: string;
  asset_id?: string | null;
  asset_type?: string | null;
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
  correlation_id: string;
  timestamp: string;
  asset_id: string;
  process_id: string;
  severity: string;
  title: string;
  reason: string;
  event_ids?: string[];
  detection_ids?: string[];
  evidence?: Record<string, unknown>;
  risk?: Record<string, unknown>;
  impact?: Record<string, unknown>;
  mitre_mappings?: Array<Record<string, unknown>>;
  evidence_graph?: Record<string, unknown>;
};

export type SystemStatus = {
  service: string;
  status: string;
  components: Record<string, string>;
};
