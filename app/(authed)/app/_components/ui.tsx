import type { ReactNode } from "react";

// ── icons (inline SVG, zero-dependency) ─────────────────────────────────────
type IconProps = { className?: string };

export function CheckIcon({ className = "w-3.5 h-3.5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M16.7 5.3a1 1 0 010 1.4l-7 7a1 1 0 01-1.4 0l-4-4a1 1 0 011.4-1.4L9 11.6l6.3-6.3a1 1 0 011.4 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function PlusIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M10 4a1 1 0 011 1v4h4a1 1 0 110 2h-4v4a1 1 0 11-2 0v-4H5a1 1 0 110-2h4V5a1 1 0 011-1z" />
    </svg>
  );
}

export function TrashIcon({ className = "w-3.5 h-3.5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M8 2a1 1 0 00-1 1v1H4a1 1 0 000 2h12a1 1 0 100-2h-3V3a1 1 0 00-1-1H8zM6 8a1 1 0 011 1v6a1 1 0 11-2 0V9a1 1 0 011-1zm4 0a1 1 0 011 1v6a1 1 0 11-2 0V9a1 1 0 011-1zm5 1a1 1 0 10-2 0v6a1 1 0 102 0V9z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// ── layout primitives ───────────────────────────────────────────────────────
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
      <div>
        <h1 className="font-display text-3xl text-ink tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-stone mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Panel({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-stone-200 bg-white ${className}`}>
      {title && (
        <div className="flex items-center justify-between gap-3 p-4 border-b border-stone-200">
          <h3 className="text-sm font-semibold tracking-wide text-ink">{title}</h3>
          {action}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="py-10 text-center text-sm italic text-stone-light font-cormorant">
      {children}
    </div>
  );
}

export function CategoryPill({
  label,
  className = "",
}: {
  label: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center text-[10px] tracking-wider px-2 py-0.5 rounded bg-sage-pale/40 text-forest ${className}`}
    >
      {label}
    </span>
  );
}

export function ProgressBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-1.5 rounded-full bg-stone-100 overflow-hidden">
      <div
        className="h-full bg-sage-light transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function ProgressRing({
  value,
  max = 100,
  size = 84,
  label,
}: {
  value: number;
  max?: number;
  size?: number;
  label?: string;
}) {
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  const offset = c - pct * c;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#e7e5e4" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#7a9a6e"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute text-center leading-tight">
        <div className="font-display text-base text-forest">{value}</div>
        {label && <div className="text-[9px] text-stone-light">{label}</div>}
      </div>
    </div>
  );
}

export function Tabs({
  items,
  active,
}: {
  items: { label: string; href: string; count?: number }[];
  active: string;
}) {
  return (
    <div className="flex gap-1 mb-4 border-b border-stone-200 flex-wrap">
      {items.map((it) => {
        const on = it.href.endsWith(active) || it.label.toLowerCase() === active;
        return (
          <a
            key={it.href}
            href={it.href}
            className={`px-4 py-2 text-sm border-b-2 -mb-px ${
              on ? "border-sage text-forest" : "border-transparent text-stone"
            }`}
          >
            {it.label}
            {typeof it.count === "number" ? ` (${it.count})` : ""}
          </a>
        );
      })}
    </div>
  );
}
