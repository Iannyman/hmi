# HMI System

## Project Overview

Industrial Human-Machine Interface (HMI) web application for monitoring and controlling PLC-driven manufacturing systems. The system uses a **PLC-driven architecture** where the UI is dynamically generated from the OPC UA server structure.

**Core Innovation**: The single point of change is the **PLC itself**. The HMI discovers structure dynamically from the OPC UA server and generates UI components automatically. Add/remove stations or devices without code changes.

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **UI**: React 19, TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Components**: shadcn/ui (Radix UI primitives)
- **Industrial Communication**: node-opcua for OPC UA connectivity
- **Charts**: Recharts for trend visualization
- **Icons**: Lucide React

## Architecture: Event-Driven Domain Model

### Core Principles

1. **Discovery-First**: System discovers PLC structure before rendering UI
2. **Event-Driven Updates**: All data changes flow through event emitters
3. **Domain-Driven Design**: Rich domain models encapsulate business logic
4. **Single Source of Truth**: The PLC/OPC UA server drives UI generation

### Complete File Structure

```
app/
├── (dashboard)/             # Dashboard layout group
│   ├── dashboard/          # Main production overview
│   ├── devices/            # Device monitoring page
│   ├── alarms/             # Alarm management
│   ├── trends/             # Historical trends
│   ├── settings/           # System configuration
│   ├── opcua-demo/         # OPC UA browser/testing
│   └── layout.tsx          # Dashboard layout wrapper
├── api/                    # API routes
│   ├── opcua/              # OPC UA operations
│   │   ├── connect/        # Connect/disconnect from server
│   │   ├── read/           # Read single/multiple node values
│   │   ├── write/          # Write values to nodes
│   │   ├── subscribe/      # Create/manage subscriptions
│   │   └── browse/         # Browse OPC UA address space
│   └── hmi/                # HMI-specific APIs
│       ├── initialize/     # Initialize HMI system
│       ├── read/           # Read HMI data
│       └── reset/          # Reset HMI state
├── layout.tsx              # Root layout with providers
└── page.tsx                # Landing page

components/
├── devices/                # Device-specific cards
│   ├── base-device-card.tsx    # Shared base component for all devices
│   ├── motor-card.tsx          # Motor monitoring (speed, current, temp)
│   ├── valve-card.tsx          # Valve control (position, pressure, flow)
│   ├── sensor-card.tsx         # Sensor displays (value, thresholds)
│   ├── robot-card.tsx          # Robot interface (mode, program, axes)
│   ├── conveyor-card.tsx       # Conveyor monitoring (speed, material count)
│   ├── drive-card.tsx          # Drive control (frequency, torque, PF)
│   └── cylinder-card.tsx       # Cylinder control (position, errors)
├── panels/                 # Dashboard panels
│   ├── line-control-panel.tsx    # Line mode control (auto/setup/init/end)
│   ├── line-statistics-panel.tsx # Production stats (OK/NOK parts)
│   ├── alarm-panel.tsx           # Alarm management with filtering
│   └── trend-chart.tsx           # Data visualization with Recharts
├── layout/                 # Layout components
│   ├── header.tsx              # Main header with connection status
│   └── sidebar.tsx             # Navigation sidebar
├── providers/              # React Context providers (nested hierarchy)
│   ├── theme-provider.tsx           # Dark/light mode
│   ├── sidebar-provider.tsx        # Sidebar state management
│   ├── opcua-data-provider.tsx     # OPC UA connection data
│   ├── hmi-initializer-provider.tsx # HMI initialization
│   ├── hmi-data-provider.tsx       # HMI data exposure
│   ├── line-status-provider.tsx    # Line status context
│   ├── line-statistics-provider.tsx # Production stats context
│   ├── alarm-notification-provider.tsx # Alarm notifications
│   └── alarm-notification-wrapper.tsx # Alarm UI wrapper
├── shared/                 # Reusable UI components
│   ├── status-badge.tsx       # Status indicators with colors
│   ├── value-display.tsx      # Value displays with units
│   └── progress-bar.tsx       # Progress indicators
├── stations/               # Station components
│   └── station-card.tsx        # Production station cards
└── ui/                     # shadcn/ui components
    ├── badge.tsx
    ├── button.tsx
    ├── card.tsx
    ├── dialog.tsx
    ├── input.tsx
    ├── progress.tsx
    ├── scroll-area.tsx
    ├── select.tsx
    ├── separator.tsx
    ├── switch.tsx
    └── tooltip.tsx

hooks/                     # Custom React hooks
├── use-opcua.ts               # OPC UA operations hook
├── use-opcua-subscription.ts  # Subscription management
├── use-hmi-manager.ts         # HMI manager access
└── use-connection.ts          # Connection status monitoring

lib/                       # Core libraries
├── domain/                 # Domain models (event-driven)
│   ├── line.ts               # Production line (status, modes, stats)
│   ├── station.ts            # Station model with device management
│   ├── device.ts             # Base device model with events
│   ├── motor.ts              # Motor-specific model
│   ├── valve.ts              # Valve-specific model
│   ├── sensor.ts             # Sensor-specific model
│   ├── robot.ts              # Robot-specific model
│   ├── conveyor.ts           # Conveyor-specific model
│   ├── drive.ts              # Drive-specific model
│   ├── cylinder.ts           # Cylinder-specific model
│   └── order.ts              # Production order model
├── opcua-service.ts         # OPC UA service layer (connection, subs)
├── opcua-errors.ts          # Custom error types
├── opcua-utils.ts           # OPC UA utilities
├── node-mapper.ts           # Node ID mapping helpers
├── hmi-manager.ts           # HMI orchestration (discovery, events)
├── hmi-locator.ts           # HMI structure discovery from OPC UA
├── constants.ts             # App constants
└── utils.ts                 # Utility functions (cn() helper)

types/                     # TypeScript definitions
├── alarm.types.ts          # Alarm types (severity, state)
├── common.types.ts         # Shared types (status, mode)
├── device.types.ts         # Device interfaces
├── domain.types.ts         # Domain model types
├── opcua.types.ts          # OPC UA types (node IDs, values)
├── station.types.ts        # Station interfaces
└── ui.types.ts             # UI component props

actions/                   # Server actions
├── cylinder-actions.ts     # Cylinder operations
├── line-actions.ts         # Line operations (mode, reset)
└── station-actions.ts      # Station operations

config/
├── components.json         # shadcn/ui configuration
├── next.config.mjs         # Next.js configuration
├── tailwind.config.ts      # Tailwind CSS with custom theme
└── tsconfig.json           # TypeScript with strict mode
```

## Key Architectural Patterns

### 1. Domain-Driven Design with Event Emitters

**Domain Models** (`lib/domain/`):

- Each entity (Line, Station, Device) is a rich domain model
- Models emit events on state changes
- Automatic OPC UA subscription management
- Business logic encapsulated in models

**Example**:

```typescript
// Line model manages production line state
const line = new Line(nodeId, opcuaService);
line.on("statusChanged", (newStatus) => {
  /* handle update */
});
line.on("statisticsUpdated", (stats) => {
  /* handle stats */
});
```

### 2. HMI Manager Orchestration

**Central Orchestration** (`lib/hmi-manager.ts`):

- Discovers stations and devices from OPC UA
- Manages subscription lifecycle
- Emits events for UI updates
- Supports hot-reload (re-discover without restart)

**Usage Pattern**:

```typescript
const hmi = new HMIManager(opcuaService);
await hmi.initialize();
hmi.on("structureDiscovered", (structure) => {
  /* render UI */
});
```

### 3. Provider Hierarchy (Nested Composition)

```
ThemeProvider (theme)
└── ConnectionProvider (OPC UA connection)
    └── OPCUADataProvider (connection data)
        └── HMIDataProvider (HMI manager instance)
            └── HMIInitializerProvider (auto-init on mount)
                └── SidebarProvider (UI state)
                    └── LineStatusProvider (line status)
                        └── LineStatisticsProvider (production stats)
                            └── AlarmNotificationWrapper (alarms)
```

**Why Nested?**: Each provider depends on the parent's context. This ensures proper initialization order and clean unmounting.

### 4. Route-Based Subscriptions

**Optimization Pattern** (`hooks/use-opcua-subscription.ts`):

- Each page subscribes only to relevant nodes
- Unsubscribe on route change
- Configurable sampling intervals per node

**Example**:

```typescript
// In dashboard page
useOPCUASubscription([
  { nodeId: "ns=2;s=Line.Status", samplingInterval: 1000 },
  { nodeId: "ns=2;s=Line.Mode", samplingInterval: 500 },
]);
```

### 5. Device Card Extensibility

**Base Pattern** (`components/devices/base-device-card.tsx`):

- Extensible base component for all devices
- Status-based styling with glow effects
- Consistent layout: icon, name, status badge
- Click handlers for device details

**Adding New Device**:

1. Create domain model in `lib/domain/{device}.ts`
2. Create card extending base in `components/devices/{device}-card.tsx`
3. Add type to `types/device.types.ts`
4. System auto-discovers from OPC UA

## Key Patterns

### OPC UA Integration

- **Service Layer**: Use [`lib/opcua-service.ts`](lib/opcua-service.ts) for all OPC UA operations
- **Connection Management**: Heartbeat monitoring with auto-reconnect (3 attempts, backoff)
- **Error Handling**: Custom error types in [`lib/opcua-errors.ts`](lib/opcua-errors.ts)
- **Node Mapping**: Helper utilities in [`lib/node-mapper.ts`](lib/node-mapper.ts)

### API Routes

**OPC UA Operations** (`/api/opcua/`):

- `connect` - Establish/close connection with security modes
- `read` - Read single or multiple node values
- `write` - Write values to nodes
- `subscribe` - Create monitored item subscriptions
- `browse` - Browse OPC UA address space

**HMI Operations** (`/api/hmi/`):

- `initialize` - Initialize HMI manager and discover structure
- `read` - Read current HMI state
- `reset` - Reset HMI manager state

### Device Cards

- **Base Component**: Extend [`components/devices/base-device-card.tsx`](components/devices/base-device-card.tsx)
- **Device Types**: Defined in [`types/device.types.ts`](types/device.types.ts)
- **Domain Models**: Each device has a model in [`lib/domain/`](lib/domain/)
- **Status Styling**: Automatic colors based on device status

### Styling Conventions

- **Utility Function**: Use `cn()` from [`lib/utils.ts`](lib/utils.ts) for conditional classes
- **Component Library**: Follow shadcn/ui patterns for consistency
- **Theme**: Dark/light mode via [`components/providers/theme-provider.tsx`](components/providers/theme-provider.tsx)
- **Status Colors**: Green (running), Yellow (warning), Red (error/fault), Gray (stopped)

### Type Safety

- **Domain Types**: Rich types in [`lib/domain/`](lib/domain/) for business entities
- **API Types**: Request/response types in [`types/opcua.types.ts`](types/opcua.types.ts)
- **UI Types**: Component prop types in [`types/ui.types.ts`](types/ui.types.ts)
- **Strict Mode**: TypeScript strict mode enabled

## Special Features

### Real-Time Data Flow

1. **PLC Change** → OPC UA Server detects value change
2. **Subscription** → OPC UA Service receives notification
3. **Domain Model** → Model updates internal state, emits event
4. **Provider** → React context updates with new data
5. **Component** → UI re-renders with new value

### Alarm Management

- **Hierarchical**: Critical, Warning, Info levels
- **Notifications**: Toast notifications with acknowledgment
- **Panel**: Dedicated alarm page with filtering/sorting
- **Visual**: Badges and indicators throughout UI

### Line Control

- **Modes**: Auto, Setup, Init, End, Error
- **Statistics**: OK/NOK part counting, efficiency tracking
- **Operations**: Reset statistics, acknowledge errors
- **Status**: Real-time line status with visual indicators

### Hot Reload Capability

- Add new stations to PLC → HMI auto-discovers
- Remove devices → UI updates automatically
- No code changes required for structure changes
- Re-discover on-demand via HMI Manager

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

- When given bug report: just fix it
- Point at logs, errors, failing tests - then resolve
- Zero context switching required from user

## Core Principles

- **Simplicity First**: Make every change as simple as possible
- **No Laziness**: Find root causes. No temporary fixes
- **Minimal Impact**: Changes should only touch what's necessary
- **Trust Domain Models**: Business logic belongs in domain models, not components
- **Event-Driven**: Use events, not prop drilling, for cross-component communication

## Quick Reference

### Adding a New Device Type

1. **Domain Model**: Create `lib/domain/mydevice.ts` extending `Device`
2. **Type Definition**: Add to `types/device.types.ts`
3. **Component**: Create `components/devices/mydevice-card.tsx` extending `BaseDeviceCard`
4. **Discovery**: HMI Manager auto-discovers from OPC UA structure
5. **No wiring needed**: System handles subscription and updates automatically

### Debugging Connection Issues

1. Check [`lib/opcua-service.ts`](lib/opcua-service.ts) logs
2. Verify endpoint in `.env.local`
3. Check OPC UA server is running
4. Review browser console for SSE errors
5. Use `/opcua-demo` page to test connection

### Performance Optimization

- Route-based subscriptions minimize network traffic
- Domain models cache values and batch updates
- React.memo on device cards prevents unnecessary re-renders
- Sampling intervals configurable per node
- Provider hierarchy ensures minimal re-render scope

## Environment Variables

```bash
# OPC UA Connection
OPCUA_ENDPOINT=opc.tcp://localhost:4840
OPCUA_SECURITY_MODE=None  # None, Sign, SignAndEncrypt

# Application
NEXT_PUBLIC_APP_NAME=HMI System
NODE_ENV=development
```
