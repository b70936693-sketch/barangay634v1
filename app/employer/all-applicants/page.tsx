"use client";

import Link from 'next/link';
import { addDays, format } from 'date-fns';
import { useState } from 'react';
import { useListApplicants, useUpdateApplicantStatus } from '../api-client-react';
import { Search, Eye, Filter, Mail, Phone, CalendarClock, UserCheck, XCircle, FileText, Download, MessageSquare } from 'lucide-react';
import { buildInterviewInviteMessage, InterviewGuidancePanel, InterviewSummaryCard } from '@/lib/interview-guidance';
import { buildSmsLink, formatPhoneDisplay } from '@/lib/phone-links';
import { getApplicantContact } from '@/app/employer/lib/applicant-display';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getDocumentHref, getDocumentName } from '@/app/employer/lib/portal-actions';
import { ApplicationDecisionDialog } from '@/lib/application-decision-dialog';
import { ApplicantAvatar } from '@/components/applicant-avatar';

interface ApplicantDocument {
  id?: string;
  name?: string;
  url?: string;
  path?: string;
}

interface ApplicantRow {
  id: string;
  fullName: string;
  email?: string;
  position: string;
  appliedDate: string;
  status: string;
  contact?: string;
  phone?: string;
  title?: string;
  jobPostTitle?: string;
  employerName?: string;
  documents?: Array<string | ApplicantDocument>;
  photoUrl?: string | null;
}

const DEFAULT_INTERVIEW_LOCATION = 'Barangay 634 Hall';

export default function AllApplicants() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeApplicant, setActiveApplicant] = useState<ApplicantRow | null>(null);
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; name: string; isImage: boolean } | null>(null);
  const [scheduleApplicant, setScheduleApplicant] = useState<ApplicantRow | null>(null);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('13:30');
  const [interviewLocation, setInterviewLocation] = useState(DEFAULT_INTERVIEW_LOCATION);
  const [pendingDecision, setPendingDecision] = useState<{
    applicant: ApplicantRow;
    decision: 'hired' | 'rejected';
  } | null>(null);
  const { toast } = useToast();
  const updateStatus = useUpdateApplicantStatus();

  const { data: applicants = [], isLoading } = useListApplicants();
  const typedApplicants = applicants as ApplicantRow[];

  const openDocumentPreview = (doc: unknown) => {
    const url = getDocumentHref(doc);
    if (!url) return;
    const name = getDocumentName(doc);
    const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
    setPreviewDoc({ url, name, isImage });
  };

  const openApplicantDocuments = (applicant: ApplicantRow) => {
    setActiveApplicant(applicant);
    setIsDocumentDialogOpen(true);
    const firstDoc = applicant.documents?.[0];
    if (firstDoc) {
      openDocumentPreview(firstDoc);
    } else {
      setPreviewDoc(null);
    }
  };

  const closeApplicantDocuments = () => {
    setActiveApplicant(null);
    setPreviewDoc(null);
    setIsDocumentDialogOpen(false);
  };

  const openInterviewDialog = (applicant: ApplicantRow) => {
    setScheduleApplicant(applicant);
    setInterviewDate(addDays(new Date(applicant.appliedDate || Date.now()), 5).toISOString().slice(0, 10));
    setInterviewTime('13:30');
    setInterviewLocation(DEFAULT_INTERVIEW_LOCATION);
  };

  const closeInterviewDialog = () => {
    setScheduleApplicant(null);
    setInterviewDate('');
    setInterviewTime('13:30');
    setInterviewLocation(DEFAULT_INTERVIEW_LOCATION);
  };

  const confirmInterviewSchedule = () => {
    if (!scheduleApplicant || !interviewDate || !interviewTime) {
      toast({
        title: 'Missing interview details',
        description: 'Please set both the interview date and time.',
        variant: 'destructive',
      });
      return;
    }

    updateStatus.mutate(
      {
        id: scheduleApplicant.id,
        data: {
          status: 'for_interview',
          interviewDate,
          interviewTime,
          location: interviewLocation.trim() || DEFAULT_INTERVIEW_LOCATION,
        },
      },
      {
        onSuccess: () => {
          toast({
            title: 'Interview scheduled',
            description: `${scheduleApplicant.fullName} has been moved to For Interview.`,
          });
          closeInterviewDialog();
        },
        onError: (error: unknown) => {
          toast({
            title: 'Interview scheduling failed',
            description: error instanceof Error ? error.message : 'Unable to schedule interview. Please try again.',
            variant: 'destructive',
          });
        },
      },
    );
  };

  const openDecisionDialog = (applicant: ApplicantRow, decision: 'hired' | 'rejected') => {
    setPendingDecision({ applicant, decision });
  };

  const closeDecisionDialog = () => {
    setPendingDecision(null);
  };

  const confirmApplicantDecision = () => {
    if (!pendingDecision) return;
    const { applicant, decision } = pendingDecision;

    updateStatus.mutate(
      { id: applicant.id, data: { status: decision } },
      {
        onSuccess: (response: any) => {
          const emailSent = response?.notification?.emailSent;
          toast({
            title: decision === 'hired' ? 'Applicant hired' : 'Applicant not selected',
            description: emailSent
              ? `${applicant.fullName} was updated and notified by email.`
              : `${applicant.fullName} was updated. In-app notification saved.`,
          });
          closeDecisionDialog();
        },
        onError: (error: unknown) => {
          toast({
            title: 'Update failed',
            description: error instanceof Error ? error.message : 'Unable to update applicant status.',
            variant: 'destructive',
          });
        },
      },
    );
  };

  const filteredApplicants = typedApplicants.filter((app) => {
    const matchesSearch = searchTerm === '' || 
      app.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.title || app.position || app.jobPostTitle || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const safeDateFormat = (dateString: string | undefined | null): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'N/A' : format(date, 'MMM d, yyyy');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700 border-yellow-500/30">Pending</Badge>;
      case 'reviewing':
        return <Badge variant="secondary" className="bg-blue-500/20 text-blue-700 border-blue-500/30">Reviewing</Badge>;
      case 'for_interview':
        return <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-700 border-cyan-500/30">For Interview</Badge>;
      case 'hired':
        return <Badge variant="secondary" className="bg-green-500/20 text-green-700 border-green-500/30">Hired</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-500/20 text-red-700 border-red-500/30">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">All Applicants</h2>
        </div>
      </div>

      <Card>
        <CardHeader className="bg-muted/30 border-b border-border pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-lg font-medium">Applicants</CardTitle>
              <CardDescription>
                {filteredApplicants?.length || 0} candidates found
              </CardDescription>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by name or role..."
                  className="pl-8 bg-card"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-card">
                    <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Filter Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="reviewing">Reviewing</SelectItem>
                    <SelectItem value="for_interview">For Interview</SelectItem>
                    <SelectItem value="hired">Hired</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6 w-[180px] min-w-[140px]">Name</TableHead>
                  <TableHead className="w-[160px] min-w-[120px]">Position</TableHead>
                  <TableHead className="w-[110px] min-w-[90px]">Applied Date</TableHead>
                  <TableHead className="w-[100px] min-w-[80px]">Status</TableHead>
                  <TableHead className="w-[150px] min-w-[120px]">Contact</TableHead>
                  <TableHead className="text-right pr-6 min-w-[200px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="pl-6"><Skeleton className="h-5 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell className="text-right pr-6"><Skeleton className="h-9 w-24 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredApplicants?.length ? (
                  filteredApplicants.map((applicant) => (
                    <TableRow key={applicant.id}>
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3 font-medium">
                          <ApplicantAvatar name={applicant.fullName} photoUrl={applicant.photoUrl} size="sm" />
                          <span>{applicant.fullName}</span>
                        </div>
                      </TableCell>
                      <TableCell>{applicant.position}</TableCell>
                      <TableCell>{safeDateFormat(applicant.appliedDate)}</TableCell>
                      <TableCell>{getStatusBadge(applicant.status)}</TableCell>
                      <TableCell className="max-w-[150px] min-w-0 truncate">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground truncate">
                          <Phone className="h-3 w-3 shrink-0" />
                          <span className="truncate">{applicant.contact || applicant.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell className="pr-6 align-middle">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            title="View documents"
                            className="h-8 shrink-0 gap-1.5 px-2.5"
                            onClick={() => openApplicantDocuments(applicant)}
                          >
                            <Mail className="h-3.5 w-3.5 shrink-0" />
                            <span className="hidden 2xl:inline">Documents</span>
                          </Button>
                          {applicant.status === 'hired' || applicant.status === 'rejected' ? (
                            <Button asChild variant="secondary" size="sm" title="View applicant" className="h-8 shrink-0 gap-1.5 px-2.5">
                              <Link href={`/employer/applicants/${applicant.id}`} className="flex items-center gap-1.5">
                                <Eye className="h-3.5 w-3.5 shrink-0" />
                                <span className="hidden 2xl:inline">View</span>
                              </Link>
                            </Button>
                          ) : (
                            <>
                              {(applicant.status === 'pending' || applicant.status === 'reviewing' || applicant.status === 'for_interview') && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  title={applicant.status === 'for_interview' ? 'Reschedule interview' : 'Schedule interview'}
                                  className="h-8 shrink-0 gap-1.5 px-2.5"
                                  disabled={updateStatus.isPending}
                                  onClick={() => openInterviewDialog(applicant)}
                                >
                                  <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                                  <span className="hidden 2xl:inline">
                                    {applicant.status === 'for_interview' ? 'Reschedule' : 'Interview'}
                                  </span>
                                </Button>
                              )}
                              <Button
                                variant="secondary"
                                size="sm"
                                title="Hire applicant"
                                className="h-8 shrink-0 gap-1.5 px-2.5"
                                disabled={updateStatus.isPending}
                                onClick={() => openDecisionDialog(applicant, 'hired')}
                              >
                                <UserCheck className="h-3.5 w-3.5 shrink-0" />
                                <span className="hidden 2xl:inline">Hire</span>
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                title="Reject applicant"
                                className="h-8 shrink-0 gap-1.5 px-2.5"
                                disabled={updateStatus.isPending}
                                onClick={() => openDecisionDialog(applicant, 'rejected')}
                              >
                                <XCircle className="h-3.5 w-3.5 shrink-0" />
                                <span className="hidden 2xl:inline">Reject</span>
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      No applicants match your criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDocumentDialogOpen} onOpenChange={(open) => { if (!open) closeApplicantDocuments(); }}>
        <DialogContent className="max-w-4xl bg-white overflow-y-auto max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Submitted documents for {activeApplicant?.fullName}</DialogTitle>
            <DialogDescription>Click a document to preview it below.</DialogDescription>
          </DialogHeader>

          {activeApplicant?.documents?.length ? (
            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
              <div className="space-y-2">
                {activeApplicant.documents.map((doc, index: number) => {
                  const documentHref = getDocumentHref(doc);
                  const documentName = getDocumentName(doc);
                  const isSelected = previewDoc?.name === documentName && previewDoc?.url === documentHref;
                  const isImage = documentHref ? /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(documentHref) : false;

                  return (
                    <button
                      key={`${documentName}-${index}`}
                      type="button"
                      disabled={!documentHref}
                      onClick={() => openDocumentPreview(doc)}
                      className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                        isSelected
                          ? "border-[#2f6fa4] bg-[#f2f8fd] shadow-sm"
                          : "border-border bg-card hover:border-[#b9d0e8] hover:bg-[#f8fbff]"
                      }`}
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/30">
                        {documentHref && isImage ? (
                          <img
                            src={documentHref}
                            alt={documentName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{documentName}</p>
                        <p className="text-sm text-muted-foreground">
                          {documentHref ? "Click to preview" : "Preview unavailable"}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="rounded-2xl border border-border bg-[#f8fbff] p-4">
                {previewDoc ? (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[#203142]">{previewDoc.name}</p>
                        <p className="text-sm text-muted-foreground">Document preview</p>
                      </div>
                      <Button asChild variant="outline" size="sm" className="shrink-0 gap-1.5">
                        <a href={previewDoc.url} target="_blank" rel="noreferrer" download>
                          <Download className="h-3.5 w-3.5" />
                          Download
                        </a>
                      </Button>
                    </div>

                    {previewDoc.isImage ? (
                      <img
                        src={previewDoc.url}
                        alt={previewDoc.name}
                        className="mx-auto max-h-[52vh] w-full rounded-xl border border-border bg-white object-contain"
                      />
                    ) : (
                      <div className="space-y-4 rounded-xl border border-border bg-white p-4">
                        <p className="text-sm text-muted-foreground">
                          This file type may not preview inline. Use the viewer below or download the file.
                        </p>
                        <iframe
                          src={previewDoc.url}
                          title={previewDoc.name}
                          className="h-[48vh] w-full rounded-lg border border-border bg-white"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-white p-6 text-center text-sm text-muted-foreground">
                    <FileText className="mb-3 h-10 w-10 text-muted-foreground/50" />
                    Select a document to preview it here.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
              No submitted documents were found for this applicant.
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={closeApplicantDocuments}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(scheduleApplicant)} onOpenChange={(open) => { if (!open) closeInterviewDialog(); }}>
        <DialogContent className="max-w-3xl bg-white overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Schedule interview</DialogTitle>
            <DialogDescription>
              Set the interview details and review what the applicant should prepare before you save.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-muted/20 px-4 py-3 text-sm">
                <p className="font-medium text-foreground">{scheduleApplicant?.fullName}</p>
                <p className="text-muted-foreground">{scheduleApplicant?.position}</p>
                {getApplicantContact(scheduleApplicant) ? (
                  <p className="mt-1 text-muted-foreground">{formatPhoneDisplay(getApplicantContact(scheduleApplicant))}</p>
                ) : (
                  <p className="mt-1 text-amber-700">No applicant phone on file — use email or in-person coordination.</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="interview-date">
                  Interview date
                </label>
                <Input
                  id="interview-date"
                  type="date"
                  value={interviewDate}
                  onChange={(event) => setInterviewDate(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="interview-time">
                  Interview time
                </label>
                <Input
                  id="interview-time"
                  type="time"
                  value={interviewTime}
                  onChange={(event) => setInterviewTime(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="interview-location">
                  Location
                </label>
                <Input
                  id="interview-location"
                  value={interviewLocation}
                  onChange={(event) => setInterviewLocation(event.target.value)}
                  placeholder={DEFAULT_INTERVIEW_LOCATION}
                />
              </div>

              {interviewDate && interviewTime ? (
                <InterviewSummaryCard
                  applicantName={scheduleApplicant?.fullName}
                  position={scheduleApplicant?.position}
                  interviewDate={interviewDate}
                  interviewTime={interviewTime}
                  location={interviewLocation.trim() || DEFAULT_INTERVIEW_LOCATION}
                  contact={getApplicantContact(scheduleApplicant) ? formatPhoneDisplay(getApplicantContact(scheduleApplicant)) : undefined}
                  contactLabel="Applicant phone"
                />
              ) : null}
            </div>

            <InterviewGuidancePanel variant="employer" />
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {scheduleApplicant && interviewDate && interviewTime ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => {
                      const message = buildInterviewInviteMessage({
                        applicantName: scheduleApplicant.fullName,
                        position: scheduleApplicant.position,
                        interviewDate,
                        interviewTime,
                        location: interviewLocation.trim() || DEFAULT_INTERVIEW_LOCATION,
                      });
                      void navigator.clipboard.writeText(message);
                      toast({ title: "Invite copied", description: "Interview message copied to clipboard." });
                    }}
                  >
                    <MessageSquare className="h-4 w-4" />
                    Copy invite
                  </Button>
                  {buildSmsLink(
                    getApplicantContact(scheduleApplicant),
                    buildInterviewInviteMessage({
                      applicantName: scheduleApplicant.fullName,
                      position: scheduleApplicant.position,
                      interviewDate,
                      interviewTime,
                      location: interviewLocation.trim() || DEFAULT_INTERVIEW_LOCATION,
                    }),
                  ) ? (
                    <Button asChild variant="secondary" className="gap-1.5">
                      <a
                        href={buildSmsLink(
                          getApplicantContact(scheduleApplicant),
                          buildInterviewInviteMessage({
                            applicantName: scheduleApplicant.fullName,
                            position: scheduleApplicant.position,
                            interviewDate,
                            interviewTime,
                            location: interviewLocation.trim() || DEFAULT_INTERVIEW_LOCATION,
                          }),
                        )}
                      >
                        <Phone className="h-4 w-4" />
                        Message applicant
                      </a>
                    </Button>
                  ) : null}
                </>
              ) : null}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={closeInterviewDialog}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={confirmInterviewSchedule}
                disabled={!interviewDate || !interviewTime || updateStatus.isPending}
                className="gap-1.5"
              >
                <CalendarClock className="h-4 w-4" />
                {updateStatus.isPending ? 'Saving...' : 'Save interview'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {pendingDecision ? (
        <ApplicationDecisionDialog
          open={Boolean(pendingDecision)}
          onOpenChange={(open) => {
            if (!open) closeDecisionDialog();
          }}
          applicantName={pendingDecision.applicant.fullName}
          applicantEmail={pendingDecision.applicant.email || 'No email on file'}
          jobTitle={pendingDecision.applicant.title || pendingDecision.applicant.position}
          employerName={pendingDecision.applicant.employerName || 'Your company'}
          decision={pendingDecision.decision}
          isSubmitting={updateStatus.isPending}
          onConfirm={confirmApplicantDecision}
        />
      ) : null}
    </div>
  );
} 
