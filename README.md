# HMI System

A Human-Machine Interface (HMI) system built with Next.js for monitoring and controlling industrial devices via OPC UA.

## Environment Variables

The application uses environment variables for configuration. Create a `.env.local` file in the root directory with the following variables:

### OPC UA Server Configuration

```env
NEXT_PUBLIC_OPCUA_ENDPOINT_URL=opc.tcp://192.168.1.91:4840
```

- `NEXT_PUBLIC_OPCUA_ENDPOINT_URL`: The OPC UA server endpoint URL (default: `opc.tcp://localhost:4840`)

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure the OPC UA server endpoint in `.env.local`:

   ```env
   NEXT_PUBLIC_OPCUA_ENDPOINT_URL=opc.tcp://192.168.1.91:4840
   ```

3. Run the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Build for Production

```bash
npm run build
npm start
```

## Features

- **Dashboard**: Overview of production line status
- **Devices**: Monitor and control all production line devices
- **Alarms**: View and manage alarm notifications
- **Trends**: Analyze production data trends
- **Settings**: Configure system settings

## OPC UA Integration

The application automatically connects to the OPC UA server on startup using the configured endpoint. If the connection fails, the application will gracefully handle the error and continue to retry.

## Technology Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **OPC UA**: node-opcua
