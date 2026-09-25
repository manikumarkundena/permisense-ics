# ⚡ PermiSense

### **Cyber-Physical Incident Intelligence & Human-Approved Response for Smart Manufacturing**

<p align="center">
  <b>Don't stop at the network.</b><br/>
  <b>Understand what a cyber action does to the physical process.</b>
</p>

<p align="center">
  <a href="https://github.com/manikumarkundena/permisense-ics">
    <img src="https://img.shields.io/badge/PermiSense-Cyber--Physical%20Security-7C3AED?style=for-the-badge&logo=shield&logoColor=white" alt="PermiSense"/>
  </a>
  <img src="https://img.shields.io/badge/FastAPI-Backend-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI"/>
  <img src="https://img.shields.io/badge/Next.js-Operator%20Console-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js"/>
  <img src="https://img.shields.io/badge/Modbus%2FTCP-Protocol--Real-E11D48?style=for-the-badge" alt="Modbus TCP"/>
  <img src="https://img.shields.io/badge/PostgreSQL-Evidence%20Store-336791?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/OBSERVE-06B6D4?style=flat-square" alt="Observe"/>
  <b> → </b>
  <img src="https://img.shields.io/badge/DETECT-3B82F6?style=flat-square" alt="Detect"/>
  <b> → </b>
  <img src="https://img.shields.io/badge/CORRELATE-8B5CF6?style=flat-square" alt="Correlate"/>
  <b> → </b>
  <img src="https://img.shields.io/badge/IMPACT-F59E0B?style=flat-square" alt="Impact"/>
  <b> → </b>
  <img src="https://img.shields.io/badge/RISK-EF4444?style=flat-square" alt="Risk"/>
  <b> → </b>
  <img src="https://img.shields.io/badge/APPROVE-EC4899?style=flat-square" alt="Approve"/>
  <b> → </b>
  <img src="https://img.shields.io/badge/RESPOND-14B8A6?style=flat-square" alt="Respond"/>
  <b> → </b>
  <img src="https://img.shields.io/badge/VERIFY-22C55E?style=flat-square" alt="Verify"/>
</p>

---

## 🧠 The idea in one sentence

> **PermiSense connects cyber control activity to real process telemetry, determines whether the action caused physical impact, derives evidence-based risk, and guides a human-approved response that is verified against the process itself.**

That is the gap.

A network security tool can tell you that communication happened.

**PermiSense asks what happened next.**

---

# 🧩 The Gap PermiSense Fills

Traditional security controls are essential, but industrial incidents do not end at the network boundary.

| Layer | What it answers | What can remain unanswered |
|---|---|---|
| 🧱 Firewall / ACL | **Can this traffic communicate?** | What did the allowed action do to the process? |
| 🔐 IAM / Access Control | **Who is allowed to act?** | Did an allowed action create unsafe physical behavior? |
| 📡 Network Monitoring | **What happened on the network?** | Did the process actually deviate? |
| 🏭 PLC / SCADA Monitoring | **What is the process doing?** | Was the deviation caused by a cyber control event? |
| 🚨 Traditional Alerting | **Did something cross a threshold?** | How are cyber evidence + physical impact connected? |
| **⚡ PermiSense** | **What happened across cyber + physical layers?** | — |

### The missing bridge

`Cyber event` + `Physical telemetry` + `Asset context` + `Time`

⬇️

### **Cyber-Physical Evidence**

⬇️

### **Impact-aware Incident**

⬇️

### **Explainable Risk**

⬇️

### **Human-approved Response**

⬇️

### **Verified Recovery**

**PermiSense is designed as a complementary layer — not a replacement for firewalls, segmentation, IAM, safety systems, or existing OT controls.**

---

# 🏗️ Architecture — From Cyber Event to Physical Recovery

~~~mermaid
flowchart TB
    U["👨‍💻 Operator / SOC"]:::user

    subgraph FRONT["🖥️ PERMISENSE OPERATOR CONSOLE"]
        UI1["Command Center"]
        UI2["Live Process"]
        UI3["Incident Investigation"]
        UI4["Evidence Graph"]
        UI5["Response Gate"]
        UI6["AI Copilot"]
    end

    subgraph CORE["⚡ PERMISENSE INTELLIGENCE CORE"]
        T["📡 Telemetry Ingestion"]
        D["🔎 Detection Engine"]
        C["🔗 Cyber-Physical Correlation"]
        I["🏭 Impact Analysis"]
        R["📊 Evidence-Derived Risk"]
        INC["🚨 Incident & Evidence Store"]
        RESP["🛡️ Human Approval / Response Gate"]
        V["✅ Recovery Verification"]
    end

    subgraph OT["🏭 CONTROLLED INDUSTRIAL ENVIRONMENT"]
        PLC["PLC-01<br/>Modbus/TCP"]
        VFD["VFD-01"]
        MOTOR["Motor"]
        CONV["Conveyor Cell"]
        SENSOR["Process Sensors"]
    end

    U --> FRONT
    FRONT <-->|"HTTPS / REST / WebSocket"| CORE

    T --> D --> C --> I --> R --> INC
    INC --> RESP -->|"Approved Modbus/TCP action"| PLC
    PLC --> V
    V --> T

    PLC --> VFD --> MOTOR --> CONV --> SENSOR --> PLC

    classDef user fill:#111827,stroke:#A78BFA,color:#fff,stroke-width:2px
    classDef ui fill:#172554,stroke:#38BDF8,color:#fff
    classDef core fill:#2E1065,stroke:#C084FC,color:#fff
    classDef ot fill:#431407,stroke:#FB923C,color:#fff
~~~

### 🔥 The closed loop

`OBSERVE → DETECT → CORRELATE → IMPACT → RISK → INCIDENT → APPROVE → RESPOND → VERIFY`

This is the central design of PermiSense.

---

# 🔬 What Makes the Demo Protocol-Real?

PermiSense does **not** rely on a browser-only fake state machine for the core industrial interaction.

The hackathon environment contains a **controlled virtual PLC + process simulator** communicating through **Modbus/TCP**.

The architecture preserves the distinction between:

| Plane | Register family | Meaning |
|---|---|---|
| 🟣 **Control Plane** | `R400xx` | What was commanded |
| 🟢 **Process Plane** | `R300xx` | What actually happened |

### Control registers

- `R40001` — Motor Enable
- `R40002` — Operating Mode
- `R40003` — Conveyor Speed Setpoint
- `R40004` — Acceleration Limit
- `R40005` — Production Target
- `R40010` — Overspeed Limit
- `R40011` — High Load Limit
- `R40012` — Jam Timeout
- `R40013` — Configuration Version

### Process telemetry

- `R30001` — Actual Speed
- `R30002` — Motor Current
- `R30003` — Mechanical Load
- `R30004` — Position
- `R30005` — Workpiece Count
- `R30006` — Jam State
- `R30007` — Process State

### Why this separation matters

**Commanded value ≠ observed value.**

PermiSense explicitly models both.

---

# 🚨 A Real Incident Story

Imagine an operator normally runs the conveyor at **50%**.

A control-plane action changes:

`R40003: 50% → 90%`

The PLC accepts the command.

The process reacts.

Then:

`R30001` **Actual Speed > 80% safety threshold**

PermiSense does not treat those as two unrelated alerts.

~~~text
        🟣 CONTROL EVENT
        R40003 = 90%
             │
             ▼
        🏭 PLC-01
             │
             ▼
          VFD-01
             │
             ▼
           MOTOR
             │
             ▼
        CONVEYOR CELL
             │
             ▼
        🟢 TELEMETRY
        R30001 > 80%
             │
             ▼
     🔗 CORRELATION WINDOW
             │
             ▼
       🚨 INCIDENT CREATED
             │
             ▼
       📊 RISK CALCULATED
             │
             ▼
       👤 HUMAN APPROVAL
             │
             ▼
      🛡️ MODBUS/TCP RESPONSE
             │
             ▼
       🔄 PROCESS RECOVERY
             │
             ▼
       ✅ TELEMETRY VERIFY
~~~

### The key question changes from:

> **“Did something suspicious happen?”**

to:

> **“Did the cyber action produce a measurable physical consequence?”**

---

# 📊 Evidence-Derived Risk — Not a Magic Number

PermiSense's risk engine is built from observable incident evidence.

Conceptually:

`Risk = Severity + Control Impact + Process Impact + Deviation + Temporal Correlation`

with a bounded result:

`0 ≤ Risk ≤ 100`

### Example evidence factors

| Evidence | Contribution |
|---|---:|
| 🔴 Incident severity | Up to 50 |
| 🎛️ Control manipulation | Up to 15 |
| 🏭 Process impact | Up to 20 |
| 📈 Threshold deviation | Up to 10 |
| ⏱️ Temporal correlation | Up to 5 |

The result is not intended to be a universal safety certification score.

It is an **explainable operational risk signal derived from the evidence available to PermiSense**.

---

# 🛡️ Human-in-the-Loop Response

PermiSense deliberately does **not** turn detection into an uncontrolled PLC command.

### Response lifecycle

~~~mermaid
sequenceDiagram
    participant PLC as 🏭 PLC
    participant P as ⚡ PermiSense
    participant O as 👤 Operator
    participant DB as 🗄️ Evidence Store

    PLC->>P: Telemetry + control evidence
    P->>P: Detect + correlate + assess impact
    P->>DB: Persist incident evidence
    P->>O: Recommended response
    O->>P: Explicit approval
    P->>PLC: Modbus/TCP control action
    PLC-->>P: Register readback
    PLC-->>P: Process telemetry
    P->>P: Verify recovery
    P->>DB: Record outcome
~~~

### Safety-oriented response gate

**DETECTION**

⬇️

**RECOMMENDATION**

⬇️

**HUMAN APPROVAL**

⬇️

**REAL CONTROL ACTION**

⬇️

**READBACK**

⬇️

**TELEMETRY VERIFICATION**

A successful register write is **not automatically considered recovery**.

The process has to demonstrate recovery through telemetry.

---

# 🧭 Three Views of the Same Incident

PermiSense is designed around different operator questions.

### 🎯 COMMAND CENTER
**“What is happening right now?”**

Live operational state, active incidents, risk and system health.

### 🔍 INVESTIGATION
**“Why did this happen?”**

Incident evidence, detections, correlation, process context and evidence graph.

### 🛡️ RESPONSE GATE
**“What should we do, and has it actually recovered?”**

Recommendation → approval → control action → readback → verification.

### 🤖 AI COPILOT
**“Help me understand the evidence.”**

Structured incident context can be passed to the AI layer to assist the operator without replacing the human approval boundary.

---

# 🗺️ Data Flow

~~~mermaid
flowchart LR
    A["🏭 Virtual PLC"] --> B["📡 Telemetry"]
    A --> C["🎛️ Control Events"]

    B --> D["🔎 Detection"]
    C --> D

    D --> E["🔗 Correlation"]
    E --> F["🏭 Impact Analysis"]
    F --> G["📊 Risk Engine"]
    G --> H["🚨 Incident"]

    H --> I["🧠 AI Copilot"]
    H --> J["👤 Response Gate"]

    J --> K["🛡️ Approved Action"]
    K --> A

    A --> L["✅ Readback + Recovery"]
    L --> B

    classDef source fill:#431407,stroke:#FB923C,color:#fff
    classDef intel fill:#2E1065,stroke:#C084FC,color:#fff
    classDef response fill:#064E3B,stroke:#34D399,color:#fff

    class A,B,C source
    class D,E,F,G,H,I intel
    class J,K,L response
~~~

---

# ☁️ Deployment Architecture

~~~text
                         🌐 BROWSER
                              │
                       HTTPS / WebSocket
                              │
                              ▼
                ┌─────────────────────────┐
                │       ▲ Vercel          │
                │  Next.js Operator UI    │
                └────────────┬────────────┘
                             │
                             ▼
                ┌─────────────────────────┐
                │       ▲ Render           │
                │   FastAPI Backend        │
                │                         │
                │ Telemetry • Detection   │
                │ Correlation • Risk      │
                │ Incidents • Response    │
                │ Copilot • Live Events   │
                └──────┬──────────┬───────┘
                       │          │
                       ▼          ▼
                ┌──────────┐  ┌──────────────┐
                │PostgreSQL│  │ Virtual PLC  │
                │ Evidence │  │ Modbus/TCP   │
                │  Store   │  │ Process Lab  │
                └──────────┘  └──────────────┘
~~~

### Current demo endpoints

| Service | Endpoint |
|---|---|
| 🖥️ Frontend | https://permisense-ics-frontend.vercel.app/ |
| ⚙️ Backend | https://permisense-api.onrender.com/ |
| ❤️ Health | `/api/health` |
| 🧭 System Status | `/api/system/status` |
| 🧪 Demo Status | `/api/demo/status` |
| 📡 WebSocket | `/ws/events` |

---

# 🎬 The Live Demo

PermiSense is built so the demonstration can tell a complete story:

### 01 — RESTORE
Return the controlled industrial cell to a known baseline.

### 02 — TRIGGER
Introduce a controlled industrial control-plane scenario.

### 03 — OBSERVE
Watch the PLC and process telemetry change.

### 04 — CORRELATE
Show the relationship between the control event and physical deviation.

### 05 — EXPLAIN
Inspect the incident, evidence and risk factors.

### 06 — APPROVE
The operator explicitly approves the recommended response.

### 07 — RESPOND
PermiSense performs the approved Modbus/TCP action.

### 08 — VERIFY
The system confirms recovery using PLC readback and process telemetry.

> **This is not a prerecorded dashboard animation. It is a closed cyber → physical → response → recovery loop inside a controlled virtual industrial environment.**

---

# 🧱 Technology Stack

| Layer | Technology |
|---|---|
| 🖥️ Frontend | Next.js, React, TypeScript |
| 🎨 UI | Tailwind CSS / component-based operator console |
| ⚙️ API | FastAPI, Python |
| 🗄️ Database | PostgreSQL |
| 🏭 Industrial Protocol | Modbus/TCP |
| 🔄 Live Updates | WebSocket |
| 🤖 AI | Gemini-based Copilot |
| 🧪 Industrial Lab | Controlled virtual PLC + process simulator |
| ☁️ Frontend Deployment | Vercel |
| ☁️ Backend Deployment | Render |
| 🔧 CI | GitHub Actions |

---

# 📁 Repository

~~~text
permisense-ics/
│
├── backend/                  # ⚙️ FastAPI backend
│   ├── app/
│   │   ├── detection/        # Detection logic
│   │   ├── correlation/      # Cyber-physical correlation
│   │   ├── impact/           # Process impact analysis
│   │   ├── risk/             # Evidence-derived risk
│   │   ├── incidents/        # Incident lifecycle
│   │   ├── response/         # Human-approved response
│   │   ├── copilot/          # AI assistance
│   │   ├── telemetry/        # Industrial telemetry
│   │   └── live/             # Live event streaming
│   └── README.md
│
├── frontend/                 # 🖥️ Next.js operator console
│   └── README.md
│
├── industrial_lab/           # 🏭 Virtual PLC + process environment
├── scripts/                  # 🔧 Startup / deployment helpers
├── docs/                     # 📚 Architecture & deployment docs
├── .github/workflows/        # 🚦 CI
│
├── Dockerfile
├── docker-compose.yml
└── README.md
~~~

---

# 🚀 Run Locally

## 1. Backend

~~~bash
cd backend

python -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt
alembic upgrade head

uvicorn app.main:app --reload --port 8000
~~~

The controlled industrial lab uses Modbus/TCP on port `5020`.

## 2. Frontend

~~~bash
cd frontend

npm install
npm run dev
~~~

Create `frontend/.env.local`:

~~~env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
NEXT_PUBLIC_WS_URL=ws://127.0.0.1:8000/ws/events
~~~

---

# 🧠 Design Principles

### 01 — Evidence First
Every important decision should be explainable from structured evidence.

### 02 — Cyber + Physical Context
A control event becomes more meaningful when the resulting process behavior is observable.

### 03 — Human Approval
Detection should not silently become a physical control command.

### 04 — Recovery Is a State, Not a Button
A response is incomplete until the process telemetry confirms the expected recovery.

### 05 — Protocol-Real Demonstration
The controlled lab uses actual Modbus/TCP interactions rather than pretending a frontend animation is an industrial control action.

### 06 — Defense in Depth
PermiSense complements firewalls, segmentation, IAM, safety systems and existing OT monitoring.

### 07 — Auditable Lifecycle
The system keeps incident evidence and response state so the path from detection to recovery can be inspected.

---

# 🏆 Why This Is More Than a Dashboard

Most security dashboards answer:

> **“What alert do I have?”**

PermiSense is designed to answer a larger operational chain:

> **What happened? → What did it affect? → How do we know? → How risky is it? → What should the operator do? → Did the process actually recover?**

That is the product boundary.

---

# 🔭 Future Expansion

The architecture can be extended toward:

- 🔌 Additional industrial protocols and device adapters
- 🏭 Physical PLC / testbed integration
- 🧩 More process models and industrial assets
- 🧠 More advanced anomaly and causal analysis
- 🔐 Stronger identity, authorization and OT network controls
- 📈 Historical process baselining
- 🗺️ Multi-asset incident propagation analysis
- 📋 Richer audit and compliance workflows

These are extensions of the architecture, not claims that the current hackathon prototype already implements them.

---

# ⚠️ Scope & Safety

PermiSense is a **hackathon / research prototype** built around a controlled virtual industrial environment.

The demonstration does **not** represent an intrusion into a real industrial plant.

A production industrial deployment would require, among other things:

- validated industrial hardware and testbeds
- stronger identity and authorization
- secure network architecture and segmentation
- safety interlocks
- protocol-specific security controls
- monitoring and fail-safe behavior
- formal testing and operational validation

---

# ⚡ The PermiSense Thesis

<p align="center">
  <b>NETWORK EVENT</b><br/>
  ↓<br/>
  <b>CONTROL ACTION</b><br/>
  ↓<br/>
  <b>PHYSICAL CONSEQUENCE</b><br/>
  ↓<br/>
  <b>CYBER-PHYSICAL EVIDENCE</b><br/>
  ↓<br/>
  <b>EXPLAINABLE RISK</b><br/>
  ↓<br/>
  <b>HUMAN-APPROVED RESPONSE</b><br/>
  ↓<br/>
  <b>VERIFIED RECOVERY</b>
</p>

<p align="center">
  <strong>PermiSense turns industrial security from “something happened” into “we can show what happened, why it mattered, what we did, and whether the process recovered.”</strong>
</p>

---

<p align="center">
  <sub>Built for cyber-physical security research, industrial security experimentation, and hackathon demonstration.</sub>
</p>
