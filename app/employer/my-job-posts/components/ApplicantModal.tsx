"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Search,
  Mail,
  Phone,
  Eye,
  UserCheck,
  XCircle,
  FileText,
  ExternalLink,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useListJobPostApplicants, useUpdateApplicantStatus } from "../../api-client-react";
import {
  getApplicantAppliedDate,
  getApplicantContact,
  getApplicantName,
} from "@/app/employer/lib/applicant-display";
import { ApplicantDocumentsPreview } from "@/app/employer/applicants/components/ApplicantDocumentsPreview";
import { ApplicationDecisionDialog } from "@/lib/application-decision-dialog";
import { ApplicantAvatar } from "@/components/applicant-avatar";
import { useToast } from "@/hooks/use-toast";

type ApplicantRecord = {
  id: string;
  fullName?: string;
  email?: string;
  contact?: string;
  status?: string;
  introduction?: string;
  documents?: unknown[];
  position?: string;
  photoUrl?: string | null;
};

type ApplicantModalProps = {
  jobPostId: string;
  jobTitle?: string;
  open: boolean;
  onClose: () => void;
};

function getStatusBadge(status: string) {
  switch (status) {
    case "pending":
      return <Badge variant="secondary">Pending</Badge>;
    case "reviewing":
      return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Reviewing</Badge>;
    case "for_interview":
      return <Badge variant="secondary" className="bg-cyan-100 text-cyan-700">For Interview</Badge>;
    case "hired":
      return <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">Hired</Badge>;
    case "rejected":
      return <Badge variant="secondary" className="bg-rose-100 text-rose-700">Not selected</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function ApplicantModal({ jobPostId, jobTitle, open, onClose }: ApplicantModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedApplicantId, setSelectedApplicantId] = useState<string | null>(null);
  const [pendingDecision, setPendingDecision] = useState<{
    applicant: ApplicantRecord;
    decision: "hired" | "rejected";
  } | null>(null);
  const { toast } = useToast();
  const updateStatus = useUpdateApplicantStatus();

  const { data: applicants = [], isLoading, isError, refetch } = useListJobPostApplicants(jobPostId, open);

  useEffect(() => {
    if (!open) {
      setSearchTerm("");
      setStatusFilter("all");
      setSelectedApplicantId(null);
      setPendingDecision(null);
      return;
    }
    void refetch();
  }, [open, jobPostId, refetch]);

  const filteredApplicants = useMemo(() => {
    return (applicants as ApplicantRecord[]).filter((app) => {
      const name = getApplicantName(app);
      const matchesSearch =
        searchTerm === "" ||
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (app.email ?? "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || app.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [applicants, searchTerm, statusFilter]);

  useEffect(() => {
    if (!filteredApplicants.length) {
      setSelectedApplicantId(null);
      return;
    }
    if (!selectedApplicantId || !filteredApplicants.some((app) => app.id === selectedApplicantId)) {
      setSelectedApplicantId(filteredApplicants[0].id);
    }
  }, [filteredApplicants, selectedApplicantId]);

  const selectedApplicant = filteredApplicants.find((app) => app.id === selectedApplicantId) ?? null;

  const confirmDecision = () => {
    if (!pendingDecision) return;
    const { applicant, decision } = pendingDecision;

    updateStatus.mutate(
      { id: applicant.id, data: { status: decision } },
      {
        onSuccess: (response: unknown) => {
          const payload = response as { notification?: { emailSent?: boolean } } | null;
          toast({
            title: decision === "hired" ? "Applicant hired" : "Applicant not selected",
            description: payload?.notification?.emailSent
              ? `${getApplicantName(applicant)} was updated and notified by email.`
              : `${getApplicantName(applicant)} was updated.`,
          });
          setPendingDecision(null);
        },
        onError: (error: unknown) => {
          toast({
            title: "Update failed",
            description: error instanceof Error ? error.message : "Unable to update applicant status.",
            variant: "destructive",
          });
        },
      },
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
        <DialogContent className="grid max-h-[min(92vh,820px)] w-[calc(100%-2rem)] max-w-5xl grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden border bg-white p-0">
          <DialogHeader className="space-y-1 border-b px-6 py-5 text-left">
            <DialogTitle className="text-lg font-semibold">Applicants</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {jobTitle ? `${jobTitle} · ` : ""}
              {isLoading ? "Loading applicants..." : `${filteredApplicants.length} applicant${filteredApplicants.length === 1 ? "" : "s"} found`}
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 overflow-y-auto px-6 py-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="All status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="reviewing">Reviewing</SelectItem>
                  <SelectItem value="for_interview">For interview</SelectItem>
                  <SelectItem value="hired">Hired</SelectItem>
                  <SelectItem value="rejected">Not selected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-24 w-full rounded-xl" />
                ))}
              </div>
            ) : isError ? (
              <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                Unable to load applicants. Please close and try again.
              </div>
            ) : filteredApplicants.length === 0 ? (
              <div className="rounded-xl border border-dashed p-10 text-center">
                <FileText className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
                <p className="font-medium text-foreground">No applicants yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Applications for this job post will appear here in real time.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
                <div className="space-y-2">
                  {filteredApplicants.map((applicant) => {
                    const isSelected = applicant.id === selectedApplicantId;
                    const appliedDate = getApplicantAppliedDate(applicant);

                    return (
                      <button
                        key={applicant.id}
                        type="button"
                        onClick={() => setSelectedApplicantId(applicant.id)}
                        className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                          isSelected
                            ? "border-[#2f6fa4] bg-[#f2f8fd]"
                            : "border-border bg-white hover:border-[#b9d0e8] hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-start gap-3">
                            <ApplicantAvatar name={getApplicantName(applicant)} photoUrl={applicant.photoUrl} size="sm" />
                            <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">{getApplicantName(applicant)}</p>
                            <p className="mt-1 truncate text-xs text-muted-foreground">{applicant.email}</p>
                            <p className="mt-2 text-xs text-muted-foreground">
                              Applied {appliedDate ? format(new Date(appliedDate), "MMM d, yyyy") : "—"}
                            </p>
                            </div>
                          </div>
                          {getStatusBadge(applicant.status ?? "pending")}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {selectedApplicant ? (
                  <div className="space-y-4 rounded-xl border border-border bg-slate-50 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <ApplicantAvatar name={getApplicantName(selectedApplicant)} photoUrl={selectedApplicant.photoUrl} size="lg" />
                        <div>
                        <p className="text-lg font-semibold text-foreground">{getApplicantName(selectedApplicant)}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{selectedApplicant.introduction || "No introduction provided."}</p>
                        </div>
                      </div>
                      {getStatusBadge(selectedApplicant.status ?? "pending")}
                    </div>

                    <div className="grid gap-2 text-sm sm:grid-cols-2">
                      <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{selectedApplicant.email || "No email"}</span>
                      </div>
                      <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{getApplicantContact(selectedApplicant) || "No phone"}</span>
                      </div>
                    </div>

                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Submitted documents</p>
                      <ApplicantDocumentsPreview documents={selectedApplicant.documents ?? []} />
                    </div>

                    <div className="flex flex-wrap gap-2 border-t pt-4">
                      <Button asChild variant="outline" size="sm" className="gap-1.5">
                        <Link href={`/employer/applicants/${selectedApplicant.id}`}>
                          <Eye className="h-4 w-4" />
                          Full profile
                        </Link>
                      </Button>

                      {selectedApplicant.status !== "hired" && selectedApplicant.status !== "rejected" ? (
                        <>
                          <Button
                            size="sm"
                            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                            disabled={updateStatus.isPending}
                            onClick={() =>
                              setPendingDecision({ applicant: selectedApplicant, decision: "hired" })
                            }
                          >
                            <UserCheck className="h-4 w-4" />
                            Hire
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="gap-1.5"
                            disabled={updateStatus.isPending}
                            onClick={() =>
                              setPendingDecision({ applicant: selectedApplicant, decision: "rejected" })
                            }
                          >
                            <XCircle className="h-4 w-4" />
                            Not selected
                          </Button>
                        </>
                      ) : (
                        <Button asChild variant="secondary" size="sm" className="gap-1.5">
                          <Link href={`/employer/applicants/${selectedApplicant.id}`}>
                            <ExternalLink className="h-4 w-4" />
                            View decision
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {pendingDecision ? (
        <ApplicationDecisionDialog
          open={Boolean(pendingDecision)}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setPendingDecision(null);
          }}
          applicantName={getApplicantName(pendingDecision.applicant)}
          applicantEmail={pendingDecision.applicant.email || "No email on file"}
          jobTitle={jobTitle || pendingDecision.applicant.position || "this role"}
          employerName="Your company"
          decision={pendingDecision.decision}
          isSubmitting={updateStatus.isPending}
          onConfirm={confirmDecision}
        />
      ) : null}
    </>
  );
}
