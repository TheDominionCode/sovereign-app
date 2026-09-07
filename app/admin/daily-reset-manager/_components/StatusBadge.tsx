import { STATUS_LABELS, STATUS_STYLES, type DailyResetStatus } from "../_lib/types";

export default function StatusBadge({ status }: { status: DailyResetStatus }) {
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_STYLES[status]}`}>
      {status === "approved" ? "✓ " : status === "pending_approval" ? "⚠ " : status === "published" ? "● " : ""}
      {STATUS_LABELS[status].toUpperCase()}
    </span>
  );
}
