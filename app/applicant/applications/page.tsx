"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Calendar, MapPin, Briefcase, Clock, FileText, Building2, BadgeCheck, Edit, Eye, MapPinned, Phone } from "lucide-react";
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
                  <ApplicationCard key={application.id} application={application} onEdit={handleEdit} onViewInterview={setViewInterviewApp} />
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
                  <ApplicationCard key={application.id} application={application} onEdit={handleEdit} onViewInterview={setViewInterviewApp} />
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

function ApplicationCard({ application, onEdit, onViewInterview }: { application: any; onEdit: (app: any) => void; onViewInterview: (app: any) => void; }) {
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
        {isForInterview && (
          <Button size="sm" className="w-full mt-2 gap-2" onClick={() => onViewInterview(application)}><Eye className="h-4 w-4" />View Interview Schedule</Button>
        )}
        {canEdit && (
          <Button variant="outline" size="sm" onClick={() => onEdit(application)} className="w-full mt-2"><Edit className="h-4 w-4 mr-2" />Edit Application</Button>
        )}
      </CardContent>
    </Card>
  );
}
