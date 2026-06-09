"use client";

import { useMemo, useState } from "react";
import { addDays, format } from "date-fns";
import { Search, Clock, Phone, Mail, Calendar, FileText, XCircle, Eye, ArrowRight, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useListPendingApplicants, useUpdateApplicantStatus } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { getDocumentHref, getDocumentName } from "@/app/employer/lib/portal-actions";
import { InterviewGuidancePanel, InterviewSummaryCard } from "@/lib/interview-guidance";
import { ApplicationDecisionDialog } from "@/lib/application-decision-dialog";
import { ApplicantAvatar } from "@/components/applicant-avatar";

type PendingApplicant = {
  id: string;
  fullName: string;
  position: string;
  title?: string;
  employerName?: string;
  appliedDate: string;
  contact: string;
  email: string;
  introduction?: string;
  availability?: string;
  shiftPreference?: string;
  documents?: unknown[];
  status: "pending" | "reviewing";
  photoUrl?: string | null;
};

type ReviewMode = "review" | "schedule";

const DEFAULT_LOCATION = "Barangay 634 Hall";

export default function PendingReviewPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApplicant, setSelectedApplicant] = useState<PendingApplicant | null>(null);
  const [reviewMode, setReviewMode] = useState<ReviewMode>("review");
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("13:30");
  const [interviewLocation, setInterviewLocation] = useState(DEFAULT_LOCATION);
  const [reviewNotes, setReviewNotes] = useState("");
  const [rejectApplicant, setRejectApplicant] = useState<PendingApplicant | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; name: string; isImage: boolean } | null>(null);
  const { data: applicants = [], isLoading } = useListPendingApplicants();
  const updateStatus = useUpdateApplicantStatus();
  const { toast } = useToast();

  const typedApplicants = applicants as PendingApplicant[];

  const filteredApplicants = useMemo(
    () =>
      typedApplicants.filter(
        (applicant) =>
          applicant.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          applicant.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (applicant.title ?? "").toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [searchTerm, typedApplicants],
  );

  const openApplicantModal = (applicant: PendingApplicant, mode: ReviewMode) => {
    setSelectedApplicant(applicant);
    setReviewMode(mode);
    setInterviewDate(addDays(new Date(applicant.appliedDate), 5).toISOString().slice(0, 10));
    setInterviewTime("13:30");
    setInterviewLocation(DEFAULT_LOCATION);
    setReviewNotes(applicant.introduction ?? "");
  };

  const closeApplicantModal = () => {
    setSelectedApplicant(null);
    setReviewMode("review");
    setReviewNotes("");
  };

  const openRejectConfirm = (applicant: PendingApplicant) => {
    setRejectApplicant(applicant);
  };

  const closeRejectConfirm = () => {
    setRejectApplicant(null);
  };

  const confirmAndReject = () => {
    if (!rejectApplicant) return;
    handleStatusUpdate({
      applicantId: rejectApplicant.id,
      applicantName: rejectApplicant.fullName,
      status: "rejected",
      closeOnSuccess: true,
    });
  };

  const openPreview = (doc: unknown) => {
    const url = getDocumentHref(doc);
    const name = getDocumentName(doc);
    const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
    setPreviewDoc({ url, name, isImage });
  };

  const closePreview = () => {
    setPreviewDoc(null);
  };

  const handleStatusUpdate = (payload: {
    applicantId: string;
    applicantName: string;
    status: "reviewing" | "for_interview" | "rejected";
    interviewDate?: string;
    interviewTime?: string;
    location?: string;
    closeOnSuccess?: boolean;
  }) => {
    updateStatus.mutate(
      {
        id: payload.applicantId,
        data: {
          status: payload.status,
          interviewDate: payload.interviewDate,
          interviewTime: payload.interviewTime,
          location: payload.location,
        },
      },
      {
        onSuccess: (response: any) => {
          const emailSent = response?.notification?.emailSent;
          toast({
            title: "Applicant updated",
            description:
              payload.status === "for_interview"
                ? `${payload.applicantName} has been moved to For Interview.`
                : payload.status === "rejected"
                  ? emailSent
                    ? `${payload.applicantName} was not selected and notified by email.`
                    : `${payload.applicantName} was not selected. In-app notification saved.`
                  : `${payload.applicantName} has been marked as ${payload.status}.`,
          });
          if (payload.closeOnSuccess) {
            closeRejectConfirm();
          } else {
            closeApplicantModal();
          }
        },
        onError: (error: any) => {
          toast({
            variant: "destructive",
            title: "Update failed",
            description: error?.message || "Something went wrong. Please try again.",
          });
        },
      },
    );
  };

  return (
    <>
      <div className="space-y-6 pb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#224264]">Pending Review</h2>
          <p className="text-[#73869a]">New applications waiting for your initial screening before admin verification.</p>
        </div>

        <Card className="rounded-3xl border border-border/70 bg-white/95 shadow-sm">
          <CardHeader className="pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-xl">New Applications</CardTitle>
                <CardDescription>{filteredApplicants.length} applications need review</CardDescription>
              </div>
              <div className="relative flex-1 sm:flex-none sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search applicants..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto rounded-3xl border border-border/70 bg-background/80 shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                    <TableHead className="w-[240px] min-w-[180px]">Applicant</TableHead>
                    <TableHead className="w-[180px] min-w-[140px]">Job Title</TableHead>
                    <TableHead className="text-right w-[100px] min-w-[80px]">Applied</TableHead>
                    <TableHead className="text-right w-[220px] min-w-[150px]">Contact</TableHead>
                    <TableHead className="w-[220px] min-w-[180px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium"><Skeleton className="h-5 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
                        <TableCell><Skeleton className="h-9 w-64 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredApplicants.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No pending applications to review.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredApplicants.map((application) => (
                      <TableRow key={application.id} className="border-b border-border/50 bg-white/95 transition hover:bg-muted/20">
                        <TableCell className="font-medium align-top pt-5">
                          <button
                            type="button"
                            className="flex items-start gap-3 text-left"
                            onClick={() => openApplicantModal(application, "review")}
                          >
                            <ApplicantAvatar name={application.fullName} photoUrl={application.photoUrl} size="sm" />
                            <div>
                            <div className="font-semibold text-[#2f5e8f] hover:underline">{application.fullName}</div>
                            </div>
                          </button>
                          <div className="text-sm text-muted-foreground mt-1 max-w-[220px] leading-5">
                            {application.introduction?.slice(0, 100) || "No introduction provided."}
                          </div>
                        </TableCell>
                        <TableCell className="align-top pt-5">
                          <div className="font-medium">{application.title ?? application.position}</div>
                          <p className="text-sm text-muted-foreground">{application.employerName}</p>
                        </TableCell>
                        <TableCell className="text-right align-top pt-5">
                          <div className="text-sm font-medium">{format(new Date(application.appliedDate), "MMM dd")}</div>
                        </TableCell>
                        <TableCell className="text-right align-top pt-5 max-w-[220px] min-w-0">
                          <div className="text-xs font-medium flex flex-col items-end gap-1 text-muted-foreground">
                            <div className="flex items-center gap-1 truncate">
                              <Phone className="h-3 w-3" />
                              <span className="truncate max-w-[180px]">{application.contact}</span>
                            </div>
                            <div className="flex items-center gap-1 truncate">
                              <Mail className="h-3 w-3" />
                              <span className="truncate max-w-[180px]">{application.email}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="align-top pt-5 min-w-0">
                          <div className="flex flex-wrap justify-end gap-2 max-w-[220px]">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="gap-1 min-w-0 whitespace-nowrap shadow-sm"
                              onClick={() => openApplicantModal(application, "review")}
                            >
                              <Eye className="h-4 w-4" />
                              <span className="hidden sm:inline">Start Review</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="gap-1 min-w-0 whitespace-nowrap shadow-sm"
                              onClick={() => openApplicantModal(application, "schedule")}
                            >
                              <Calendar className="h-4 w-4" />
                              <span className="hidden sm:inline">Schedule Interview</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="gap-1 min-w-0 whitespace-nowrap shadow-sm"
                              onClick={() => openRejectConfirm(application)}
                            >
                              <XCircle className="h-4 w-4" />
                              <span className="hidden sm:inline">Reject</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Applicant Review / Schedule Modal */}
      <Dialog open={Boolean(selectedApplicant)} onOpenChange={(open) => { if (!open) closeApplicantModal(); }}>
        <DialogContent className="max-w-3xl bg-white overflow-y-auto max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>{selectedApplicant?.fullName}</DialogTitle>
            <DialogDescription>
              Review applicant details, inspect submitted documents, and continue the hiring workflow.
            </DialogDescription>
          </DialogHeader>

          {selectedApplicant ? (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <InfoCard label="Job Title" value={selectedApplicant.title ?? selectedApplicant.position} />
                <InfoCard label="Applied" value={format(new Date(selectedApplicant.appliedDate), "MMMM d, yyyy")} />
                <InfoCard label="Availability" value={selectedApplicant.availability || "Not provided"} />
                <InfoCard label="Shift Preference" value={selectedApplicant.shiftPreference || "Not provided"} />
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-4">
                  <section className="rounded-2xl border border-border bg-card p-4">
                    <h3 className="text-sm font-semibold text-foreground">Applicant Summary</h3>
                    <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> {selectedApplicant.contact}</div>
                      <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> {selectedApplicant.email}</div>
                    </div>
                    <div className="mt-4 text-sm leading-6 text-slate-700">
                      {selectedApplicant.introduction || "No introduction provided."}
                    </div>
                  </section>

                  <section className="rounded-2xl border border-border bg-card p-4">
                    <h3 className="text-sm font-semibold text-foreground">Submitted Documents</h3>
                    <div className="mt-3 space-y-3">
                      {selectedApplicant.documents?.length ? (
                        selectedApplicant.documents.map((doc, index) => (
                          <div key={`${getDocumentName(doc)}-${index}`} className="flex items-center justify-between rounded-xl border border-border bg-white px-4 py-3">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">{getDocumentName(doc)}</span>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => openPreview(doc)}>
                              View
                            </Button>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No submitted documents were found for this applicant.</p>
                      )}
                    </div>
                  </section>
                </div>

                <section className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-semibold text-foreground">
                        {reviewMode === "schedule" ? "Interview Details" : "Review Notes"}
                      </h3>
                    </div>
                    {reviewMode === "review" ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-xs h-7"
                        onClick={() => setReviewMode("schedule")}
                      >
                        Proceed to Interview
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-xs h-7"
                        onClick={() => setReviewMode("review")}
                      >
                        <ArrowLeft className="h-3 w-3" />
                        Back to Review
                      </Button>
                    )}
                  </div>

                  {reviewMode === "schedule" ? (
                    <div className="mt-4 space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Interview Date</label>
                        <Input type="date" value={interviewDate} onChange={(event) => setInterviewDate(event.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Interview Time</label>
                        <Input type="time" value={interviewTime} onChange={(event) => setInterviewTime(event.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Location</label>
                        <Input value={interviewLocation} onChange={(event) => setInterviewLocation(event.target.value)} />
                      </div>
                      {interviewDate && interviewTime ? (
                        <InterviewSummaryCard
                          applicantName={selectedApplicant.fullName}
                          position={selectedApplicant.title ?? selectedApplicant.position}
                          interviewDate={interviewDate}
                          interviewTime={interviewTime}
                          location={interviewLocation}
                          contact={selectedApplicant.contact}
                        />
                      ) : null}
                      <InterviewGuidancePanel variant="employer" />
                    </div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      <Textarea
                        value={reviewNotes}
                        onChange={(event) => setReviewNotes(event.target.value)}
                        placeholder="Add internal screening notes for this applicant..."
                        rows={8}
                      />
                      <p className="text-xs text-muted-foreground">
                        These notes stay in the current review session while you decide the next action.
                      </p>
                    </div>
                  )}
                </section>
              </div>
            </div>
          ) : null}

          <DialogFooter className="gap-2 sm:justify-between">
            <Button type="button" variant="outline" onClick={closeApplicantModal}>
              Close
            </Button>

            {selectedApplicant ? (
              <div className="flex flex-wrap justify-end gap-2">
                {reviewMode === "review" && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        handleStatusUpdate({
                          applicantId: selectedApplicant.id,
                          applicantName: selectedApplicant.fullName,
                          status: "reviewing",
                        })
                      }
                    >
                      Mark as Reviewing
                    </Button>
                    <Button
                      type="button"
                      className="gap-1"
                      onClick={() => setReviewMode("schedule")}
                    >
                      Proceed to Interview
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </>
                )}
                {reviewMode === "schedule" && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-1"
                      onClick={() => setReviewMode("review")}
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back to Review
                    </Button>
                    <Button
                      type="button"
                      onClick={() =>
                        handleStatusUpdate({
                          applicantId: selectedApplicant.id,
                          applicantName: selectedApplicant.fullName,
                          status: "for_interview",
                          interviewDate,
                          interviewTime,
                          location: interviewLocation,
                        })
                      }
                      disabled={!interviewDate || !interviewTime || updateStatus.isPending}
                    >
                      {updateStatus.isPending ? "Saving..." : "Save Interview Schedule"}
                    </Button>
                  </>
                )}
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => openRejectConfirm(selectedApplicant)}
                >
                  Reject Applicant
                </Button>
              </div>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Preview Dialog */}
      <Dialog open={Boolean(previewDoc)} onOpenChange={(open) => { if (!open) closePreview(); }}>
        <DialogContent className="sm:max-w-3xl bg-white overflow-y-auto max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>{previewDoc?.name ?? "Document Preview"}</DialogTitle>
            <DialogDescription>
              Preview the submitted document below.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2">
            {previewDoc?.isImage ? (
              <img
                src={previewDoc.url}
                alt={previewDoc.name}
                className="max-w-full max-h-[60vh] rounded-lg border border-border mx-auto object-contain"
              />
            ) : (
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-4">
                <p className="text-sm text-muted-foreground">
                  This document type cannot be previewed directly in the browser.
                </p>
                <Button asChild>
                  <a href={previewDoc?.url} target="_blank" rel="noreferrer" download>
                    Open / Download File
                  </a>
                </Button>
                {previewDoc?.url && (
                  <iframe
                    src={previewDoc.url}
                    title={previewDoc.name}
                    className="w-full h-[50vh] rounded-lg border border-border bg-white"
                  />
                )}
              </div>
            )}
          </div>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={closePreview}>
              Close
            </Button>
            <Button asChild>
              <a href={previewDoc?.url} target="_blank" rel="noreferrer" download>
                Download
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {rejectApplicant ? (
        <ApplicationDecisionDialog
          open={Boolean(rejectApplicant)}
          onOpenChange={(open) => {
            if (!open) closeRejectConfirm();
          }}
          applicantName={rejectApplicant.fullName}
          applicantEmail={rejectApplicant.email}
          jobTitle={rejectApplicant.title || rejectApplicant.position}
          employerName={rejectApplicant.employerName || "Your company"}
          decision="rejected"
          isSubmitting={updateStatus.isPending}
          onConfirm={confirmAndReject}
        />
      ) : null}
    </>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-2 text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

