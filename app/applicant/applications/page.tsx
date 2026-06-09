"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Calendar, MapPin, Briefcase, Clock, FileText, Building2, BadgeCheck, Edit, Eye, MapPinned, Phone, Mail, User, Download, ExternalLink, Send } from "lucide-react";
import { getDocumentHref, getDocumentName } from "@/app/employer/lib/portal-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useListApplicantApplications, useUpdateJobApplication } from "@workspace/api-client-react";

const statusConfig = {
  pending: { label: "Pending Review", color: "default" },
  reviewing: { label: "Under Review", color: "default" },
  for_interview: { label: "For Interview", color: "secondary" },
  hired: { label: "Hired ✅", color: "default" },
  rejected: { label: "Not Selected", color: "destructive" },
} as const;

export default function ApplicantApplicationsPage() {
  const { data: applications = [], isLoading } = useListApplicantApplications();
  const updateApplication = useUpdateJobApplication();
  const { toast } = useToast();
  const [editingApplication, setEditingApplication] = useState<any>(null);
  const [viewInterviewApp, setViewInterviewApp] = useState<any>(null);
  const [viewSubmissionApp, setViewSubmissionApp] = useState<any>(null);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; name: string; isImage: boolean } | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    availability: "",
    shiftPreference: "",
    introduction: "",
  });

  const handleEdit = (application: any) => {
    setEditingApplication(application);
    setEditForm({
      fullName: application.fullName,
      email: application.email,
      phone: application.contact,
      availability: application.availability,
      shiftPreference: application.shiftPreference,
      introduction: application.introduction,
    });
  };

  const openDocumentPreview = (doc: unknown) => {
    const url = getDocumentHref(doc);
    const name = getDocumentName(doc);
    const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
    setPreviewDoc({ url, name, isImage });
  };

  const handleSaveEdit = () => {
    if (!editingApplication) return;
    const payload = { ...editForm, phone: editForm.phone.replace(/\D/g, "").slice(0, 11) };
    updateApplication.mutate(
      { applicationId: editingApplication.id, ...payload },
      {
        onSuccess: () => {
          toast({ title: "Application updated", description: "Your application changes have been saved successfully." });
          setEditingApplication(null);
        },
        onError: (error: any) => {
          toast({ title: "Update failed", description: error.message || "Failed to update application.", variant: "destructive" });
        },
      }
    );
  };

  const grouped = useMemo(() => {
    const groups = { active: [] as any[], past: [] as any[] };
    applications.forEach((app: any) => {
      if (["pending", "reviewing", "for_interview"].includes(app.status)) {
        groups.active.push(app);
      } else {
        groups.past.push(app);
      }
    });
    return groups;
  }, [applications]);

  if (isLoading) {
    return (
      <div className="space-y-6 pb-8">
        <div className="space-y-3">
          <div className="h-8 w-64 rounded-xl bg-gradient-to-r from-[#f0f5f9] to-[#e2ecf5] animate-pulse" />
          <div className="h-5 w-80 rounded-lg bg-gradient-to-r from-[#f0f5f9] to-[#e2ecf5] animate-pulse" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="p-6 pb-4">
                <div className="h-6 w-48 rounded-xl bg-gradient-to-r from-[#f0f5f9] to-[#e2ecf5] animate-pulse" />
                <div className="mt-3 h-4 w-32 rounded-lg bg-gradient-to-r from-[#f0f5f9] to-[#e2ecf5] animate-pulse" />
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 h-10 w-full rounded-xl bg-gradient-to-r from-[#f0f5f9] to-[#e2ecf5] animate-pulse" />
                  <div className="h-4 w-3/4 rounded-lg bg-gradient-to-r from-[#f0f5f9] to-[#e2ecf5] animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#224264]">My Applications</h2>
        <p className="text-[#73869a]">Track your job applications, interview schedules, and hiring status across all employers.</p>
      </div>

      {grouped.active.length === 0 && grouped.past.length === 0 ? (
        <Card className="border-dashed border-[#d6e1eb]">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <FileText className="mb-6 h-16 w-16 text-[#2f6fa4]/40" />
            <h3 className="text-xl font-semibold text-[#27425f] mb-2">No applications yet</h3>
            <p className="max-w-md text-[#75889c] mb-6">Head back to Discover Jobs and swipe on opportunities that match your skills and schedule.</p>
            <a href="/applicant" className="inline-flex items-center gap-2 rounded-full bg-[#2f6fa4] px-6 py-3 font-semibold text-white shadow-lg hover:bg-[#255b89] transition-colors">
              <Briefcase className="h-4 w-4" /> Find Jobs to Apply
            </a>
          </CardContent>
        </Card>
      ) : (
        <>
          {grouped.active.length > 0 && (
            <div>
              <div className="mb-6 flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-[#53b97a]"></div>
                <h3 className="text-lg font-semibold text-[#2f5e8f]">Active Applications ({grouped.active.length})</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {grouped.active.map((application: any) => (
                  <ApplicationCard key={application.id} application={application} onEdit={handleEdit} onViewInterview={setViewInterviewApp} onViewSubmission={setViewSubmissionApp} />
                ))}
              </div>
            </div>
          )}
          {grouped.past.length > 0 && (
            <div>
              <div className="mb-6 flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-[#ea7a6b]"></div>
                <h3 className="text-lg font-semibold text-[#2f5e8f]">Current Position ({grouped.past.length})</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {grouped.past.map((application: any) => (
                  <ApplicationCard key={application.id} application={application} onEdit={handleEdit} onViewInterview={setViewInterviewApp} onViewSubmission={setViewSubmissionApp} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <Dialog open={!!editingApplication} onOpenChange={() => setEditingApplication(null)}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>Edit Application</DialogTitle>
            <DialogDescription>Update your application details for {editingApplication?.title || editingApplication?.position}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name <span className="text-red-500">*</span></label>
                <Input value={editForm.fullName} onChange={(e) => setEditForm((prev) => ({ ...prev, fullName: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email <span className="text-red-500">*</span></label>
                <Input type="email" value={editForm.email} onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone <span className="text-red-500">*</span></label>
                <Input
                  inputMode="numeric"
                  value={editForm.phone}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value.replace(/\D/g, "").slice(0, 11) }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Availability <span className="text-red-500">*</span></label>
                <Input value={editForm.availability} onChange={(e) => setEditForm((prev) => ({ ...prev, availability: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Shift Preference</label>
              <Input value={editForm.shiftPreference} onChange={(e) => setEditForm((prev) => ({ ...prev, shiftPreference: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Introduction <span className="text-red-500">*</span></label>
              <Textarea value={editForm.introduction} onChange={(e) => setEditForm((prev) => ({ ...prev, introduction: e.target.value }))} rows={4} />
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSaveEdit} disabled={updateApplication.isPending}>
                {updateApplication.isPending ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="outline" onClick={() => setEditingApplication(null)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewSubmissionApp} onOpenChange={() => setViewSubmissionApp(null)}>
        <DialogContent className="max-w-2xl gap-0 overflow-hidden border-0 p-0 bg-white sm:max-w-2xl">
          {viewSubmissionApp && (
            <>
              <div className="relative overflow-hidden bg-gradient-to-br from-[#2f5e8f] via-[#255b89] to-[#1a3d5c] px-6 py-6 text-white">
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-cyan-400/20 blur-xl" />
                <div className="relative space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-white/70">Your Submission</p>
                      <DialogTitle className="mt-1 text-xl font-bold text-white sm:text-2xl">
                        {viewSubmissionApp.title || viewSubmissionApp.position}
                      </DialogTitle>
                      <p className="mt-1 text-sm text-white/80">{viewSubmissionApp.employerName}</p>
                    </div>
                    <Badge
                      variant={statusConfig[viewSubmissionApp.status as keyof typeof statusConfig]?.color as any}
                      className="shrink-0 border-white/20 bg-white/15 text-white backdrop-blur-sm"
                    >
                      {statusConfig[viewSubmissionApp.status as keyof typeof statusConfig]?.label}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 backdrop-blur-sm">
                      <MapPin className="h-3 w-3" />
                      {viewSubmissionApp.location || "Barangay 634"}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 backdrop-blur-sm">
                      <Calendar className="h-3 w-3" />
                      Applied {format(new Date(viewSubmissionApp.appliedDate), "MMM d, yyyy")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="max-h-[min(60vh,520px)] overflow-y-auto px-6 py-5 space-y-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <SubmissionInfoTile icon={User} label="Full Name" value={viewSubmissionApp.fullName} />
                  <SubmissionInfoTile icon={Mail} label="Email" value={viewSubmissionApp.email} />
                  <SubmissionInfoTile icon={Phone} label="Phone" value={viewSubmissionApp.contact || "Not provided"} />
                  <SubmissionInfoTile icon={Clock} label="Availability" value={viewSubmissionApp.availability || "Not specified"} />
                  {viewSubmissionApp.shiftPreference && (
                    <SubmissionInfoTile icon={Briefcase} label="Shift Preference" value={viewSubmissionApp.shiftPreference} className="sm:col-span-2" />
                  )}
                </div>

                <section className="rounded-2xl border border-[#e2ecf5] bg-[#f8fbfd] p-4">
                  <div className="flex items-center gap-2 text-[#2f5e8f]">
                    <Send className="h-4 w-4" />
                    <h3 className="text-sm font-semibold">Introduction</h3>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-[#506274] whitespace-pre-wrap">
                    {viewSubmissionApp.introduction || "No introduction was provided."}
                  </p>
                </section>

                <section className="rounded-2xl border border-[#e2ecf5] bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#2f5e8f]">
                      <FileText className="h-4 w-4" />
                      <h3 className="text-sm font-semibold">Submitted Documents</h3>
                    </div>
                    <span className="rounded-full bg-[#e8f4fc] px-2.5 py-0.5 text-xs font-medium text-[#2f6fa4]">
                      {viewSubmissionApp.documents?.length ?? 0} file{(viewSubmissionApp.documents?.length ?? 0) === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {viewSubmissionApp.documents?.length ? (
                      viewSubmissionApp.documents.map((doc: unknown, index: number) => {
                        const name = getDocumentName(doc);
                        const href = getDocumentHref(doc);
                        return (
                          <div
                            key={`${name}-${index}`}
                            className="group flex items-center justify-between gap-3 rounded-xl border border-[#e2ecf5] bg-[#f8fbfd] px-4 py-3 transition-colors hover:border-[#2f6fa4]/30 hover:bg-[#f0f7fc]"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2f6fa4]/10 text-[#2f6fa4]">
                                <FileText className="h-4 w-4" />
                              </div>
                              <span className="truncate text-sm font-medium text-[#27425f]">{name}</span>
                            </div>
                            <div className="flex shrink-0 gap-1.5">
                              {href ? (
                                <>
                                  <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs text-[#2f6fa4]" onClick={() => openDocumentPreview(doc)}>
                                    <Eye className="h-3.5 w-3.5" />
                                    Preview
                                  </Button>
                                  <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" asChild>
                                    <a href={href} target="_blank" rel="noreferrer">
                                      <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                  </Button>
                                </>
                              ) : (
                                <span className="text-xs text-[#73869a]">Unavailable</span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="rounded-xl border border-dashed border-[#d6e1eb] bg-[#f8fbfd] px-4 py-6 text-center text-sm text-[#73869a]">
                        No documents were attached to this application.
                      </p>
                    )}
                  </div>
                </section>

                {viewSubmissionApp.status === "for_interview" && viewSubmissionApp.interviewDate && (
                  <section className="rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-50/80 to-sky-50/50 p-4">
                    <div className="flex items-center gap-2 text-cyan-700">
                      <Calendar className="h-4 w-4" />
                      <h3 className="text-sm font-semibold">Interview Scheduled</h3>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-[#506274] sm:grid-cols-3">
                      <p><span className="font-medium text-[#27425f]">Date:</span> {format(new Date(viewSubmissionApp.interviewDate), "MMM d, yyyy")}</p>
                      <p><span className="font-medium text-[#27425f]">Time:</span> {viewSubmissionApp.interviewTime || "TBD"}</p>
                      <p><span className="font-medium text-[#27425f]">Location:</span> {viewSubmissionApp.interviewLocation || "Barangay 634 Hall"}</p>
                    </div>
                  </section>
                )}
              </div>

              <DialogFooter className="border-t border-[#e2ecf5] bg-[#f8fbfd] px-6 py-4">
                {["pending", "reviewing"].includes(viewSubmissionApp.status) && (
                  <Button variant="outline" className="gap-2" onClick={() => { setViewSubmissionApp(null); handleEdit(viewSubmissionApp); }}>
                    <Edit className="h-4 w-4" />
                    Edit Submission
                  </Button>
                )}
                <Button variant="outline" onClick={() => setViewSubmissionApp(null)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle>{previewDoc?.name ?? "Document Preview"}</DialogTitle>
            <DialogDescription>Preview the document you submitted with this application.</DialogDescription>
          </DialogHeader>
          <div className="mt-2">
            {previewDoc?.isImage ? (
              <img src={previewDoc.url} alt={previewDoc.name} className="mx-auto max-h-[60vh] max-w-full rounded-xl border border-[#e2ecf5] object-contain" />
            ) : (
              <div className="space-y-4 rounded-xl border border-[#e2ecf5] bg-[#f8fbfd] p-6 text-center">
                <FileText className="mx-auto h-12 w-12 text-[#2f6fa4]/40" />
                <p className="text-sm text-[#73869a]">This file type cannot be previewed in the browser.</p>
                {previewDoc?.url && (
                  <Button asChild className="gap-2">
                    <a href={previewDoc.url} target="_blank" rel="noreferrer" download>
                      <Download className="h-4 w-4" />
                      Open / Download
                    </a>
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewInterviewApp} onOpenChange={() => setViewInterviewApp(null)}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Interview Scheduled</DialogTitle>
            <DialogDescription>An employer has scheduled an interview for your application.</DialogDescription>
          </DialogHeader>
          {viewInterviewApp && (
            <div className="space-y-5 mt-2">
              <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Job Position</p>
                <p className="text-base font-semibold text-foreground">{viewInterviewApp.title || viewInterviewApp.position}</p>
                <p className="text-sm text-muted-foreground">{viewInterviewApp.employerName}</p>
              </div>
              {viewInterviewApp.interviewDate ? (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-cyan-500/20 bg-cyan-50/50 p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-cyan-500/10 flex items-center justify-center shrink-0"><Calendar className="h-4 w-4 text-cyan-600" /></div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{format(new Date(viewInterviewApp.interviewDate), "EEEE, MMMM d, yyyy")}</p>
                        <p className="text-xs text-muted-foreground">Interview Date</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-cyan-500/10 flex items-center justify-center shrink-0"><Clock className="h-4 w-4 text-cyan-600" /></div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{viewInterviewApp.interviewTime}</p>
                        <p className="text-xs text-muted-foreground">Interview Time</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-cyan-500/10 flex items-center justify-center shrink-0"><MapPinned className="h-4 w-4 text-cyan-600" /></div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{viewInterviewApp.interviewLocation || "Barangay 634 Hall"}</p>
                        <p className="text-xs text-muted-foreground">Location</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="h-4 w-4" />{viewInterviewApp.contact || "Not provided"}</div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-center">
                  <p className="text-sm text-muted-foreground">Interview details are being finalized. Check back soon.</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setViewInterviewApp(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SubmissionInfoTile({
  icon: Icon,
  label,
  value,
  className = "",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-[#e2ecf5] bg-white p-3.5 ${className}`}>
      <div className="flex items-center gap-2 text-[#73869a]">
        <Icon className="h-3.5 w-3.5" />
        <p className="text-xs font-medium uppercase tracking-wide">{label}</p>
      </div>
      <p className="mt-1.5 truncate text-sm font-semibold text-[#27425f]">{value}</p>
    </div>
  );
}

function ApplicationCard({
  application,
  onEdit,
  onViewInterview,
  onViewSubmission,
}: {
  application: any;
  onEdit: (app: any) => void;
  onViewInterview: (app: any) => void;
  onViewSubmission: (app: any) => void;
}) {
  const status = statusConfig[application.status as keyof typeof statusConfig];
  const canEdit = ["pending", "reviewing"].includes(application.status);
  const isForInterview = application.status === "for_interview";

  return (
    <Card className="overflow-hidden hover:shadow-[0_20px_40px_rgba(37,91,142,0.12)] transition-all hover:-translate-y-1">
      <CardHeader className="bg-gradient-to-r from-[#2f5e8f] to-[#214b74] p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="text-xl font-bold">{application.title || application.position}</h4>
            <p className="mt-1 text-white/90">{application.employerName}</p>
          </div>
          {isForInterview ? (
            <button type="button" onClick={() => onViewInterview(application)} className="focus:outline-none">
              <Badge variant="secondary" className="text-sm font-semibold bg-cyan-500/20 text-cyan-100 border-cyan-500/30 hover:bg-cyan-500/30 cursor-pointer">{status.label}</Badge>
            </button>
          ) : (
            <Badge variant={status.color as any} className="text-sm font-semibold">{status.label}</Badge>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <div className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 backdrop-blur-sm"><MapPin className="h-3 w-3" />{application.location}</div>
          <div className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 backdrop-blur-sm"><Calendar className="h-3 w-3" />{new Date(application.appliedDate).toLocaleDateString()}</div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="text-sm text-[#506274] leading-relaxed">{application.introduction?.slice(0, 150)}...</div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-[#6d8195]" /><span>{application.shiftPreference || application.availability}</span></div>
          <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-[#6d8195]" /><span>{application.applicantCount || 0} applicants</span></div>
        </div>
        {application.documents?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {application.documents.slice(0, 3).map((doc: any, i: number) => (
              <Badge key={i} variant="outline" className="text-xs">{typeof doc === 'string' ? doc : doc.name}</Badge>
            ))}
            {application.documents.length > 3 && <Badge variant="secondary" className="text-xs">+{application.documents.length - 3}</Badge>}
          </div>
        )}
        <div className="flex gap-2 pt-2">
          <Badge variant="outline" className="flex-1 justify-center text-xs"><FileText className="h-3 w-3 mr-1" />Employer Requirements</Badge>
          <Badge variant="secondary" className="flex-1 justify-center text-xs"><BadgeCheck className="h-3 w-3 mr-1" />Admin Verification</Badge>
        </div>
        <Button size="sm" className="w-full mt-2 gap-2 bg-[#2f6fa4] hover:bg-[#255b89]" onClick={() => onViewSubmission(application)}>
          <Eye className="h-4 w-4" />
          View Submission
        </Button>
        {isForInterview && (
          <Button size="sm" variant="outline" className="w-full gap-2" onClick={() => onViewInterview(application)}>
            <Calendar className="h-4 w-4" />
            View Interview Schedule
          </Button>
        )}
        {canEdit && (
          <Button variant="outline" size="sm" onClick={() => onEdit(application)} className="w-full"><Edit className="h-4 w-4 mr-2" />Edit Application</Button>
        )}
      </CardContent>
    </Card>
  );
}
