export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <div className="h-10 w-10 rounded-full border-4 border-accent border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground font-mono">Loading...</p>
      </div>
    </div>
  );
}
