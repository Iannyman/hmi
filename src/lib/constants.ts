export const STATUS_COLORS = {
  running: "bg-status-running",
  stopped: "bg-status-stopped",
  fault: "bg-status-fault",
  warning: "bg-status-warning",
  manual: "bg-status-manual",
  auto: "bg-status-auto",
} as const;

export const STATUS_LABELS = {
  running: "Running",
  stopped: "Stopped",
  fault: "Fault",
  warning: "Warning",
  manual: "Manual",
  auto: "Auto",
} as const;
