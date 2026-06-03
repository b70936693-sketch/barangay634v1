"use client";

import { useMemo, useState } from "react";
import { useAdminPortal, useAdminAction } from "../api-client-react";

interface VerificationRecord {
  id: string;
  type: string;
  status: string;
  subjectName: string;
  email?: string | null;
  documents?: string[];
  submittedAt?: string;
  createdAt?: string;
  approvedAt?: string | null;
  rejectedAt?: string | null;
}

const PAGE_SIZE = 5;

export default function VerifyAccountsPage() {
  const { data } = useAdminPortal();
  const { mutateAsync, status } = useAdminAction();
  const isMutating = status === "pending";
  const verifications = useMemo(() => (data?.verifications ?? []) as VerificationRecord[], [data]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedVerification, setSelectedVerification] = useState<VerificationRecord | null>(null);

  const filteredVerifications = useMemo(() => {
    return verifications.filter((verification) => {
      const matchesSearch =
        !searchTerm.trim() ||
        verification.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (verification.email ?? "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || verification.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter, verifications]);

  const totalPages = Math.max(1, Math.ceil(filteredVerifications.length / PAGE_SIZE));
  const paginatedVerifications = filteredVerifications.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const pendingCount = verifications.filter((verification) => verification.status === "pending").length;
  const allVisibleSelected =
    paginatedVerifications.length > 0 && paginatedVerifications.every((verification) => selectedIds.includes(verification.id));

  const handleStatusChange = async (id: string, statusValue: string) => {
    try {
      await mutateAsync({ type: "verification", id, status: statusValue });
    } catch (error) {
      console.error("Verification update failed", error);
    }
  };

  const handleBulkApprove = async () => {
    const bulkIds =
      selectedIds.length > 0
        ? selectedIds
        : verifications.filter((verification) => verification.status === "pending").map((verification) => verification.id);

    try {
      await Promise.all(bulkIds.map((id) => mutateAsync({ type: "verification", id, status: "approved" })));
      setSelectedIds([]);
    } catch (error) {
      console.error("Bulk verification approval failed", error);
    }
  };

  const handleExportRecords = () => {
    const rows = filteredVerifications.map((verification) => ({
      resident: verification.subjectName,
      email: verification.email ?? "",
      type: verification.type,
      status: verification.status,
      submitted: verification.submittedAt ?? verification.createdAt ?? "",
      documents: (verification.documents ?? []).join(" | "),
    }));

    const csv = [
      ["Resident", "Email", "Type", "Status", "Submitted", "Documents"].join(","),
      ...rows.map((row) =>
        [row.resident, row.email, row.type, row.status, row.submitted, row.documents]
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(","),
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

  const toggleSelectedId = (id: string) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
  };

  const toggleCurrentPageSelection = () => {
    setSelectedIds((current) => {
      if (allVisibleSelected) {
        return current.filter((id) => !paginatedVerifications.some((verification) => verification.id === id));
      }

      const next = new Set(current);
      paginatedVerifications.forEach((verification) => next.add(verification.id));
      return Array.from(next);
    });
  };

  const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleDateString() : "N/A");
  const formatDateTime = (value?: string | null) => (value ? new Date(value).toLocaleString() : "N/A");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-800 mb-1">Verify Accounts</h2>
          <p className="text-sm text-gray-500">Review resident verifications | {verifications.length} total | {pendingCount} pending</p>
        </div>
        <div className="flex gap-2">
          <button
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm disabled:opacity-60"
            onClick={() => void handleBulkApprove()}
            disabled={isMutating || (pendingCount === 0 && selectedIds.length === 0)}
          >
            Bulk Approve
          </button>
          <button
            className="border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-semibold"
            onClick={handleExportRecords}
          >
            Export Records
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <svg className="absolute left-3 top-1/2 w-4 h-4 text-gray-400 -translate-y-1/2" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search residents..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <select
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-semibold"
              onClick={() => {
                setStatusFilter("pending");
                setCurrentPage(1);
              }}
            >
              Quick Filter
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    checked={allVisibleSelected}
                    onChange={toggleCurrentPageSelection}
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Resident</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Documents</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Submitted</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedVerifications.map((verification) => {
                const verificationType = verification.type === "Employer Verification" ? "Employer" : "Applicant";
                const statusLabel = verification.status === "approved" ? "Approved" : verification.status === "rejected" ? "Rejected" : "Pending Review";
                const statusColor =
                  verification.status === "approved"
                    ? "bg-green-100 text-green-700"
                    : verification.status === "rejected"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700";

                return (
                  <tr key={verification.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                        checked={selectedIds.includes(verification.id)}
                        onChange={() => toggleSelectedId(verification.id)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{verification.subjectName}</div>
                      <div className="text-xs text-gray-500">{verification.email ?? "No email"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                        {verificationType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${statusColor}`}>
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(verification.documents ?? []).length > 0 ? (
                          (verification.documents ?? []).map((doc: string, index: number) => (
                            <span key={`${verification.id}-${index}`} className="px-2 py-1 bg-gray-100 text-xs rounded-full">
                              {doc}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">No documents</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                      {formatDate(verification.submittedAt ?? verification.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-2">
                        {verification.status === "pending" ? (
                          <>
                            <button
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-colors"
                              onClick={() => void handleStatusChange(verification.id, "approved")}
                              disabled={isMutating}
                            >
                              Approve
                            </button>
                            <button
                              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-colors"
                              onClick={() => void handleStatusChange(verification.id, "rejected")}
                              disabled={isMutating}
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <button
                            className="text-blue-600 hover:text-blue-900 px-3 py-1 rounded text-xs font-semibold"
                            onClick={() => setSelectedVerification(verification)}
                          >
                            View History
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedVerification ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Verification History</h3>
              <p className="mt-1 text-sm text-gray-500">{selectedVerification.subjectName}</p>
            </div>
            <button className="text-sm font-semibold text-blue-600" onClick={() => setSelectedVerification(null)}>
              Close
            </button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3 text-sm">
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Submitted</div>
              <div className="mt-1 font-medium text-slate-900">
                {formatDateTime(selectedVerification.submittedAt ?? selectedVerification.createdAt)}
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Approved</div>
              <div className="mt-1 font-medium text-slate-900">
                {selectedVerification.approvedAt ? formatDateTime(selectedVerification.approvedAt) : "Not approved"}
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Rejected</div>
              <div className="mt-1 font-medium text-slate-900">
                {selectedVerification.rejectedAt ? formatDateTime(selectedVerification.rejectedAt) : "Not rejected"}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex justify-between items-center text-xs text-gray-500 pt-4">
        <span>
          Showing {filteredVerifications.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1} to{" "}
          {Math.min(currentPage * PAGE_SIZE, filteredVerifications.length)} of {filteredVerifications.length} verifications
        </span>
        <div className="flex gap-1">
          <button
            className="bg-white border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50 disabled:opacity-50"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <button className="bg-blue-600 text-white border border-blue-600 px-3 py-1.5 rounded font-semibold shadow-sm">
            {currentPage}
          </button>
          <button
            className="bg-white border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50 disabled:opacity-50"
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
