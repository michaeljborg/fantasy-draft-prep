import type { ReactNode } from "react";

export function Badge({ label }: { label: string }) {
  return (
    <span className="rounded bg-slate-100 px-2.5 py-1 text-xs font-bold tabular-nums text-slate-600">
      {label}
    </span>
  );
}

interface TopBannerProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}

export function TopBanner({ title, subtitle, right }: TopBannerProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div>
        <h1 className="text-base font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>
      {right && <div className="flex gap-2">{right}</div>}
    </header>
  );
}
