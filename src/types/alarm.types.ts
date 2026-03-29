export type AlarmSeverity = "critical" | "warning" | "info";

export interface Alarm {
  id: string;
  title: string;
  description: string;
  severity: AlarmSeverity;
  device: string;
  deviceId: string;
  timestamp: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}
