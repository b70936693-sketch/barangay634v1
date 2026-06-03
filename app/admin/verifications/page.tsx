"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAdminPortal, useAdminAction } from "../api-client-react";
import { VerificationReviewModal } from "../_verification-review-modal";
import type { VerificationRecord } from "@/lib/backend/types";

const PAGE_SIZE = 12;

export default function VerificationsPage() {
  const { data, isLoading } = useAdminPortal();
  const { mutateAsync, status } = useAdminAction();
  const [selectedVerification, setSelectedVerification] = useState<VerificationRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const isMutating = status === "pending";

  const pendingVerifications = useMemo(() => {
    const verifications = (data?.verifications ?? []) as VerificationRecord[];
    return verifications.map((item) => ({
      ...item,
      submitted: new Date(item.submittedAt ?? new Date().toISOString()).toLocaleString(),
      statusLabel:
        item.status === "approved"
          ? "Approved"
          : item.status === "rejected"
          ? "Rejected"
          : "Pending Review",
      statusColor:
        item.status === "approved"
          ? "bg-green-100 text-green-700"
          : item.status === "rejected"
          ? "bg-red-100 text-red-700"
          : "bg-yellow-100 text-yellow-700",
    }));
  }, [data?.verifications]);

  const filteredVerifications = useMemo(() => {
    return pendingVerifications.filter((verification) => {
      const query = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !query ||
        verification.subjectName.toLowerCase().includes(query) ||
        verification.type.toLowerCase().includes(query) ||
        (verification.email ?? "").toLowerCase().includes(query);
      const matchesStatus = statusFilter === "all" || verification.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [pendingVerifications, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredVerifications.length / PAGE_SIZE));
  const visibleVerifications = filteredVerifications.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const queryClient = useQueryClient();

  const syncPendingVerifications = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin-portal"] });
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await mutateAsync({ type: "verification", id, status });
      setSelectedVerification((current) => (current?.id === id ? { ...current, status: status as VerificationRecord["status"] } : current));
      await syncPendingVerifications();
    } catch (error) {
      console.error("Verification update failed", error);
    }
  };

  const handleBulkApprove = async () => {
    const pendings = pendingVerifications.filter((v) => v.status === "pending").map((v) => v.id);
    try {
      await Promise.all(pendings.map((id) => mutateAsync({ type: "verification", id, status: "approved" })));
      await syncPendingVerifications();
    } catch (error) {
      console.error("Bulk approve failed", error);
    }
  };

  const handleExportRecords = () => {
    const csv = [
      ["Resident", "Email", "Type", "Status", "Submitted", "Documents"].join(","),
      ...filteredVerifications.map((verification) =>
        [
          verification.subjectName,
          verification.email ?? "",
          verification.type,
          verification.status,
          verification.submittedAt ?? "",
          (verification.documents ?? []).join(" | "),
        ]
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "verification-records.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-gray-800\">Verifications Management</h2>
            <p className="text-xs text-gray-500\">Total: {pendingVerifications.length} | Review & approve resident documents</p>
          </div>
          <div className="flex gap-1.5\">
            <button
              type="button"
              onClick={() => void syncPendingVerifications()}
              className="border border-[#2f6fa4] hover:bg-[#f4f9ff] text-[#2f6fa4] px-3 py-1.5 rounded text-xs font-semibold"
            >
              Sync
            </button>
            <button 
              onClick={handleBulkApprove}
              disabled={isMutating || pendingVerifications.filter((v) => v.status === "pending").length === 0}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded text-xs font-semibold"
            >
              {isMutating ? "Approving..." : "Bulk Approve"}
            </button>
            <button
              type="button"
              onClick={handleExportRecords}
              className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded text-xs font-semibold"
            >
              Export List
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 px-4 py-2 bg-gray-50">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-md">
                <svg className="absolute left-3 top-1/2 w-4 h-4 text-gray-400 -translate-y-1/2" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search verifications..."
                  className="w-full pl-8 pr-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value as typeof statusFilter);
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded px-2 py-1 text-xs"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter("pending");
                  setCurrentPage(1);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-semibold"
              >
                Show Pending
              </button>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {visibleVerifications.map((verification) => (
              <div key={verification.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`p-2 rounded-lg shadow-sm ${verification.statusLabel === 'Approved' ? 'bg-green-50 border-2 border-green-200' : verification.statusLabel === 'Rejected' ? 'bg-red-50 border-2 border-red-200' : 'bg-yellow-50 border-2 border-yellow-200'}`}>
                      <svg className={`w-5 h-5 ${verification.statusLabel === 'Approved' ? 'text-green-600' : verification.statusLabel === 'Rejected' ? 'text-red-600' : 'text-yellow-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base text-gray-900 truncate">{verification.subjectName}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{verification.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${verification.statusColor}`}>
                      {verification.statusLabel}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Submitted</p>
                    <p className="font-mono text-xs text-gray-900">{verification.submitted}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Documents</p>
                    <div className="flex flex-wrap gap-1">
                      {verification.documents?.map((doc, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-gray-100 text-xs rounded-full">
                          {doc}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <button
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold py-2 px-3 rounded-lg text-xs shadow-sm hover:shadow-md transition-all"
                    onClick={() => void handleStatusChange(verification.id, "approved")}
                    disabled={isMutating || verification.status !== "pending"}
                  >
                    <span className="w-4 h-4 inline-block mr-1.5 bg-white rounded">✓</span>
                    Approve
                  </button>
                  <button 
                    onClick={() => setSelectedVerification(verification)}
                    className="flex-1 border-2 border-[#2f6fa4] hover:border-[#244f7b] bg-white font-bold py-2 px-3 rounded-lg text-xs shadow-sm hover:shadow-md transition-all text-[#2f6fa4] hover:text-[#244f7b]"
                  >
                    View Docs
                  </button>
                  <button
                    className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-2 px-3 rounded-lg text-xs shadow-sm hover:shadow-md transition-all"
                    onClick={() => void handleStatusChange(verification.id, "rejected")}
                    disabled={isMutating || verification.status !== "pending"}
                  >
                    <span className="w-4 h-4 inline-block mr-1.5 bg-white rounded">✕</span>
                    Reject
                  </button>
                </div>
              </div>
            ))}
            {!isLoading && visibleVerifications.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-500">No verifications match the current filters.</div>
            ) : null}
          </div>

          <div className="flex items-center justify-between border-t border-gray-200 px-3 py-1.5 text-xs text-gray-500">
            <span>
              Showing {filteredVerifications.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}-
              {Math.min(currentPage * PAGE_SIZE, filteredVerifications.length)} of {filteredVerifications.length}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="rounded border border-gray-300 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50 text-xs"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                className="rounded border border-gray-300 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50 text-xs"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {selectedVerification && (
        <VerificationReviewModal
          key={`modal-${selectedVerification.id}`}
          open
          onCloseAction={() => setSelectedVerification(null)}
          title={selectedVerification.subjectName}
          subtitle="Review verification details, documents, and take action."
          fields={[
            { label: "Type", value: selectedVerification.type },
            { label: "Email", value: selectedVerification.email ?? "N/A" },
            { label: "Documents", value: `${selectedVerification.documents?.length ?? 0}` },
            { label: "Submitted", value: selectedVerification.submittedAt ? new Date(selectedVerification.submittedAt).toLocaleString() : "N/A" },
          ]}
          verification={selectedVerification}
        />
      )}
    </>
  );
}

