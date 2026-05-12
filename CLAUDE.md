# HMI System

## Workflow Orchestration

### 1. Plan First

- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy

- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis
- For complex problems, throw more compute at it via subagents

### 3. Self-Improvement Loop

- After ANY correction: update "tasks/lessons.md" with the pattern
- Write rules that prevent the same mistake
- Review lessons at session start for relevant context

### 4. Verification Before Done

- Never mark complete without proving it works
- Ask: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)

- For non-trivial changes: pause for "more elegant way?"
- If fix feels hacky: implement the elegant solution
- Skip for simple, obvious fixes - don't over-engineer

### 6. Autonomous Bug Fixing

- When fixing a bug, always verify the root cause before implementing a fix. Read the relevant code first, confirm the actual issue, then fix.
- Never suppress ESLint errors with comments — always fix the underlying issue.
- After fixing, re-read the changed file to confirm the edit applied correctly, especially for multi-location changes.
- Point at logs, errors, failing tests - then resolve
- Zero context switching required from user

## Project Overview

Industrial Human-Machine Interface (HMI) for monitoring and controlling PLC-driven manufacturing systems via OPC UA. The UI is dynamically generated from the OPC UA server structure — the PLC is the single point of change. Add/remove stations or devices without code changes.

## Tech Stack

- **Next.js** 16.1.3 (App Router, Turbopack)
- **React** 19.2.3 / **TypeScript** 5.9.3 (strict mode)
- **Tailwind CSS** 3.4.17 with custom design system (dark-first)
- **shadcn/ui** (Radix UI primitives, default style, slate base)
- **node-opcua** 2.163.1 (OPC UA client for PLC communication)
- **Recharts** 2.15.0 (trend charts)
- **Lucide React** 0.468.0 (icons)

## Commands

```bash
npm install          # install deps
npm run dev          # dev server (localhost:3000)
npm run build        # production build
npm run start        # serve production build
npm run lint         # ESLint via Next.js
```

No test runner configured. No test files exist in the codebase.

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/            # Dashboard layout group (Header + Sidebar)
│   │   ├── _actions/           # Server Actions (private folder, not a route)
│   │   │   ├── alarm-actions.ts
│   │   │   ├── cylinder-actions.ts
│   │   │   ├── drive-actions.ts
│   │   │   ├── line-actions.ts
│   │   │   └── station-actions.ts
│   │   ├── alarms/             # Alarm management page
│   │   ├── dashboard/          # Main production overview
│   │   ├── devices/            # Device monitoring page
│   │   ├── mock-data/          # Mock data page (dev testing)
│   │   ├── settings/           # System configuration
│   │   ├── trends/             # Historical trends
│   │   ├── layout.tsx          # Dashboard layout (Header + Sidebar + main)
│   │   ├── loading.tsx         # Route transition skeleton
│   │   └── error.tsx           # Dashboard error boundary
│   ├── api/
│   │   ├── hmi/                # HMI APIs (events/initialize/reset)
│   │   └── opcua/              # OPC UA APIs (browse/connect/read/write)
│   ├── layout.tsx              # Root layout (Providers + fonts)
│   ├── page.tsx                # Landing page (redirects to /dashboard)
│   ├── error.tsx               # Root error boundary
│   ├── not-found.tsx           # 404 page
│   └── globals.css
├── components/
│   ├── devices/                # Device cards (base + 7 types)
│   ├── layout/                 # Header, Sidebar
│   ├── notifications/          # AlarmNotification + AlarmNotificationWrapper
│   ├── panels/                 # AlarmPanel, LineControl, LineStats, TrendChart
│   ├── providers/              # All context providers (composed in index.tsx)
│   │   └── index.tsx           # Composed Providers component + hook re-exports
│   ├── shared/                 # StatusBadge, ValueDisplay, ProgressBar
│   ├── stations/               # StationCard
│   └── ui/                     # shadcn/ui components (no barrel export)
├── lib/
│   ├── server/                 # Server-only modules (node-opcua imports)
│   │   ├── opcua-service.ts   # OPC UA connection, read/write, subscriptions
│   │   ├── hmi-manager.ts     # HMI orchestration (discovery, events)
│   │   ├── hmi-locator.ts     # Singleton accessor for HMIManager
│   │   ├── alarm-manager.ts   # Alarm detection from device errors
│   │   ├── alarm-locator.ts   # Singleton accessor for AlarmManager
│   │   ├── node-mapper.ts     # OPC UA node ID mapping
│   │   ├── opcua-errors.ts    # Custom error types + validation helpers
│   │   ├── opcua-utils-server.ts # Server-side OPC UA data conversion
│   │   └── index.ts            # Barrel export
│   ├── domain/                 # Domain models (all extend Device base)
│   │   ├── device.ts           # Base device class (EventEmitter, OPC UA subs)
│   │   ├── motor.ts, valve.ts, sensor.ts, robot.ts
│   │   ├── conveyor.ts, drive.ts, cylinder.ts
│   │   ├── station.ts, line.ts, order.ts
│   │   └── index.ts
│   ├── constants.ts            # Status colors/labels
│   ├── mock-data.ts            # Mock data generator
│   ├── opcua-utils.ts          # Client-safe OPC UA utilities
│   └── utils.ts                # cn(), formatTimestamp(), formatDuration()
└── types/                       # TypeScript definitions (barrel in index.ts)
    ├── alarm.types.ts, device.types.ts, device.dto.ts
    ├── domain.types.ts, station.types.ts, opcua.types.ts, ui.types.ts
    └── index.ts
```

## Architecture

### Provider Hierarchy (top → bottom)

```
Providers (composed in components/providers/index.tsx)
└── ThemeProvider
    └── ConnectionProvider
        └── OPCUADataProvider
            └── HMIDataProvider
                └── HMISSEProvider (Server-Sent Events)
                    └── HMIInitializerProvider (auto-connect + init)
                        └── SidebarProvider
                            └── LineStatusProvider
                                └── LineStatisticsProvider
```

Root layout wraps `<Providers>` with `<AlarmNotificationWrapper>` (from `components/notifications/`).

### Real-Time Data Flow

1. PLC value change → OPC UA subscription notification
2. Domain model updates state, emits event
3. SSE streams updates to client via `/api/hmi/events`
4. React context providers update
5. Components re-render

### Key Singletons (server-side, via `globalThis`)

- `HMILocator` — get/init `HMIManager` across Server Actions and API routes
- `AlarmLocator` — get/init `AlarmManager` for alarm operations

### Domain Models

All devices extend the `Device` base class (`lib/domain/device.ts`). Each model:

- Manages OPC UA subscriptions for its nodes
- Emits events on state changes
- Encapsulates device-specific business logic
- Uses `NodeMapper` for node ID mapping

## Code Conventions

- **Imports**: Use `@/` path alias (maps to `src/`). Import hooks from `@/components/providers`, server modules from `@/lib/server`
- **Components**: kebab-case filenames (`motor-card.tsx`). Barrel exports via `index.ts` in each directory (except `ui/`)
- **Server Actions**: `"use server"` directive, live in `app/(dashboard)/_actions/`
- **Client Components**: `"use client"` directive required for all components with hooks/state
- **Styling**: `cn()` utility from `@/lib/utils` for conditional Tailwind classes
- **Status Colors**: `bg-status-running` (green), `bg-status-stopped` (gray), `bg-status-fault` (red), `bg-status-warning` (yellow)
- **Types**: Centralized in `src/types/` with barrel export. No co-located type files
- **Domain Models**: PascalCase classes extending `Device` in `src/lib/domain/`

## Environment Variables

All variables are `NEXT_PUBLIC_` (exposed to client). Configured in `.env.local`:

```bash
# OPC UA Connection
NEXT_PUBLIC_OPCUA_ENDPOINT_URL=opc.tcp://192.168.1.91:4840
NEXT_PUBLIC_OPCUA_NAMESPACE=4

# Timing (milliseconds)
NEXT_PUBLIC_OPCUA_SAMPLING_INTERVAL=100
NEXT_PUBLIC_RECONNECT_INTERVAL_MS=5000
NEXT_PUBLIC_RECONNECT_FIRST_DELAY_MS=1000
NEXT_PUBLIC_CONNECTION_SYNC_INTERVAL_MS=2000
NEXT_PUBLIC_SSE_KEEPALIVE_INTERVAL_MS=30000
NEXT_PUBLIC_HEADER_ALARM_POLL_INTERVAL_MS=1000
NEXT_PUBLIC_ALARM_POLL_INTERVAL=1000
NEXT_PUBLIC_ALARM_AUTO_DISMISS_DURATION=5000
```

## Adding a New Device Type

1. Create domain model: `src/lib/domain/mydevice.ts` extending `Device`
2. Add type to `src/types/device.types.ts`
3. Create card: `src/components/devices/mydevice-card.tsx` extending `BaseDeviceCard`
4. Add export to `src/components/devices/index.ts`
5. HMI Manager auto-discovers from OPC UA — no wiring needed

## DO NOTs

- **Do not** import from `src/lib/server/` in client components — those modules use `node-opcua` (Node.js only)
- **Do not** add barrel exports to `src/components/ui/` — shadcn CLI expects direct file paths
- **Do not** put business logic in React components — keep it in domain models (`lib/domain/`)
- **Do not** poll when OPC UA subscriptions are available — use SSE or subscriptions instead
- **Do not** modify `lib/domain/index.ts` barrel without updating all consumers
- **Do not** create new top-level directories — new code goes in `src/`
- **Do not** hardcode OPC UA node IDs — use `NodeMapper` for all node references

## External Dependencies

- **OPC UA Server**: Siemens PLC at the configured endpoint. The app connects as a client — the PLC server must be running for the HMI to function
- **No database**: State lives in the PLC/domain models in memory. No persistence layer
- **No auth**: No authentication or authorization system
- **No CI/CD**: No GitHub Actions or deployment pipeline configured
