"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { ActionButton, StatusBadge } from "./_components";
import { useAdminAction } from "./api-client-react";
import { getSessionSafe } from "@/lib/supabase";

type VerificationSummary = {
  id: string | null;
  type: "Applicant Verification" | "Employer Verification" | null;
  status: "pending" | "approved" | "rejected" | null;
  submittedAt: string | null;
  notes?: string;
};

type DocumentEntry = {
  name: string;
  path: string;
  url: string | null;
  kind?: "image" | "pdf" | "file";
  error?: string;
};

export function VerificationReviewModal({
  open,
  onCloseAction,
  title,
  subtitle,
  fields,
  verification,
}: {
  open: boolean;
  onCloseAction: () => void;
  title: string;
  subtitle: string;
  fields: Array<{ label: string; value: string }>;
  verification: VerificationSummary;
}) {
  const action = useAdminAction();
  const [activeDocumentPath, setActiveDocumentPath] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | undefined>();

  useEffect(() => {
    const getToken = async () => {
      try {
        const session = await getSessionSafe();
        setAccessToken(session?.data?.session?.access_token);
      } catch (error) {
        console.error("Unable to retrieve Supabase session for verification details:", error);
      }
    };
    void getToken();
  }, []);

  const documentsQuery = useQuery({
    queryKey: ["admin-verification-documents", verification.id],
    enabled: open && Boolean(verification.id),
    queryFn: async () => {
      const res = await fetch(
        verification.id ? `/api/portal/admin/verifications/${verification.id}` : `/api/portal/admin/verifications/invalid`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
        }
      );

      const result = (await res.json().catch(() => null)) as
        | { documents?: DocumentEntry[]; error?: string }
        | null;

      if (!res.ok) {
        throw new Error(result?.error || `Unable to load verification documents (${res.status})`);
      }

      return result?.documents ?? [];
    },
  });

  const canReview = verification.id && verification.status === "pending";
  const documents = documentsQuery.data ?? [];
  const documentError = documentsQuery.error instanceof Error ? documentsQuery.error.message : null;
  const activeDocument = useMemo(
    () => documents.find((document) => document.path === activeDocumentPath) ?? documents[0] ?? null,
    [activeDocumentPath, documents]
  );

  useEffect(() => {
    setActiveDocumentPath(documents[0]?.path ?? null);
  }, [documents]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">{title}</h3>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onCloseAction}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2">
              {fields.map((field) => (
                <div key={field.label} className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{field.label}</div>
                  <div className="mt-2 text-sm font-medium text-slate-900 break-words">{field.value || "Not provided"}</div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-slate-200 p-5">
              <h4 className="text-lg font-semibold text-slate-900">Submitted Notes</h4>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {verification.notes?.trim() || "No additional submission notes were saved."}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-5">
              <h4 className="text-lg font-semibold text-slate-900">Submitted Documents</h4>
              {documentsQuery.isLoading ? <p className="mt-3 text-sm text-slate-500">Loading document links...</p> : null}
              {documentError ? <p className="mt-3 text-sm text-red-600">{documentError}</p> : null}
              {!documentsQuery.isLoading && !documentError && documents.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">No uploaded documents were found for this submission.</p>
              ) : null}
              {activeDocument ? (
                <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  {activeDocument.url && activeDocument.kind === "image" ? (
                    <img
                      src={activeDocument.url}
                      alt={activeDocument.name}
                      className="max-h-[28rem] w-full bg-slate-100 object-contain"
                    />
                  ) : null}
                  {activeDocument.url && activeDocument.kind === "pdf" ? (
                    <iframe
                      src={activeDocument.url}
                      title={activeDocument.name}
                      className="h-[28rem] w-full bg-white"
                    />
                  ) : null}
                  {!activeDocument.url || activeDocument.kind === "file" ? (
                    <div className="flex min-h-56 items-center justify-center px-6 py-10 text-center text-sm text-slate-500">
                      {activeDocument.error || "Preview is not available for this file type, but you can still open it in a new tab."}
                    </div>
                  ) : null}
                </div>
              ) : null}
              <div className="mt-4 space-y-3">
                {documents.map((document) => (
                  <div
                    key={`${document.path}-${document.name}`}
                    className={`flex items-center justify-between gap-4 rounded-2xl p-4 transition ${
                      activeDocument?.path === document.path
                        ? "border border-[#2f6fa4] bg-[#f4f9ff]"
                        : "bg-slate-50"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900 break-words">{document.name}</div>
                      <div className="mt-1 truncate text-xs text-slate-500 break-words">{document.path}</div>
                      {document.error ? <div className="mt-1 text-xs text-red-600">{document.error}</div> : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <ActionButton
                        label="Preview"
                        variant="secondary"
                        onClickAction={() => setActiveDocumentPath(document.path)}
                      />
                      {document.url ? (
                        <a
                          href={document.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl bg-[#2f6fa4] px-3 py-2 text-xs font-semibold text-white"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Open
                        </a>
                      ) : (
                        <span className="text-xs font-medium text-slate-400">Unavailable</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-200 bg-[#fbfdff] p-5">
            <h4 className="text-lg font-semibold text-slate-900">Review Status</h4>
            <div className="flex items-center gap-3">
              <StatusBadge value={verification.status ?? "pending"} />
              <span className="text-xs text-slate-500">
                {verification.submittedAt ? new Date(verification.submittedAt).toLocaleString() : "No submission date"}
              </span>
            </div>
            <p className="text-sm leading-6 text-slate-600">
              Approve or reject this account after checking the submitted information and uploaded verification files.
            </p>
            <div className="space-y-3">
              <ActionButton
                label={action.isPending && canReview ? "Saving..." : "Approve"}
                onClickAction={(e) => {
                  e.stopPropagation();
                  if (!verification.id) return;
                  action.mutate(
                    { type: "verification", id: verification.id, status: "approved" },
                    { onSuccess: onCloseAction }
                  );
                }}
                disabled={!canReview || action.isPending}
                variant="primary"
              />
              <ActionButton
                label={action.isPending && canReview ? "Saving..." : "Reject"}
                onClickAction={(e) => {
                  e.stopPropagation();
                  if (!verification.id) return;
                  action.mutate(
                    { type: "verification", id: verification.id, status: "rejected" },
                    { onSuccess: onCloseAction }
                  );
                }}
                disabled={!canReview || action.isPending}
                variant="secondary"
              />
            </div>
            {!verification.id ? (
              <p className="text-sm text-slate-500">No verification submission is attached to this account yet.</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
