"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  Download,
  RefreshCw,
  Search,
  User,
  XCircle,
} from "lucide-react";

import { ApplicantAvatar } from "@/components/applicant-avatar";
import { EmployerAvatar } from "@/components/employer-avatar";
import { EmptyState, StatusBadge } from "../_components";
import { VerificationReviewModal } from "../_verification-review-modal";
import { useAdminPortal, useAdminAction } from "../api-client-react";
import type { AdminVerificationItem } from "@/lib/admin-verification-queue";

const PAGE_SIZE = 10;

const statusFilters = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
] as const;

type StatusFilter = (typeof statusFilters)[number]["value"];

export default function VerificationsPage() {
  const { data, isLoading } = useAdminPortal();
  const { mutateAsync, status } = useAdminAction();
  const queryClient = useQueryClient();

  const [selectedItem, setSelectedItem] = useState<AdminVerificationItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  const isMutating = status === "pending";

  const queue = useMemo(
    () => (Array.isArray(data?.adminVerifications) ? data.adminVerifications : []) as AdminVerificationItem[],
    [data?.adminVerifications]
  );

  const counts = useMemo(
    () => ({
      all: queue.length,
      pending: queue.filter((item) => item.status === "pending").length,
      approved: queue.filter((item) => item.status === "approved").length,
      rejected: queue.filter((item) => item.status === "rejected").length,
    }),
    [queue]
  );

  const filteredQueue = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return queue.filter((item) => {
      const matchesSearch =
        !query ||
        item.subjectName.toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query) ||
        (item.email ?? "").toLowerCase().includes(query);
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [queue, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredQueue.length / PAGE_SIZE));
  const visibleItems = filteredQueue.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 4000);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const syncQueue = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin-portal"] });
  };

  const submitReview = async (item: AdminVerificationItem, nextStatus: "approved" | "rejected") => {
    try {
      if (item.actionType === "verification") {
        await mutateAsync({ type: "verification", id: item.actionId, status: nextStatus });
      } else if (item.actionType === "employer") {
        await mutateAsync({ type: "employer", id: item.actionId, status: nextStatus });
      } else {
        await mutateAsync({ type: "applicant", id: item.actionId, status: nextStatus });
      }

      setSelectedItem((current) =>
        current?.queueId === item.queueId ? { ...current, status: nextStatus } : current
      );
      setFeedback({
        tone: "success",
        message: nextStatus === "approved" ? `${item.subjectName} approved.` : `${item.subjectName} rejected.`,
      });
      await syncQueue();
    } catch (error) {
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "Unable to update verification.",
      });
    }
  };

  const handleBulkApprove = async () => {
    const pendingItems = queue.filter((item) => item.status === "pending");
    if (pendingItems.length === 0) return;

    try {
      await Promise.all(
        pendingItems.map((item) => {
          if (item.actionType === "verification") {
            return mutateAsync({ type: "verification", id: item.actionId, status: "approved" });
          }
          if (item.actionType === "employer") {
            return mutateAsync({ type: "employer", id: item.actionId, status: "approved" });
          }
          return mutateAsync({ type: "applicant", id: item.actionId, status: "approved" });
        })
      );
      setFeedback({ tone: "success", message: `Approved ${pendingItems.length} pending account${pendingItems.length === 1 ? "" : "s"}.` });
      await syncQueue();
    } catch (error) {
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "Bulk approve failed.",
      });
    }
  };

  const handleExportRecords = () => {
    const csv = [
      ["Resident", "Email", "Type", "Status", "Submitted", "Documents"].join(","),
      ...filteredQueue.map((item) =>
        [
          item.subjectName,
          item.email ?? "",
          item.type,
          item.status,
          item.submittedAt ?? "",
          item.documentCount,
        ]
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "verification-queue.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-[#203142]">Review queue</h2>
            <p className="mt-1 text-sm text-[#7b8ca0]">
              {counts.pending} pending · {counts.all} total accounts awaiting or completed review
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void syncQueue()}
              className="inline-flex items-center gap-2 rounded-full border border-[#dbe5ef] bg-white px-4 py-2 text-sm font-medium text-[#506274] transition hover:border-[#2f6fa4] hover:text-[#2f6fa4]"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => void handleBulkApprove()}
              disabled={isMutating || counts.pending === 0}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              {isMutating ? "Saving..." : "Approve all pending"}
            </button>
            <button
              type="button"
              onClick={handleExportRecords}
              className="inline-flex items-center gap-2 rounded-full border border-[#dbe5ef] bg-white px-4 py-2 text-sm font-medium text-[#506274] transition hover:bg-[#f7fbff]"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>

        {feedback ? (
          <div
            className={`rounded-2xl px-4 py-3 text-sm font-medium ${
              feedback.tone === "success"
                ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {feedback.message}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa9ba]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name, email, or type..."
              className="w-full rounded-2xl border border-[#e5edf5] bg-[#fbfdff] py-3 pl-11 pr-4 text-sm text-[#203142] outline-none transition focus:border-[#2f6fa4] focus:ring-2 focus:ring-[#2f6fa4]/15"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {statusFilters.map((filter) => {
              const active = statusFilter === filter.value;
              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => {
                    setStatusFilter(filter.value);
                    setCurrentPage(1);
                  }}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-[#2f6fa4] text-white shadow-sm"
                      : "border border-[#e5edf5] bg-white text-[#607487] hover:border-[#c9d7e4]"
                  }`}
                >
                  {filter.label}
                  <span className={`ml-2 text-xs ${active ? "text-white/80" : "text-[#9aa9ba]"}`}>
                    {counts[filter.value]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-[24px] bg-[#eef4f9]" />
            ))}
          </div>
        ) : visibleItems.length === 0 ? (
          <EmptyState
            title="No accounts in this view"
            copy={
              statusFilter === "pending"
                ? "There are no pending employer or applicant accounts right now."
                : "Try another filter or search term to find verification records."
            }
          />
        ) : (
          <div className="space-y-3">
            {visibleItems.map((item) => {
              const isPending = item.status === "pending";
              const submitted = new Date(item.submittedAt).toLocaleString();

              return (
                <article
                  key={item.queueId}
                  className="rounded-[24px] border border-[#e8eff6] bg-white p-4 shadow-sm transition hover:border-[#d4e2ef] sm:p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-start gap-4">
                      {item.imageKind === "employer" ? (
                        <EmployerAvatar name={item.subjectName} logoUrl={item.imageUrl} size="md" />
                      ) : (
                        <ApplicantAvatar name={item.subjectName} photoUrl={item.imageUrl} size="md" />
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-base font-semibold text-[#203142]">{item.subjectName}</h3>
                          <StatusBadge value={item.status} />
                        </div>
                        <p className="mt-1 text-sm text-[#7b8ca0]">{item.email ?? "No email on file"}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[#8a99ab]">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f4f8fc] px-3 py-1 font-medium text-[#506274]">
                            {item.type === "Employer Verification" ? (
                              <Building2 className="h-3.5 w-3.5" />
                            ) : (
                              <User className="h-3.5 w-3.5" />
                            )}
                            {item.type === "Employer Verification" ? "Employer" : "Applicant"}
                          </span>
                          <span>{submitted}</span>
                          <span>
                            {item.documentCount} document{item.documentCount === 1 ? "" : "s"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <button
                        type="button"
                        onClick={() => setSelectedItem(item)}
                        className="rounded-full border border-[#dbe5ef] px-4 py-2 text-sm font-medium text-[#506274] transition hover:border-[#2f6fa4] hover:text-[#2f6fa4]"
                      >
                        Review
                      </button>
                      <button
                        type="button"
                        disabled={isMutating || !isPending}
                        onClick={() => void submitReview(item, "approved")}
                        className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={isMutating || !isPending}
                        onClick={() => void submitReview(item, "rejected")}
                        className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!isLoading && filteredQueue.length > 0 ? (
          <div className="flex items-center justify-between rounded-2xl border border-[#e8eff6] bg-[#fbfdff] px-4 py-3 text-sm text-[#7b8ca0]">
            <span>
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredQueue.length)} of{" "}
              {filteredQueue.length}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="rounded-full border border-[#dbe5ef] px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                className="rounded-full border border-[#dbe5ef] px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}

        {counts.pending > 0 ? (
          <div className="flex items-start gap-3 rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {counts.pending} account{counts.pending === 1 ? "" : "s"} still need review. Approving grants platform access;
              rejecting suspends the account.
            </span>
          </div>
        ) : null}
      </div>

      {selectedItem ? (
        <VerificationReviewModal
          key={`modal-${selectedItem.queueId}`}
          open
          onCloseAction={() => setSelectedItem(null)}
          title={selectedItem.subjectName}
          subtitle="Review account details, documents, and take action."
          fields={[
            { label: "Type", value: selectedItem.type },
            { label: "Email", value: selectedItem.email ?? "Not provided" },
            { label: "Documents", value: `${selectedItem.documentCount}` },
            {
              label: "Submitted",
              value: selectedItem.submittedAt ? new Date(selectedItem.submittedAt).toLocaleString() : "Not provided",
            },
          ]}
          verification={{
            id: selectedItem.actionType === "verification" ? selectedItem.actionId : null,
            type: selectedItem.type,
            status: selectedItem.status,
            submittedAt: selectedItem.submittedAt,
            notes: selectedItem.notes,
          }}
          actionType={selectedItem.actionType}
          employerId={selectedItem.employerId}
          applicantUserId={selectedItem.applicantUserId}
          documentsLookupId={selectedItem.queueId}
          imageUrl={selectedItem.imageUrl}
          imageName={selectedItem.subjectName}
          imageKind={selectedItem.imageKind}
        />
      ) : null}
    </>
  );
}
