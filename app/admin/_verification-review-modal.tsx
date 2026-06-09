"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Building2,
  Calendar,
  CheckCircle2,
  ExternalLink,
  FileText,
  Mail,
  MapPin,
  User,
  XCircle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { ActionButton, StatusBadge } from "./_components";
import { useAdminAction } from "./api-client-react";
import { getSessionSafe } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

function DetailField({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#e5edf5] bg-[#f8fbff] p-4">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7b8ca0]">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-2 text-sm font-medium text-[#203142] break-words">{value || "Not provided"}</div>
    </div>
  );
}

export function VerificationReviewModal({
  open,
  onCloseAction,
  title,
  subtitle,
  fields,
  verification,
  employerId,
}: {
  open: boolean;
  onCloseAction: () => void;
  title: string;
  subtitle: string;
  fields: Array<{ label: string; value: string }>;
  verification: VerificationSummary;
  employerId?: string | null;
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

  const reviewStatus = verification.status ?? "pending";
  const isPending = reviewStatus === "pending";
  const canReview = isPending && (Boolean(verification.id) || Boolean(employerId));
  const documents = documentsQuery.data ?? [];
  const documentError = documentsQuery.error instanceof Error ? documentsQuery.error.message : null;
  const actionError = action.error instanceof Error ? action.error.message : null;
  const activeDocument = useMemo(
    () => documents.find((document) => document.path === activeDocumentPath) ?? documents[0] ?? null,
    [activeDocumentPath, documents]
  );

  useEffect(() => {
    setActiveDocumentPath(documents[0]?.path ?? null);
  }, [documents]);

  const handleReview = (status: "approved" | "rejected") => {
    if (verification.id) {
      action.mutate({ type: "verification", id: verification.id, status }, { onSuccess: onCloseAction });
      return;
    }
    if (employerId) {
      action.mutate({ type: "employer", id: employerId, status }, { onSuccess: onCloseAction });
    }
  };

  const fieldIcons: Record<string, ReactNode> = {
    "Contact Person": <User className="h-3.5 w-3.5" />,
    Email: <Mail className="h-3.5 w-3.5" />,
    "Business Type": <Building2 className="h-3.5 w-3.5" />,
    Location: <MapPin className="h-3.5 w-3.5" />,
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onCloseAction(); }}>
      <DialogContent className="flex max-h-[92vh] max-w-4xl flex-col gap-0 overflow-hidden border-0 bg-white p-0 shadow-2xl sm:rounded-2xl top-[50%] translate-y-[-50%]">
        <div className="relative shrink-0 overflow-hidden bg-[linear-gradient(135deg,#2f5e8f_0%,#214b74_60%,#1d3d5c_100%)] px-6 pb-6 pt-6 text-white">
          <div className="absolute bottom-0 right-0 h-36 w-36 rounded-full bg-[#ffd45d]/15 blur-3xl" />
          <DialogHeader className="space-y-3 text-left">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge value={reviewStatus} />
              {verification.submittedAt ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/85">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(verification.submittedAt).toLocaleString()}
                </span>
              ) : null}
            </div>
            <DialogTitle className="text-2xl font-bold leading-tight text-white sm:text-3xl">{title}</DialogTitle>
            <DialogDescription className="text-sm text-white/80">{subtitle}</DialogDescription>
          </DialogHeader>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          {isPending ? (
            <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              This account is awaiting admin review. Approve to grant platform access, or reject to suspend the account.
            </div>
          ) : null}

          {reviewStatus === "approved" ? (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <span>This account has been approved and verified.</span>
            </div>
          ) : null}

          {reviewStatus === "rejected" ? (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <span>This account was rejected and access has been suspended.</span>
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {fields.map((field) => (
              <DetailField
                key={field.label}
                label={field.label}
                value={field.value}
                icon={fieldIcons[field.label]}
              />
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-[#e5edf5] bg-white p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#203142]">
              <FileText className="h-4 w-4 text-[#2f6fa4]" />
              Submitted Notes
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#506274]">
              {verification.notes?.trim() || "No additional submission notes were saved."}
            </p>
          </div>

          <div className="mt-5 rounded-2xl border border-[#e5edf5] bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#203142]">
                <FileText className="h-4 w-4 text-[#2f6fa4]" />
                Submitted Documents
              </div>
              {documents.length > 0 ? (
                <span className="rounded-full bg-[#eef5fb] px-3 py-1 text-xs font-semibold text-[#2f6fa4]">
                  {documents.length} file{documents.length === 1 ? "" : "s"}
                </span>
              ) : null}
            </div>

            {documentsQuery.isLoading ? <p className="mt-3 text-sm text-[#7b8ca0]">Loading document links...</p> : null}
            {documentError ? <p className="mt-3 text-sm text-red-600">{documentError}</p> : null}
            {!verification.id ? (
              <p className="mt-3 text-sm text-[#7b8ca0]">
                No verification submission is attached yet. You can still approve or reject based on the account details above.
              </p>
            ) : null}
            {!documentsQuery.isLoading && !documentError && verification.id && documents.length === 0 ? (
              <p className="mt-3 text-sm text-[#7b8ca0]">No uploaded documents were found for this submission.</p>
            ) : null}

            {activeDocument ? (
              <div className="mt-4 overflow-hidden rounded-2xl border border-[#e5edf5] bg-[#f8fbff]">
                {activeDocument.url && activeDocument.kind === "image" ? (
                  <img
                    src={activeDocument.url}
                    alt={activeDocument.name}
                    className="max-h-[24rem] w-full bg-slate-100 object-contain"
                  />
                ) : null}
                {activeDocument.url && activeDocument.kind === "pdf" ? (
                  <iframe
                    src={activeDocument.url}
                    title={activeDocument.name}
                    className="h-[24rem] w-full bg-white"
                  />
                ) : null}
                {!activeDocument.url || activeDocument.kind === "file" ? (
                  <div className="flex min-h-48 items-center justify-center px-6 py-10 text-center text-sm text-[#7b8ca0]">
                    {activeDocument.error || "Preview is not available for this file type, but you can still open it in a new tab."}
                  </div>
                ) : null}
              </div>
            ) : null}

            {documents.length > 0 ? (
              <div className="mt-4 space-y-2">
                {documents.map((document) => (
                  <div
                    key={`${document.path}-${document.name}`}
                    className={`flex items-center justify-between gap-4 rounded-2xl border p-4 transition ${
                      activeDocument?.path === document.path
                        ? "border-[#2f6fa4] bg-[#f4f9ff]"
                        : "border-transparent bg-[#f8fbff] hover:border-[#dbe5ef]"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-[#203142] break-words">{document.name}</div>
                      <div className="mt-1 truncate text-xs text-[#7b8ca0] break-words">{document.path}</div>
                      {document.error ? <div className="mt-1 text-xs text-red-600">{document.error}</div> : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
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
                          className="inline-flex items-center gap-2 rounded-xl bg-[#2f6fa4] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#244f7b]"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Open
                        </a>
                      ) : (
                        <span className="text-xs font-medium text-[#7b8ca0]">Unavailable</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {actionError ? (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {actionError}
            </div>
          ) : null}
        </div>

        <DialogFooter className="shrink-0 border-t border-[#e5edf5] bg-[#fbfdff] px-6 py-4 sm:flex-row sm:justify-between">
          <ActionButton label="Close" variant="secondary" onClickAction={() => onCloseAction()} />
          {canReview ? (
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <button
                type="button"
                disabled={action.isPending}
                onClick={() => handleReview("rejected")}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <XCircle className="h-4 w-4" />
                {action.isPending ? "Saving..." : "Reject"}
              </button>
              <button
                type="button"
                disabled={action.isPending}
                onClick={() => handleReview("approved")}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CheckCircle2 className="h-4 w-4" />
                {action.isPending ? "Saving..." : "Approve"}
              </button>
            </div>
          ) : !isPending ? (
            <span className="text-xs text-[#7b8ca0]">This account has already been reviewed.</span>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
