type Variant = "ok" | "warn" | "danger" | "info" | "idle";

export default function StatusBadge({
  variant,
  children,
}: {
  variant: Variant;
  children: React.ReactNode;
}) {
  return (
    <span className={`status-badge ${variant}`}>
      <span className="dot" />
      {children}
    </span>
  );
}
