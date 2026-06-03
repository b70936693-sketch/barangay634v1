"use client";

import { useEffect, useMemo, useState } from "react";
import { Heart, X, MapPin, Briefcase, Clock3, BadgeCheck, FileCheck2, Sparkles, Building2, Check, Filter, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useGetApplicantProfile, useGetCurrentPortalUser, useListApplicantSwipeJobs, useSubmitJobApplication } from "@workspace/api-client-react";

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  availability: string;
  shiftPreference: string;
  introduction: string;
  resumeName: string;
  validIdName: string;
  barangayClearanceName: string;
  proofOfAddressName: string;
};

type UploadedDocument = {
  id: string;
  name: string;
  path?: string;
  url?: string;
};

type FilterState = {
  postType: string | null;
  shifts: string[];
  pwdFriendly: boolean;
  seniorFriendly: boolean;
  employmentType: string | null;
  showRecommendations: boolean;
};

const initialForm: FormState = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  availability: "Can start next week",
  shiftPreference: "Morning or afternoon",
  introduction: "",
  resumeName: "",
  validIdName: "",
  barangayClearanceName: "",
  proofOfAddressName: "",
};

const SHIFT_OPTIONS = [
  { id: "morning", label: "Morning (6 AM - 2 PM)" },
  { id: "afternoon", label: "Afternoon (2 PM - 10 PM)" },
  { id: "evening", label: "Evening (10 PM - 6 AM)" },
  { id: "flexible", label: "Flexible/Part-time" },
  { id: "fulltime", label: "Full-time (Fixed)" },
];

export default function ApplicantPage() {
  const { data: jobs = [], isLoading } = useListApplicantSwipeJobs();
  const submitApplication = useSubmitJobApplication();
  const { data: profile } = useGetApplicantProfile();
  const { data: currentUser } = useGetCurrentPortalUser();
  const { toast } = useToast();

  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragOffsetX, setDragOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [submittedJob, setSubmittedJob] = useState<any>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [uploadedDocuments, setUploadedDocuments] = useState<Partial<Record<keyof Pick<FormState, "resumeName" | "validIdName" | "barangayClearanceName" | "proofOfAddressName">, UploadedDocument>>>({});
  const [filters, setFilters] = useState<FilterState>({
    postType: null,
    shifts: [],
    pwdFriendly: false,
    seniorFriendly: false,
    employmentType: null,
    showRecommendations: false,
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!profile && !currentUser) return;

    setForm((prev) => ({
      ...prev,
      fullName: prev.fullName || profile?.fullName || currentUser?.fullName || "",
      email: prev.email || currentUser?.email || "",
      phone: prev.phone || profile?.phone || currentUser?.phone || "",
      address: prev.address || profile?.address || "",
    }));
  }, [profile, currentUser]);

  // Filter jobs based on selected filters
  const filteredJobs = useMemo(() => {
    return jobs.filter((job: any) => {
      if (dismissedIds.includes(job.id)) return false;
      
      if (filters.postType && job.postType !== filters.postType) return false;
      
      if (filters.shifts.length > 0) {
        const jobShifts = job.shifts || [];
        const hasMatchingShift = filters.shifts.some((shift) => jobShifts.includes(shift));
        if (!hasMatchingShift) return false;
      }
      
      if (filters.pwdFriendly && !job.pwdFriendly) return false;
      if (filters.seniorFriendly && !job.seniorFriendly) return false;
      
      if (filters.employmentType && job.employmentType !== filters.employmentType) return false;
      
      return true;
    });
  }, [jobs, dismissedIds, filters]);

  // Calculate recommendations based on applicant profile
  const recommendedJobs = useMemo<Array<{ job: any; matchScore: number }>>(() => {
    if (!filters.showRecommendations) return [];
    
    return filteredJobs.slice(0, 3).map((job: any) => {
      let score = 0;
      
      // Check if PWD or Senior and job matches
      if (profile?.isPwd && job.pwdFriendly) score += 30;
      if (profile?.isSenior && job.seniorFriendly) score += 30;
      
      // Check shift preferences match
      if (profile?.preferredShifts && job.shifts) {
        const matchingShifts = (profile.preferredShifts as string[]).filter((shift: string) =>
          (job.shifts as string[]).includes(shift)
        );
        if (matchingShifts.length > 0) score += 20 * matchingShifts.length;
      }
      
      // Skills match (basic matching)
      if (profile?.skills && job.qualifications) {
        score += 10;
      }
      
      return { job, matchScore: score };
    });
  }, [filteredJobs, filters.showRecommendations, profile]);

  const remainingJobs = useMemo(
    () => filteredJobs.filter((job: any) => !dismissedIds.includes(job.id)),
    [filteredJobs, dismissedIds]
  );

  const currentJob = remainingJobs[0] ?? null;
  const nextJob = remainingJobs[1] ?? null;
  const savedResumeDocument = useMemo(() => {
    const resumeUrl = (profile as any)?.resumeUrl || (profile as any)?.resume;
    if (!resumeUrl) return null;
    return { id: "saved-resume", name: (profile as any)?.resumeName || "Saved Resume", path: resumeUrl, url: resumeUrl };
  }, [profile]);

  useEffect(() => {
    if (currentJob && !activeJobId) {
      setActiveJobId(currentJob.id);
    }
  }, [currentJob, activeJobId]);

  useEffect(() => {
    if (!currentJob) {
      setActiveJobId(null);
    } else if (activeJobId && currentJob.id !== activeJobId) {
      setActiveJobId(currentJob.id);
    }
  }, [currentJob, activeJobId]);

  const resetDrag = () => {
    setDragStartX(null);
    setDragOffsetX(0);
    setIsDragging(false);
  };

  const dismissCurrentJob = () => {
    if (!currentJob) return;
    setDismissedIds((prev) => [...prev, currentJob.id]);
    resetDrag();
  };

  const openApply = () => {
    if (!currentJob) return;
    setApplyOpen(true);
    resetDrag();
  };

  const handlePointerDown = (clientX: number) => {
    setDragStartX(clientX);
    setIsDragging(true);
  };

  const handlePointerMove = (clientX: number) => {
    if (!isDragging || dragStartX === null) return;
    setDragOffsetX(clientX - dragStartX);
  };

  const handlePointerUp = () => {
    if (!isDragging) return;

    if (dragOffsetX > 120) {
      openApply();
      return;
    }

    if (dragOffsetX < -120) {
      dismissCurrentJob();
      return;
    }

    resetDrag();
  };

  const uploadDocument = async (field: keyof Pick<FormState, "resumeName" | "validIdName" | "barangayClearanceName" | "proofOfAddressName">, fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      [field]: file.name,
    }));

    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", file.name);

    try {
      const response = await fetch("/api/portal/application-documents", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (!response.ok || !result?.document) {
        throw new Error(result?.error || "Unable to upload document.");
      }

      setUploadedDocuments((prev) => ({
        ...prev,
        [field]: result.document,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to upload document.";
      toast({
        title: "Upload failed",
        description: message,
        variant: "destructive",
      });

      setForm((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleApply = () => {
    if (!currentJob) return;

    const hasResume = Boolean(form.resumeName || uploadedDocuments.resumeName || savedResumeDocument);
    const hasValidId = Boolean(form.validIdName || uploadedDocuments.validIdName);

    if (!form.fullName || !form.email || !form.phone || !form.introduction) {
      toast({
        title: "Missing details",
        description: "Please complete your basic details and introduction before applying.",
        variant: "destructive",
      });
      return;
    }

    if (!hasResume || !hasValidId) {
      toast({
        title: "Missing document upload",
        description: "Please attach your resume and valid ID before submitting.",
        variant: "destructive",
      });
      return;
    }

    const documents = [savedResumeDocument, ...Object.values(uploadedDocuments)]
      .filter((document): document is NonNullable<typeof document> => Boolean(document))
      .map((document) => ({
        id: document.id,
        name: document.name,
        path: document.path,
        url: document.url,
      }));

    if (!documents.length) {
      toast({
        title: "Missing document upload",
        description: "Please upload your resume and valid ID before submitting.",
        variant: "destructive",
      });
      return;
    }

    const normalizedPhone = form.phone.replace(/\D/g, "");

    submitApplication.mutate(
      {
        jobPostId: currentJob.id,
        payload: {
          fullName: form.fullName,
          email: form.email,
          phone: normalizedPhone,
          availability: form.availability,
          shiftPreference: form.shiftPreference,
          introduction: form.introduction,
          documents,
        },
      },
      {
        onSuccess: () => {
          setSubmittedJob(currentJob);
          setSuccessOpen(true);
          setDismissedIds((prev) => [...prev, currentJob.id]);
          setApplyOpen(false);
          setForm(initialForm);
          setUploadedDocuments({});
        },
      }
    );
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_360px]">
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-[#224264]">Discover Jobs</h2>
                <p className="text-[#73869a]">
                  Swipe left to pass. Swipe right when a role feels like a match.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                {Object.values(filters).some((v) => (Array.isArray(v) ? v.length > 0 : v === true)) && (
                  <Badge variant="secondary" className="rounded-full w-5 h-5 p-0 flex items-center justify-center text-xs">
                    {Object.values(filters).filter((v) => (Array.isArray(v) ? v.length > 0 : v === true)).length}
                  </Badge>
                )}
              </Button>
            </div>
          </div>

          {showFilters && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-semibold text-blue-900 mb-3 block">Job Type</label>
                  <div className="space-y-2">
                    {[
                      { id: "establishment_job", label: "Establishment Job" },
                      { id: "resident_service", label: "Resident Service" },
                    ].map((type) => (
                      <label key={type.id} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={filters.postType === type.id}
                          onCheckedChange={(checked) => {
                            setFilters((prev) => ({
                              ...prev,
                              postType: checked ? type.id : null,
                            }));
                          }}
                        />
                        <span className="text-sm text-blue-900">{type.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="border-t border-blue-200 pt-4">
                  <label className="text-sm font-semibold text-blue-900 mb-3 block">Shifts</label>
                  <div className="space-y-2">
                    {SHIFT_OPTIONS.map((shift) => (
                      <label key={shift.id} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={filters.shifts.includes(shift.id)}
                          onCheckedChange={(checked) => {
                            setFilters((prev) => ({
                              ...prev,
                              shifts: checked
                                ? [...prev.shifts, shift.id]
                                : prev.shifts.filter((s) => s !== shift.id),
                            }));
                          }}
                        />
                        <span className="text-sm text-blue-900">{shift.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="border-t border-blue-200 pt-4 space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-blue-100">
                    <Checkbox
                      checked={filters.pwdFriendly}
                      onCheckedChange={(checked) => {
                        setFilters((prev) => ({
                          ...prev,
                          pwdFriendly: !!checked,
                        }));
                      }}
                    />
                    <span className="text-sm text-blue-900">PWD Friendly Only</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-blue-100">
                    <Checkbox
                      checked={filters.seniorFriendly}
                      onCheckedChange={(checked) => {
                        setFilters((prev) => ({
                          ...prev,
                          seniorFriendly: !!checked,
                        }));
                      }}
                    />
                    <span className="text-sm text-blue-900">Senior Friendly Only</span>
                  </label>
                </div>

                <div className="border-t border-blue-200 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setFilters({
                        postType: null,
                        shifts: [],
                        pwdFriendly: false,
                        seniorFriendly: false,
                        employmentType: null,
                        showRecommendations: false,
                      });
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {filters.showRecommendations && recommendedJobs.length > 0 && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="h-5 w-5 text-amber-600" />
                  <h3 className="font-semibold text-amber-900">Recommended for You</h3>
                </div>
                <div className="space-y-3">
                  {recommendedJobs.map(({ job, matchScore }) => (
                    <div
                      key={job.id}
                      className="p-3 bg-white rounded-lg border border-amber-200 cursor-pointer hover:border-amber-400 hover:shadow-md transition"
                      onClick={() => {
                        setDismissedIds((prev) => prev.filter((id) => id !== job.id));
                        setActiveJobId(job.id);
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-amber-900 truncate">{job.title}</div>
                          <div className="text-xs text-amber-700 truncate">{job.companyName} • {job.position}</div>
                        </div>
                        {matchScore > 50 && (
                          <Badge className="bg-amber-200 text-amber-900 text-xs whitespace-nowrap ml-2">
                            {matchScore}% match
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {isLoading ? (
            <Card className="overflow-hidden">
              <CardContent className="space-y-4 p-6">
                <Skeleton className="h-64 w-full rounded-3xl" />
                <Skeleton className="h-8 w-2/3" />
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ) : currentJob ? (
            <div className="relative mx-auto w-full min-h-[560px] max-w-2xl sm:max-w-3xl">
              {nextJob && (
                <div className="hidden rounded-[32px] border border-[#dce6ef] bg-[#f8fbfe] p-6 opacity-70 shadow-[0_12px_28px_rgba(37,91,142,0.08)] md:absolute md:inset-x-8 md:top-5 md:z-0 md:block">
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7f90a2]">Up Next</div>
                  <div className="mt-3 text-xl font-semibold text-[#36597f]">{nextJob.title}</div>
                  <div className="mt-2 flex items-center gap-3 text-sm text-[#6d8195]">
                    <span>{nextJob.companyName}</span>
                    <span>{nextJob.location}</span>
                  </div>
                </div>
              )}

              <div
                className="relative z-10 overflow-hidden rounded-[36px] border border-[#d6e1eb] bg-white shadow-[0_22px_55px_rgba(37,91,142,0.14)] transition-transform duration-200"
                style={{
                  transform: `translateX(${dragOffsetX}px) rotate(${dragOffsetX / 30}deg)`,
                }}
                onPointerDown={(event) => handlePointerDown(event.clientX)}
                onPointerMove={(event) => handlePointerMove(event.clientX)}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              >
                <div className="relative overflow-hidden bg-[linear-gradient(135deg,#2f5e8f_0%,#214b74_60%,#1d3d5c_100%)] px-7 pb-10 pt-8 text-white">
                  <div className="absolute right-5 top-5 rounded-full bg-white/12 px-3 py-1 text-xs font-semibold backdrop-blur">
                    {currentJob.urgency}
                  </div>
                  <div className="absolute bottom-0 right-0 h-40 w-40 rounded-full bg-[#ffd45d]/20 blur-3xl" />
                  <div className="flex items-center gap-2 text-sm text-white/85">
                    <Building2 className="h-4 w-4" />
                    {currentJob.companyName}
                  </div>
                  <h3 className="mt-4 max-w-xl break-words text-3xl font-bold leading-tight sm:text-4xl">{currentJob.title}</h3>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Badge className="bg-white/12 text-white border-white/15">{currentJob.position}</Badge>
                    <Badge className="bg-white/12 text-white border-white/15">{currentJob.employmentType}</Badge>
                    <Badge className="bg-[#ffd45d] text-[#3c5062] border-[#f0bf49]">{currentJob.salary}</Badge>
                  </div>
                  <div className="mt-6 grid gap-3 text-sm text-white/86 md:grid-cols-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span className="break-words">{currentJob.location}</span>
                    </div>
                    <div className="flex min-w-0 items-center gap-2">
                      <Clock3 className="h-4 w-4 shrink-0" />
                      <span className="break-words">{currentJob.schedule}</span>
                    </div>
                    <div className="flex min-w-0 items-center gap-2">
                      <Briefcase className="h-4 w-4 shrink-0" />
                      <span className="break-words">{currentJob.applicantCount} already applied</span>
                    </div>
                  </div>
                  {(currentJob.pwdFriendly || currentJob.seniorFriendly) && (
                    <div className="mt-6 flex flex-wrap gap-2">
                      {currentJob.pwdFriendly && (
                        <Badge className="bg-green-500/20 text-green-100 border-green-500/30">♿ PWD Friendly</Badge>
                      )}
                      {currentJob.seniorFriendly && (
                        <Badge className="bg-blue-500/20 text-blue-100 border-blue-500/30">👴 Senior Friendly</Badge>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-6 p-7">
                  <div className="min-w-0">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#8193a6]">Employment Details</div>
                    <p className="break-words text-[15px] leading-7 text-[#506274]">{currentJob.description}</p>
                  </div>

                  <div className="grid gap-5">
                    <InfoSection title="Employer is looking for" icon={Sparkles} items={currentJob.employerRequirements ?? []} tone="blue" />
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <InfoSection
                      title="Qualifications"
                      icon={FileCheck2}
                      items={(currentJob.qualifications ?? "").split(",").map((item: string) => item.trim()).filter(Boolean)}
                      tone="neutral"
                    />
                    <InfoSection title="Benefits" icon={Heart} items={currentJob.benefits ?? []} tone="neutral" />
                  </div>

                  {currentJob.accessibilityFeatures && currentJob.accessibilityFeatures.length > 0 && (
                    <div className="border-t pt-4">
                      <InfoSection
                        title="Accessibility Features Available"
                        icon={BadgeCheck}
                        items={currentJob.accessibilityFeatures}
                        tone="neutral"
                      />
                    </div>
                  )}
                </div>

                {dragOffsetX > 50 && (
                  <div className="pointer-events-none absolute left-6 top-6 rotate-[-12deg] rounded-2xl border-2 border-[#53b97a] px-4 py-2 text-lg font-bold uppercase tracking-[0.25em] text-[#53b97a]">
                    Apply
                  </div>
                )}
                {dragOffsetX < -50 && (
                  <div className="pointer-events-none absolute right-6 top-6 rotate-[12deg] rounded-2xl border-2 border-[#ea7a6b] px-4 py-2 text-lg font-bold uppercase tracking-[0.25em] text-[#ea7a6b]">
                    Pass
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                <Heart className="mb-4 h-12 w-12 text-[#2f6fa4]/40" />
                <h3 className="text-xl font-semibold text-[#27425f]">No more cards right now</h3>
                <p className="mt-2 max-w-md text-[#75889c]">
                  You have reviewed every active job in the queue. Check your submitted applications or come back when employers post more openings.
                </p>
              </CardContent>
            </Card>
          )}

          <div className="flex items-center justify-center gap-4">
            <Button type="button" variant="outline" size="icon" className="h-14 w-14 rounded-full" onClick={dismissCurrentJob} disabled={!currentJob}>
              <X className="h-5 w-5" />
            </Button>
            <Button type="button" size="lg" className="rounded-full px-8" onClick={openApply} disabled={!currentJob}>
              <Check className="h-4 w-4" />
              Apply
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-4 p-5">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.1em] text-[#7d8fa1]">How it works</div>
              </div>
              <div className="space-y-3 text-sm text-[#627689]">
                <p>1. Review one opportunity card at a time.</p>
                <p>2. Swipe left if the role is not for you.</p>
                <p>3. Swipe right or tap apply to open the full application form.</p>
                <p>4. Submit employer details and supporting documents in one place.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.1em] text-[#7d8fa1]">Before you apply</div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Updated Resume</Badge>
                <Badge variant="secondary">Valid ID</Badge>
                <Badge variant="secondary">Barangay Clearance</Badge>
                <Badge variant="outline">Proof of Address</Badge>
              </div>
              <p className="text-sm text-[#627689]">
                Employers want role-specific details and identity/residency proof for safer community hiring.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={filters.showRecommendations}
                  onCheckedChange={(checked) => {
                    setFilters((prev) => ({
                      ...prev,
                      showRecommendations: !!checked,
                    }));
                  }}
                />
                <span className="text-sm font-medium text-[#506274]">Show Recommended Jobs</span>
              </label>
              <p className="text-xs text-[#7d8fa1]">
                See jobs that match your profile, including PWD-friendly and senior-friendly positions.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl bg-white">
            <DialogHeader>
            <DialogTitle>Complete your application</DialogTitle>
            <DialogDescription>
              Submit the employer information and supporting documents in a single flow.
            </DialogDescription>
          </DialogHeader>

          {currentJob && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-[#d9e5ef] bg-[#f7fafd] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[#7d8fa1]">Applying for</div>
                <div className="mt-2 text-xl font-semibold text-[#2a557f]">{currentJob.title}</div>
                <div className="mt-2 flex flex-wrap gap-2 text-sm text-[#66798d]">
                  <span>{currentJob.companyName}</span>
                  <span>{currentJob.location}</span>
                  <span>{currentJob.schedule}</span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Full Name" required>
                  <Input value={form.fullName} onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))} />
                </Field>
                <Field label="Email Address" required>
                  <Input type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
                </Field>
                <Field label="Phone Number" required>
                  <Input
                    inputMode="numeric"
                    value={form.phone}
                    onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value.replace(/\D/g, "").slice(0, 11) }))}
                  />
                </Field>
                <Field label="Current Address" required>
                  <Input value={form.address} onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))} />
                </Field>
                <Field label="Availability" required>
                  <Input value={form.availability} onChange={(e) => setForm((prev) => ({ ...prev, availability: e.target.value }))} />
                </Field>
                <Field label="Preferred Shift">
                  <Input value={form.shiftPreference} onChange={(e) => setForm((prev) => ({ ...prev, shiftPreference: e.target.value }))} />
                </Field>
              </div>

              <Field label="Why are you a good fit for this role?" required>
                <Textarea
                  className="min-h-[120px]"
                  value={form.introduction}
                  onChange={(e) => setForm((prev) => ({ ...prev, introduction: e.target.value }))}
                  placeholder="Share your experience, customer service strengths, and why this role fits your schedule."
                />
              </Field>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4 md:col-span-2">
                  <UploadGroup
                    title="Application documents"
                    description="Upload required documents to complete your application."
                    accent="blue"
                    items={[
                      { label: "Upload Resume *", value: form.resumeName, onChange: (files) => uploadDocument("resumeName", files) },
                      { label: "Upload Barangay Clearance", value: form.barangayClearanceName, onChange: (files) => uploadDocument("barangayClearanceName", files) },
                      { label: "Upload Valid ID *", value: form.validIdName, onChange: (files) => uploadDocument("validIdName", files) },
                      { label: "Upload Proof of Address", value: form.proofOfAddressName, onChange: (files) => uploadDocument("proofOfAddressName", files) },
                    ]}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setApplyOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleApply} disabled={submitApplication.isPending}>
                  {submitApplication.isPending ? "Submitting..." : "Submit Application"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
<DialogContent className="sm:max-w-md bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-50 border border-emerald-200/50 ring-1 ring-emerald-200/30 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-green-600">Application Submitted Successfully! 🎉</DialogTitle>
            <DialogDescription className="text-center">
              Your application for <strong>{submittedJob?.position}</strong> at <strong>{submittedJob?.companyName}</strong> has been sent.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 py-4">
            <div className="rounded-full bg-green-100 p-3">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-center text-sm text-gray-600">
              The employer will review your application and may contact you for an interview. Check your applications page to track the status.
            </p>
          </div>
          <div className="flex justify-center">
            <Button onClick={() => setSuccessOpen(false)} className="w-full">
              Continue Browsing Jobs
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoSection({
  title,
  items,
  icon: Icon,
  tone,
}: {
  title: string;
  items: string[];
  icon: React.ComponentType<{ className?: string }>;
  tone: "blue" | "gold" | "neutral";
}) {
  const toneClass =
    tone === "blue"
      ? "border-[#d9e8f4] bg-[#f2f8fd]"
      : tone === "gold"
        ? "border-[#f5df9a] bg-[#fff8dd]"
        : "border-[#e2e9f0] bg-[#f8fafc]";

  return (
    <div className={`min-w-0 rounded-2xl border p-4 ${toneClass}`}>
      <div className="flex items-center gap-2 text-sm font-semibold text-[#31597f]">
        <Icon className="h-4 w-4" />
        {title}
      </div>
      <div className="mt-3 space-y-2 text-sm text-[#55687b]">
        {items.map((item) => (
          <div key={item} className="break-words rounded-xl bg-white/70 px-3 py-2">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children, required = false }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-[#36587d]">{label}{required ? <span className="text-red-500"> *</span> : null}</span>
      {children}
    </label>
  );
}

function UploadGroup({
  title,
  description,
  accent,
  items,
}: {
  title: string;
  description: string;
  accent: "blue" | "gold";
  items: Array<{
    label: string;
    value: string;
    onChange: (files: FileList | null) => void;
  }>;
}) {
  const classes = accent === "blue" ? "border-[#d9e8f4] bg-[#f2f8fd]" : "border-[#f5df9a] bg-[#fff8dd]";

  return (
    <div className={`rounded-2xl border p-4 ${classes}`}>
      <div className="text-sm font-semibold text-[#31597f]">{title}</div>
      <p className="mt-1 text-sm text-[#6c7f92]">{description}</p>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((item) => (
          <label key={item.label} className="rounded-xl border border-white/80 bg-white/90 p-3">
            <span className="mb-2 block text-sm font-medium text-[#35587d]">{item.label}</span>
            <Input type="file" onChange={(e) => item.onChange(e.target.files)} />
            {item.value && <div className="mt-2 text-xs font-medium text-[#678196]">{item.value}</div>}
          </label>
        ))}
      </div>
    </div>
  );
}
