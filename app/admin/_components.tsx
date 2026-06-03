"use client";

import { ReactNode } from "react";

const statusStyles: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  review: "bg-blue-100 text-blue-700",
  reviewing: "bg-blue-100 text-blue-700",
  for_interview: "bg-cyan-100 text-cyan-700",
  hired: "bg-emerald-100 text-emerald-700",
  no_application: "bg-slate-100 text-slate-700",
  paused: "bg-gray-100 text-gray-700",
  default: "bg-slate-100 text-slate-700",
};

export function AdminPanel({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-[#dbe5ef] bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#203142]">{title}</h2>
          {description ? <p className="mt-1 text-sm text-[#7b8ca0]">{description}</p> : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>
      <div>{children}</div>
    </section>
  );
}

export function EmptyState({
  title,
  copy,
}: {
  title: string;
  copy: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-[#dbe5ef] bg-[#f7fbff] p-8 text-center text-sm text-[#5f738c]">
      <div className="text-base font-semibold text-[#203142]">{title}</div>
      <p className="mt-2">{copy}</p>
    </div>
  );
}

export function StatusBadge({
  value,
}: {
  value: string;
}) {
  const normalized = value?.toString().toLowerCase() ?? "default";
  const className = statusStyles[normalized] ?? statusStyles.default;

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${className}`}>
      {value}
    </span>
  );
}

export function ActionButton({
  label,
  onClickAction,
  variant = "primary",
  disabled,
}: {
  label: string;
  onClickAction: (e: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: "primary" | "default" | "secondary";
  disabled?: boolean;
}) {
  const styles = {
    primary: "bg-[#2f6fa4] text-white hover:bg-[#244f7b]",
    default: "bg-[#f3f7fb] text-[#2f6fa4] hover:bg-[#e8eff8]",
    secondary: "bg-white text-[#2f6fa4] border border-[#dbe5ef] hover:bg-[#f8fbff]",
  };

  return (
    <button
      type="button"
      onClick={onClickAction}
      disabled={disabled}
      className={`pointer-events-auto cursor-pointer rounded-2xl px-4 py-2 text-sm font-semibold transition-all ${styles[variant]} ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
    >
      {label}
    </button>
  );
}
