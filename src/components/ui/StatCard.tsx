interface Props {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "blue" | "green" | "orange" | "red";
}

const ACCENT = {
  blue:   "border-l-brand-600 bg-brand-50",
  green:  "border-l-green-500 bg-green-50",
  orange: "border-l-orange-500 bg-orange-50",
  red:    "border-l-red-500 bg-red-50",
};

const VALUE_COLOR = {
  blue:   "text-brand-800",
  green:  "text-green-700",
  orange: "text-orange-700",
  red:    "text-red-700",
};

export function StatCard({ label, value, sub, accent = "blue" }: Props) {
  return (
    <div className={`card border-l-4 ${ACCENT[accent]}`}>
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${VALUE_COLOR[accent]}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}
