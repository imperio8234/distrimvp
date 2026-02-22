type ColdStatus = "HOT" | "WARM" | "COLD" | "FROZEN";

const CONFIG: Record<ColdStatus, { label: string; className: string }> = {
  HOT:    { label: "Al día",      className: "bg-green-100 text-green-800" },
  WARM:   { label: "Tibia",       className: "bg-yellow-100 text-yellow-800" },
  COLD:   { label: "Fría",        className: "bg-orange-100 text-orange-800" },
  FROZEN: { label: "Sin visita",  className: "bg-red-100 text-red-800" },
};

interface Props {
  status: ColdStatus;
  days?: number | null;
}

export function ColdBadge({ status, days }: Props) {
  const { label, className } = CONFIG[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${className}`}>
      {label}
      {days != null && ` · ${days}d`}
    </span>
  );
}
