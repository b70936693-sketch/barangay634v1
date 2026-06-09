"use client";

import { ReactNode } from "react";

const statusStyles: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  closed: "bg-slate-100 text-slate-600",
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

export function ListPagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
}: {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  if (totalItems === 0) {
    return null;
  }

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col gap-3 border-t border-[#e8eff6] pt-4 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-[#7b8ca0]">
        Showing {start}–{end} of {totalItems}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="rounded-full border border-[#dbe5ef] px-3 py-1.5 text-sm font-medium text-[#506274] transition hover:border-[#2f6fa4] hover:text-[#2f6fa4] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        <span className="px-2 text-xs font-medium text-[#9aa9ba]">
          Page {currentPage} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="rounded-full border border-[#dbe5ef] px-3 py-1.5 text-sm font-medium text-[#506274] transition hover:border-[#2f6fa4] hover:text-[#2f6fa4] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
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
