import type {
  DemoStatusResponse,
  IncidentDetail,
  IncidentSummary,
  IncidentStatus,
  ResponsePlan,
  RecoveryVerificationResult,
  TelemetryEvent,
  SystemStatusResponse,
} from '../types';

interface CellInternalState {
  plcConnection: 'CONNECTED' | 'DISCONNECTED';
  speedSetpoint: number;
  motorEnable: boolean;
  operatingMode: number;
  actualSpeed: number;
  motorCurrent: number;
  motorLoad: number;
  position: number;
  workpieces: number;
  isJammed: boolean;
  processState: 0 | 1 | 2 | 3 | 4 | 5;
  speedAttackActive: boolean;
  modeAttackActive: boolean;
  lastScenarioTime: string | null;
  scansCompleted: number;
}

class VirtualIndustrialCell {
  private state: CellInternalState = {
    plcConnection: 'CONNECTED',
    speedSetpoint: 50,
    motorEnable: true,
    operatingMode: 1, // 1: Auto, 2: Jog, 3: Unrestricted Manual
    actualSpeed: 50,
    motorCurrent: 4.2,
    motorLoad: 42,
    position: 340,
    workpieces: 842,
    isJammed: false,
    processState: 2, // 2: RUNNING
    speedAttackActive: false,
    modeAttackActive: false,
    lastScenarioTime: null,
    scansCompleted: 14520,
  };

  private events: TelemetryEvent[] = [];
  private incidents: Map<string, IncidentDetail> = new Map();
  private listeners: Set<(event: TelemetryEvent) => void> = new Set();
  private tickerInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.seedInitialEvents();
    this.startSimulationTicker();
  }

  private seedInitialEvents() {
    const now = new Date(Date.now() - 30000).toISOString();
    this.events = [
      {
        event_id: 'evt-init-01',
        timestamp: now,
        channel: 'PLC_TELEMETRY',
        source: 'PLC-01:Modbus-Slave',
        event_type: 'PROCESS_SAMPLE',
        register: 'R30001',
        register_name: 'Actual Speed',
        value: 50,
        unit: 'RPM',
        message: 'Nominal conveyor speed 50 RPM confirmed by encoder feedback.',
      },
      {
        event_id: 'evt-init-02',
        timestamp: new Date(Date.now() - 20000).toISOString(),
        channel: 'MODBUS_DPI',
        source: 'Gateway-DPI-Eth1',
        event_type: 'CONTROL_WRITE',
        register: 'R40001',
        register_name: 'Motor Enable',
        value: 1,
        unit: 'BOOLEAN',
        message: 'Motor drive enabled by master controller.',
      },
    ];
  }

  private startSimulationTicker() {
    if (this.tickerInterval) return;
    this.tickerInterval = setInterval(() => {
      this.state.scansCompleted += 1;
      
      // Physical simulation step
      if (this.state.motorEnable) {
        // Motor speed approaches setpoint smoothly
        const delta = (this.state.speedSetpoint - this.state.actualSpeed) * 0.25;
        this.state.actualSpeed = Math.round((this.state.actualSpeed + delta) * 10) / 10;

        // Current & load track speed
        this.state.motorCurrent = Math.round((2.0 + (this.state.actualSpeed / 100) * 7.5) * 10) / 10;
        this.state.motorLoad = Math.min(100, Math.round((this.state.actualSpeed / 90) * 88));

        // Position increments
        this.state.position = (this.state.position + Math.round(this.state.actualSpeed / 5)) % 1000;
        if (this.state.position < 20) {
          this.state.workpieces += 1;
        }

        // Process state logic
        if (this.state.actualSpeed > 75) {
          this.state.processState = 3; // DEGRADED
        } else if (this.state.actualSpeed > 0) {
          this.state.processState = 2; // RUNNING
        } else {
          this.state.processState = 0; // STOPPED
        }
      } else {
        this.state.actualSpeed = Math.max(0, this.state.actualSpeed - 5);
        this.state.motorCurrent = 0.4;
        this.state.motorLoad = 0;
        this.state.processState = 0;
      }
    }, 1000);
  }

  public subscribe(listener: (event: TelemetryEvent) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emitEvent(event: TelemetryEvent) {
    this.events.unshift(event);
    if (this.events.length > 200) {
      this.events.pop();
    }
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        // ignore listener errors
      }
    }
  }

  public getSystemStatus(): SystemStatusResponse {
    const isDegraded = this.state.actualSpeed > 75 || this.state.speedAttackActive;
    return {
      status: isDegraded ? 'ALERT' : 'HEALTHY',
      timestamp: new Date().toISOString(),
      version: '1.4.0-permisense',
      runtime_mode: 'VIRTUAL_ICS_CELL_MODBUS_TCP',
      components: {
        plc: {
          status: 'ONLINE',
          protocol: 'Modbus/TCP',
          ip: '192.168.1.10',
          port: 502,
          connection: 'CONNECTED',
          last_check: new Date().toISOString(),
          details: {
            scans_completed: this.state.scansCompleted,
            cycle_time_ms: 100,
          },
        },
        gateway: {
          status: 'ONLINE',
          protocol: 'Passive Ethernet DPI Tap',
          ip: '192.168.1.254',
          connection: 'INTERCEPTING',
          last_check: new Date().toISOString(),
          details: {
            inspection_mode: 'Stateful Modbus Frame Parsing',
            holding_registers_monitored: 9,
            input_registers_monitored: 7,
          },
        },
        database: {
          status: 'ONLINE',
          protocol: 'In-Memory Incident Store',
          connection: 'ACTIVE',
          last_check: new Date().toISOString(),
        },
        copilot: {
          status: 'ONLINE',
          protocol: 'Google Gemini 2.5 Flash Grounded Inference',
          connection: 'READY',
          last_check: new Date().toISOString(),
        },
      },
    };
  }

  public getDemoStatus(): DemoStatusResponse {
    const stateLabelMap = {
      0: 'STOPPED',
      1: 'STARTING',
      2: 'RUNNING',
      3: 'DEGRADED',
      4: 'JAMMED',
      5: 'FAULT',
    };

    return {
      status: 'ONLINE',
      timestamp: new Date().toISOString(),
      cell_name: 'Virtual Cell-01 (Conveyor Line & Drive)',
      plc: {
        id: 'PLC-01',
        name: 'Modbus/TCP Cell Controller',
        protocol: 'Modbus/TCP',
        host: '192.168.1.10',
        port: 502,
        connection: this.state.plcConnection,
        cycle_time_ms: 100,
        scans_completed: this.state.scansCompleted,
      },
      process: {
        speed: this.state.actualSpeed,
        current: this.state.motorCurrent,
        load: this.state.motorLoad,
        position: this.state.position,
        workpieces: this.state.workpieces,
        jam: this.state.isJammed,
        state: this.state.processState,
        state_label: stateLabelMap[this.state.processState],
      },
      controls: {
        motor_enable: this.state.motorEnable,
        operating_mode: this.state.operatingMode,
        speed_setpoint: this.state.speedSetpoint,
        acceleration_limit: 15,
        production_target: 1200,
        overspeed_limit: 75,
        high_load_limit: 85,
        jam_timeout: 5000,
        config_version: 104,
      },
      scenarios: {
        speed_attack_active: this.state.speedAttackActive,
        mode_attack_active: this.state.modeAttackActive,
        last_scenario_time: this.state.lastScenarioTime,
      },
    };
  }

  public getTelemetryEvents(limit = 50): TelemetryEvent[] {
    return this.events.slice(0, limit);
  }

  public getIncidents(): IncidentSummary[] {
    return Array.from(this.incidents.values()).map((inc) => ({
      incident_id: inc.incident_id,
      title: inc.title,
      severity: inc.severity,
      status: inc.status,
      asset_id: inc.asset_id,
      process_name: inc.process_name,
      timestamp: inc.timestamp,
      summary: inc.summary,
      risk_score: inc.risk_score,
    }));
  }

  public getIncident(id: string): IncidentDetail | null {
    return this.incidents.get(id) || null;
  }

  public updateIncidentStatus(id: string, status: IncidentStatus): IncidentSummary | null {
    const inc = this.incidents.get(id);
    if (!inc) return null;
    inc.status = status;
    return {
      incident_id: inc.incident_id,
      title: inc.title,
      severity: inc.severity,
      status: inc.status,
      asset_id: inc.asset_id,
      process_name: inc.process_name,
      timestamp: inc.timestamp,
      summary: inc.summary,
      risk_score: inc.risk_score,
    };
  }

  public getResponsePlan(incidentId: string): ResponsePlan | null {
    const inc = this.incidents.get(incidentId);
    if (!inc) return null;
    return inc.response_plan;
  }

  public triggerSpeedScenario(): {
    triggered: boolean;
    scenario: string;
    register: string;
    value: number;
    incident_id: string;
  } {
    const timestamp = new Date().toISOString();
    const incidentId = `INC-${Date.now().toString().slice(-6)}`;

    // 1. Modbus write: R40003 setpoint 50 -> 90
    const prevVal = this.state.speedSetpoint;
    this.state.speedSetpoint = 90;
    this.state.actualSpeed = 90; // immediately deviates in simulation
    this.state.motorCurrent = 8.8;
    this.state.motorLoad = 88;
    this.state.processState = 3; // DEGRADED
    this.state.speedAttackActive = true;
    this.state.lastScenarioTime = timestamp;

    // 2. Gateway DPI event
    const controlEvent: TelemetryEvent = {
      event_id: `evt-dpi-${Date.now()}`,
      timestamp,
      channel: 'MODBUS_DPI',
      source: '192.168.1.105 (Engineering Workstation)',
      event_type: 'CONTROL_WRITE',
      register: 'R40003',
      register_name: 'Speed Setpoint',
      value: 90,
      unit: 'RPM',
      message: 'Unauthorized Modbus Write Single Register (FC06) to R40003: 50 -> 90 RPM without change ticket.',
    };
    this.emitEvent(controlEvent);

    // 3. Process deviation event
    const deviationEvent: TelemetryEvent = {
      event_id: `evt-proc-${Date.now() + 1}`,
      timestamp: new Date(Date.now() + 620).toISOString(),
      channel: 'PLC_TELEMETRY',
      source: 'PLC-01:Encoder-R30001',
      event_type: 'OVERSPEED_ALERT',
      register: 'R30001',
      register_name: 'Actual Speed',
      value: 90,
      unit: 'RPM',
      message: 'Conveyor actual speed reached 90 RPM, exceeding safety ceiling (75 RPM) by 20.0%.',
    };
    this.emitEvent(deviationEvent);

    // 4. Create authoritative incident
    const incidentDetail: IncidentDetail = {
      incident_id: incidentId,
      title: 'Unauthorized Conveyor Overspeed via Modbus Register Manipulation',
      severity: 'CRITICAL',
      status: 'OPEN',
      asset_id: 'PLC-01',
      process_name: 'Material Conveyor Drive',
      timestamp,
      summary: 'Adversary wrote 90 RPM into holding register R40003 via Modbus/TCP FC06, inducing physical conveyor overspeed and violating the 75 RPM critical process safety boundary.',
      risk_score: 84,
      asset: {
        id: 'PLC-01',
        name: 'Modbus/TCP Cell Controller',
        type: 'Programmable Logic Controller',
        zone: 'Zone 2: Packaging Line Conveyor Cell',
        vendor: 'Schneider / Modicon Virtual Runtime',
        firmware: 'v3.12-rev4',
      },
      process: {
        name: 'Material Conveyor Drive',
        register_speed: 'R30001',
        register_setpoint: 'R40003',
        nominal_speed: 50,
        max_safe_speed: 75,
      },
      control_change: {
        register: 'R40003',
        register_name: 'Speed Setpoint',
        previous_value: prevVal,
        new_value: 90,
        unit: 'RPM',
        timestamp,
        source_ip: '192.168.1.105 (Engineering Workstation)',
        protocol: 'Modbus/TCP',
        function_code: 6,
        authorized: false,
      },
      process_deviation: {
        register: 'R30001',
        register_name: 'Actual Speed',
        baseline: 50,
        peak_observed: 90,
        threshold: 75,
        unit: 'RPM',
        deviation_pct: 80.0,
        onset_delay_ms: 620,
        physical_sensor: 'Optical Quadrature Shaft Encoder (R30001)',
      },
      detection: {
        rule_id: 'DET-ICS-004',
        rule_name: 'Unauthorized Modbus/TCP Speed Override',
        confidence: 'DETERMINISTIC',
        detector: 'Passive Gateway Deep Packet Inspection (DPI)',
        detection_timestamp: timestamp,
      },
      correlation: {
        correlated_events_count: 2,
        correlation_rule: 'CORR-01: Control Write → Process Overspeed within 1000ms window',
        time_delta_ms: 620,
        causality_score: 98,
      },
      mitre_attack: [
        {
          technique_id: 'T0831',
          technique_name: 'Manipulation of Control',
          tactic: 'Impair Process Control',
          description: 'Adversary manipulated holding register R40003 (Speed Setpoint) to an unsafe value of 90 RPM, bypassing engineering safeguards.',
          mitigation_id: 'M1042',
        },
        {
          technique_id: 'T1692.001',
          technique_name: 'Unauthorized Message: Command Message',
          tactic: 'Command and Control',
          description: 'Modbus Function Code 06 (Write Single Register) transmitted from unauthorized host 192.168.1.105 without an approved change maintenance token.',
          mitigation_id: 'M1035',
        },
      ],
      operational_impact: {
        summary: 'Material Conveyor motor speed exceeded safe operational threshold (75 RPM). Risk of belt slippage, mechanical stress, thermal trip on drive inverter, and downstream workpiece ejection.',
        physical_process_state: 'DEGRADED (Process State 3)',
        safe_limit: 75,
        observed_value: 90,
        unit: 'RPM',
        affected_subsystems: [
          'Variable Frequency Drive (VFD-01)',
          'Primary Conveyor Belt Assembly',
          'Downstream Optical Sorting Station',
        ],
      },
      risk: {
        score: 84,
        level: 'CRITICAL',
        calculation_timestamp: timestamp,
        factors: [
          {
            name: 'Safety Boundary Breach',
            weight: 35,
            contributed: 35,
            reason: 'Observed speed 90 RPM exceeds 75 RPM hard safety ceiling by 15 RPM.',
          },
          {
            name: 'Unauthorized Command Source',
            weight: 25,
            contributed: 25,
            reason: 'Origin IP 192.168.1.105 lacks signed engineering ticket authorization.',
          },
          {
            name: 'Physical Deviation Confirmed',
            weight: 24,
            contributed: 24,
            reason: 'Input register R30001 encoder feedback confirms physical plant reaction within 620ms.',
          },
        ],
      },
      evidence_graph: {
        nodes: [
          { id: 'node-ctrl', type: 'EVENT', label: 'Modbus FC06 Write', sublabel: 'R40003: 50 -> 90 RPM', status: 'ALERT' },
          { id: 'node-asset', type: 'ASSET', label: 'PLC-01 Controller', sublabel: 'IP: 192.168.1.10', status: 'WARNING' },
          { id: 'node-threat', type: 'THREAT', label: 'MITRE T0831', sublabel: 'Manipulation of Control', status: 'ALERT' },
          { id: 'node-proc', type: 'PROCESS', label: 'Conveyor Drive Motor', sublabel: 'Encoder R30001: 90 RPM', status: 'ALERT' },
          { id: 'node-impact', type: 'IMPACT', label: 'Process Degraded', sublabel: 'Exceeded safe limit 75 RPM', status: 'ALERT' },
          { id: 'node-risk', type: 'RISK', label: 'Risk Score 84/100', sublabel: 'CRITICAL', status: 'ALERT' },
          { id: 'node-action', type: 'ACTION', label: 'Restore Setpoint', sublabel: 'R40003 -> 50 RPM (Pending Human)', status: 'WARNING' },
        ],
        edges: [
          { id: 'edge-1', source: 'node-ctrl', target: 'node-asset', label: 'targets' },
          { id: 'edge-2', source: 'node-ctrl', target: 'node-threat', label: 'classified as' },
          { id: 'edge-3', source: 'node-ctrl', target: 'node-proc', label: 'drives actuator' },
          { id: 'edge-4', source: 'node-proc', target: 'node-impact', label: 'causes overspeed' },
          { id: 'edge-5', source: 'node-impact', target: 'node-risk', label: 'quantifies severity' },
          { id: 'edge-6', source: 'node-risk', target: 'node-action', label: 'recommends' },
        ],
      },
      response_plan: {
        incident_id: incidentId,
        recommended_action: 'RESTORE_SPEED_SETPOINT',
        description: 'Restore Modbus Holding Register R40003 (Speed Setpoint) to baseline safe operating value (50 RPM)',
        register: 'R40003',
        register_name: 'Speed Setpoint',
        current_value: 90,
        target_value: 50,
        unit: 'RPM',
        approval_requirement: 'MANDATORY_HUMAN_OPERATOR',
        verification_register: 'R30001',
        verification_threshold: '<= 55 RPM',
        approval_state: 'PENDING',
        execution_state: 'PENDING',
        recovery_state: 'UNRECOVERED',
        approved_by: null,
        executed_at: null,
        verified_at: null,
      },
    };

    this.incidents.set(incidentId, incidentDetail);

    return {
      triggered: true,
      scenario: 'UNAUTHORIZED_OVERSPEED_WRITE',
      register: 'R40003',
      value: 90,
      incident_id: incidentId,
    };
  }

  public triggerModeScenario(): {
    triggered: boolean;
    scenario: string;
    register: string;
    value: number;
    incident_id: string;
  } {
    const timestamp = new Date().toISOString();
    const incidentId = `INC-${Date.now().toString().slice(-6)}`;

    this.state.operatingMode = 3; // Unrestricted Manual
    this.state.modeAttackActive = true;
    this.state.lastScenarioTime = timestamp;

    const controlEvent: TelemetryEvent = {
      event_id: `evt-mode-${Date.now()}`,
      timestamp,
      channel: 'MODBUS_DPI',
      source: '192.168.1.112 (Unauthorized Laptop)',
      event_type: 'MODE_CHANGE',
      register: 'R40002',
      register_name: 'Operating Mode',
      value: 3,
      unit: 'MODE_CODE',
      message: 'Unauthorized Modbus Write to R40002: Mode changed from 1 (Auto) to 3 (Unrestricted Manual). Safety interlocks bypassed.',
    };
    this.emitEvent(controlEvent);

    const incidentDetail: IncidentDetail = {
      incident_id: incidentId,
      title: 'Unauthorized Operating Mode Modification via Modbus/TCP',
      severity: 'HIGH',
      status: 'OPEN',
      asset_id: 'PLC-01',
      process_name: 'Material Conveyor Drive',
      timestamp,
      summary: 'Adversary wrote mode value 3 (Unrestricted Manual) to holding register R40002, removing automated interlocks.',
      risk_score: 72,
      asset: {
        id: 'PLC-01',
        name: 'Modbus/TCP Cell Controller',
        type: 'Programmable Logic Controller',
        zone: 'Zone 2: Packaging Line Conveyor Cell',
        vendor: 'Schneider / Modicon Virtual Runtime',
        firmware: 'v3.12-rev4',
      },
      process: {
        name: 'Material Conveyor Drive',
        register_speed: 'R30001',
        register_setpoint: 'R40003',
        nominal_speed: 50,
        max_safe_speed: 75,
      },
      control_change: {
        register: 'R40002',
        register_name: 'Operating Mode',
        previous_value: 1,
        new_value: 3,
        unit: 'MODE',
        timestamp,
        source_ip: '192.168.1.112',
        protocol: 'Modbus/TCP',
        function_code: 6,
        authorized: false,
      },
      process_deviation: {
        register: 'R40002',
        register_name: 'Operating Mode',
        baseline: 1,
        peak_observed: 3,
        threshold: 1,
        unit: 'MODE',
        deviation_pct: 200,
        onset_delay_ms: 110,
        physical_sensor: 'PLC System State Register',
      },
      detection: {
        rule_id: 'DET-ICS-002',
        rule_name: 'Unauthorized PLC Operating Mode Transition',
        confidence: 'DETERMINISTIC',
        detector: 'Gateway DPI Intercept',
        detection_timestamp: timestamp,
      },
      correlation: {
        correlated_events_count: 1,
        correlation_rule: 'CORR-03: Mode override outside change window',
        time_delta_ms: 110,
        causality_score: 95,
      },
      mitre_attack: [
        {
          technique_id: 'T0858',
          technique_name: 'Change Operating Mode',
          tactic: 'Inhibit Response Function',
          description: 'Adversary changed PLC operating mode from Auto to Unrestricted Manual to bypass safety limits.',
        },
      ],
      operational_impact: {
        summary: 'Operating mode set to Unrestricted Manual. Automatic safety shutdown routines are suspended.',
        physical_process_state: 'MANUAL_UNRESTRICTED',
        safe_limit: 1,
        observed_value: 3,
        unit: 'MODE',
        affected_subsystems: ['Safety Interlock Subsystem', 'PLC Emergency Stop Bus'],
      },
      risk: {
        score: 72,
        level: 'HIGH',
        calculation_timestamp: timestamp,
        factors: [
          {
            name: 'Safety Interlock Suspension',
            weight: 40,
            contributed: 40,
            reason: 'Manual mode disarms automatic emergency stop triggers.',
          },
          {
            name: 'Unauthorized Host Transmission',
            weight: 32,
            contributed: 32,
            reason: 'Request originated from unregistered IP 192.168.1.112.',
          },
        ],
      },
      evidence_graph: {
        nodes: [
          { id: 'node-ctrl', type: 'EVENT', label: 'Modbus Write R40002=3', sublabel: 'Manual Mode', status: 'ALERT' },
          { id: 'node-asset', type: 'ASSET', label: 'PLC-01 Controller', sublabel: '192.168.1.10', status: 'WARNING' },
          { id: 'node-threat', type: 'THREAT', label: 'MITRE T0858', sublabel: 'Change Operating Mode', status: 'ALERT' },
          { id: 'node-impact', type: 'IMPACT', label: 'Interlocks Suspended', sublabel: 'Safety bypass', status: 'ALERT' },
          { id: 'node-action', type: 'ACTION', label: 'Restore Auto Mode', sublabel: 'R40002 -> 1', status: 'WARNING' },
        ],
        edges: [
          { id: 'e1', source: 'node-ctrl', target: 'node-asset' },
          { id: 'e2', source: 'node-ctrl', target: 'node-threat' },
          { id: 'e3', source: 'node-threat', target: 'node-impact' },
          { id: 'e4', source: 'node-impact', target: 'node-action' },
        ],
      },
      response_plan: {
        incident_id: incidentId,
        recommended_action: 'RESTORE_AUTO_MODE',
        description: 'Restore Modbus Holding Register R40002 to value 1 (Auto Mode) and re-engage interlocks.',
        register: 'R40002',
        register_name: 'Operating Mode',
        current_value: 3,
        target_value: 1,
        unit: 'MODE',
        approval_requirement: 'MANDATORY_HUMAN_OPERATOR',
        verification_register: 'R40002',
        verification_threshold: '== 1',
        approval_state: 'PENDING',
        execution_state: 'PENDING',
        recovery_state: 'UNRECOVERED',
        approved_by: null,
        executed_at: null,
        verified_at: null,
      },
    };

    this.incidents.set(incidentId, incidentDetail);

    return {
      triggered: true,
      scenario: 'UNAUTHORIZED_MODE_WRITE',
      register: 'R40002',
      value: 3,
      incident_id: incidentId,
    };
  }

  public approveResponse(
    incidentId: string,
    action: string,
    approvedBy: string
  ): { success: boolean; action_executed: string; executed_at: string; status: string } {
    const inc = this.incidents.get(incidentId);
    if (!inc) {
      throw new Error(`Incident ${incidentId} not found in database.`);
    }

    if (inc.response_plan.recommended_action !== action) {
      throw new Error(`Action "${action}" does not match allowlisted recommendation "${inc.response_plan.recommended_action}".`);
    }

    const now = new Date().toISOString();
    inc.response_plan.approval_state = 'APPROVED';
    inc.response_plan.approved_by = approvedBy;
    inc.response_plan.execution_state = 'EXECUTED';
    inc.response_plan.executed_at = now;
    inc.status = 'CONTAINED';

    // Execute actual Modbus remediation against Virtual PLC
    if (action === 'RESTORE_SPEED_SETPOINT') {
      this.state.speedSetpoint = 50;
      this.state.actualSpeed = 50;
      this.state.motorCurrent = 4.2;
      this.state.motorLoad = 42;
      this.state.processState = 2; // RUNNING
      this.state.speedAttackActive = false;

      this.emitEvent({
        event_id: `evt-resp-${Date.now()}`,
        timestamp: now,
        channel: 'RESPONSE_EXEC',
        source: 'PermiSense Response Engine (Authorized Operator)',
        event_type: 'RESPONSE_APPLIED',
        register: 'R40003',
        register_name: 'Speed Setpoint',
        value: 50,
        unit: 'RPM',
        message: 'Modbus FC06 Write executed to R40003: Restored safe setpoint 50 RPM upon explicit human operator approval.',
      });
    } else if (action === 'RESTORE_AUTO_MODE') {
      this.state.operatingMode = 1;
      this.state.modeAttackActive = false;

      this.emitEvent({
        event_id: `evt-resp-${Date.now()}`,
        timestamp: now,
        channel: 'RESPONSE_EXEC',
        source: 'PermiSense Response Engine (Authorized Operator)',
        event_type: 'RESPONSE_APPLIED',
        register: 'R40002',
        register_name: 'Operating Mode',
        value: 1,
        unit: 'MODE',
        message: 'Modbus FC06 Write executed to R40002: Restored Auto Mode (1) upon explicit human operator approval.',
      });
    }

    return {
      success: true,
      action_executed: action,
      executed_at: now,
      status: 'CONTAINED',
    };
  }

  public verifyRecovery(incidentId: string): RecoveryVerificationResult {
    const inc = this.incidents.get(incidentId);
    if (!inc) {
      throw new Error(`Incident ${incidentId} not found.`);
    }

    const plan = inc.response_plan;
    if (plan.execution_state !== 'EXECUTED') {
      throw new Error('Cannot verify recovery: Response action has not been executed yet.');
    }

    const now = new Date().toISOString();

    if (plan.recommended_action === 'RESTORE_SPEED_SETPOINT') {
      const readbackVal = this.state.speedSetpoint;
      const actualSpeed = this.state.actualSpeed;
      const readbackMatch = readbackVal === 50;
      const speedWithinBounds = actualSpeed <= 55 && actualSpeed >= 45;
      const recovered = readbackMatch && speedWithinBounds;

      if (recovered) {
        plan.recovery_state = 'RECOVERED';
        plan.verified_at = now;
        inc.status = 'RECOVERED';

        this.emitEvent({
          event_id: `evt-verif-${Date.now()}`,
          timestamp: now,
          channel: 'PLC_TELEMETRY',
          source: 'Gateway Readback Verifier',
          event_type: 'PROCESS_SAMPLE',
          register: 'R30001',
          register_name: 'Actual Speed',
          value: actualSpeed,
          unit: 'RPM',
          message: 'Telemetry readback confirms R40003=50 and R30001=50 RPM within nominal range. Incident officially verified RECOVERED.',
        });
      }

      return {
        recovered,
        status: recovered ? 'RECOVERED' : 'UNRECOVERED',
        verified_at: now,
        control_readback: {
          register: 'R40003',
          expected: 50,
          actual: readbackVal,
          match: readbackMatch,
        },
        process_telemetry: {
          register: 'R30001',
          register_name: 'Actual Speed',
          measured_value: actualSpeed,
          safe_bound: '<= 55 RPM',
          within_bounds: speedWithinBounds,
          unit: 'RPM',
        },
        incident_status: inc.status,
        message: recovered
          ? 'Physical conveyor speed normalized to 50 RPM and setpoint register readback confirmed. Process recovery verified.'
          : 'Telemetry readback failed to meet recovery criteria. Process remains unrecovered.',
      };
    } else {
      const modeVal = this.state.operatingMode;
      const recovered = modeVal === 1;

      if (recovered) {
        plan.recovery_state = 'RECOVERED';
        plan.verified_at = now;
        inc.status = 'RECOVERED';
      }

      return {
        recovered,
        status: recovered ? 'RECOVERED' : 'UNRECOVERED',
        verified_at: now,
        control_readback: {
          register: 'R40002',
          expected: 1,
          actual: modeVal,
          match: modeVal === 1,
        },
        process_telemetry: {
          register: 'R40002',
          register_name: 'Operating Mode',
          measured_value: modeVal,
          safe_bound: '== 1',
          within_bounds: modeVal === 1,
          unit: 'MODE',
        },
        incident_status: inc.status,
        message: recovered
          ? 'PLC Operating Mode verified at 1 (Auto Mode). Automatic safety interlocks re-engaged.'
          : 'Operating mode readback indicates manual override still active.',
      };
    }
  }

  public resetDemo(): DemoStatusResponse {
    this.state.speedSetpoint = 50;
    this.state.actualSpeed = 50;
    this.state.motorEnable = true;
    this.state.operatingMode = 1;
    this.state.motorCurrent = 4.2;
    this.state.motorLoad = 42;
    this.state.isJammed = false;
    this.state.processState = 2; // RUNNING
    this.state.speedAttackActive = false;
    this.state.modeAttackActive = false;
    this.state.lastScenarioTime = null;

    this.incidents.clear();
    this.seedInitialEvents();

    return this.getDemoStatus();
  }
}

// Global singleton instance for the virtual runtime
const globalForCell = globalThis as unknown as {
  virtualCellInstance?: VirtualIndustrialCell;
};

export const virtualCell = globalForCell.virtualCellInstance ?? new VirtualIndustrialCell();
if (process.env.NODE_ENV !== 'production') {
  globalForCell.virtualCellInstance = virtualCell;
}
