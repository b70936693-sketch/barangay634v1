"use client";

import { AdminPanel, ActionButton, EmptyState, StatusBadge } from "../_components";
import { useAdminJobPostAction, useAdminPortal } from "../api-client-react";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabaseClient } from "@/lib/supabase-client";
import { EmployerAvatar } from "@/components/employer-avatar";
import {
  Briefcase,
  Building2,
  Calendar,
  Clock3,
  MapPin,
  ShieldAlert,
  Users,
} from "lucide-react";

type JobPostRecord = {
  id: string;
  title: string;
  position: string;
  companyName?: string;
  employerLogoUrl?: string | null;
  location?: string;
  status: string;
  applicantCount?: number;
  employerVerified?: boolean;
  createdAt?: string;
  publishedAt?: string | null;
  postType?: string;
  employmentType?: string;
  schedule?: string;
  salary?: string;
  urgency?: string;
  description?: string;
  qualifications?: string;
  requirements?: string;
  benefits?: string[];
  employerRequirements?: string[];
  adminRequirements?: string[];
  rejectionNotes?: string;
  pwdFriendly?: boolean;
  seniorFriendly?: boolean;
  accessibilityFeatures?: string[];
  postingStartDate?: string | null;
  postingEndDate?: string | null;
  shifts?: string[];
};

const INAPPROPRIATE_REASONS = [
  "Misleading job details",
  "Discriminatory content",
  "Scam or fraud suspected",
  "Violates community guidelines",
  "Other",
] as const;

function needsAdminReview(post: JobPostRecord) {
  return post.status === "pending" || (post.status === "active" && !post.publishedAt);
}

function isPublishedLive(post: JobPostRecord) {
  return post.status === "active" && Boolean(post.publishedAt);
}

const REVIEW_CHECKLIST_ITEMS = [
  { key: "documentsReady", label: "Required documents submitted" },
  { key: "salaryClear", label: "Salary and compensation are clear" },
  { key: "scheduleClear", label: "Schedule and shifts are defined" },
  { key: "accessibilityIncluded", label: "Accessibility details included" },
] as const;

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function renderList(value: unknown) {
  if (!value) return null;
  if (Array.isArray(value) && value.length > 0) {
    return (
      <ul className="mt-2 space-y-1.5">
        {value.map((item, index) => (
          <li key={index} className="flex gap-2 text-sm text-[#506274]">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2f6fa4]" />
            <span>{String(item)}</span>
          </li>
        ))}
      </ul>
    );
  }
  if (typeof value === "string" && value.trim()) {
    const lines = value.includes("\n") ? value.split("\n") : value.split(",").map((s) => s.trim());
    return (
      <ul className="mt-2 space-y-1.5">
        {lines.filter(Boolean).map((line, index) => (
          <li key={index} className="flex gap-2 text-sm text-[#506274]">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2f6fa4]" />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    );
  }
  return null;
}

function OverviewField({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="rounded-2xl border border-[#e5edf5] bg-[#f8fbff] p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7b8ca0]">{label}</div>
      <div className="mt-2 text-sm font-medium text-[#203142] break-words">{value || "Not provided"}</div>
    </div>
  );
}

function JobOverviewDialog({
  post,
  open,
  onClose,
  onApprove,
  onSendBack,
  onFlagInappropriate,
  onClosePost,
  isPending,
}: {
  post: JobPostRecord | null;
  open: boolean;
  onClose: () => void;
  onApprove: () => void;
  onSendBack: () => void;
  onFlagInappropriate: () => void;
  onClosePost: () => void;
  isPending: boolean;
}) {
  if (!post) return null;

  const isPendingReview = needsAdminReview(post);
  const isLive = isPublishedLive(post);
  const isRemoved = post.status === "rejected" || post.status === "closed";

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col gap-0 overflow-hidden border-0 bg-white p-0 shadow-2xl sm:rounded-2xl top-[50%] translate-y-[-50%]">
        <div className="relative shrink-0 overflow-hidden bg-[linear-gradient(135deg,#2f5e8f_0%,#214b74_60%,#1d3d5c_100%)] px-6 pb-6 pt-6 text-white">
          <div className="absolute bottom-0 right-0 h-36 w-36 rounded-full bg-[#ffd45d]/15 blur-3xl" />
          <DialogHeader className="space-y-3 text-left">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge value={post.status} />
              {post.employerVerified ? (
                <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-semibold text-emerald-100">
                  Verified employer
                </span>
              ) : (
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
                  Unverified employer
                </span>
              )}
              {post.urgency ? (
                <span className="rounded-full bg-[#ffd45d] px-3 py-1 text-xs font-semibold text-[#3c5062]">
                  {post.urgency}
                </span>
              ) : null}
            </div>
            <div className="flex items-start gap-4">
              <EmployerAvatar name={post.companyName} logoUrl={post.employerLogoUrl} size="lg" className="border-white/30 bg-white/10 text-white" />
              <div>
                <DialogTitle className="text-2xl font-bold leading-tight text-white sm:text-3xl">
                  {post.title}
                </DialogTitle>
                <DialogDescription className="mt-1 text-sm text-white/80">
                  {post.companyName} • {post.position}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="mt-5 flex flex-wrap gap-2">
            {post.employmentType ? (
              <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-medium">{post.employmentType}</span>
            ) : null}
            {post.salary ? (
              <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-medium">{post.salary}</span>
            ) : null}
            {post.postType ? (
              <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-medium">
                {post.postType.replace(/_/g, " ")}
              </span>
            ) : null}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-2 text-sm text-white/85">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="break-words">{post.location || "Barangay 634"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-white/85">
              <Clock3 className="h-4 w-4 shrink-0" />
              <span className="break-words">{post.schedule || "Schedule not set"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-white/85">
              <Users className="h-4 w-4 shrink-0" />
              <span>{post.applicantCount ?? 0} applicants</span>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          {isPendingReview ? (
            <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              This post is awaiting admin approval and is hidden from applicants until you approve it.
            </div>
          ) : null}

          {post.rejectionNotes ? (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
              <div className="text-sm font-semibold text-red-800">Admin notes</div>
              <p className="mt-1 text-sm leading-6 text-red-700">{post.rejectionNotes}</p>
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <OverviewField label="Created" value={formatDateTime(post.createdAt)} />
            <OverviewField label="Published" value={formatDateTime(post.publishedAt)} />
            <OverviewField label="Posting start" value={formatDate(post.postingStartDate)} />
            <OverviewField label="Posting end" value={formatDate(post.postingEndDate)} />
          </div>

          {(post.pwdFriendly || post.seniorFriendly || (post.accessibilityFeatures?.length ?? 0) > 0) && (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="text-sm font-semibold text-emerald-900">R.A. compliance & accessibility</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {post.pwdFriendly ? (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                    PWD friendly
                  </span>
                ) : null}
                {post.seniorFriendly ? (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                    Senior friendly
                  </span>
                ) : null}
              </div>
              {renderList(post.accessibilityFeatures)}
            </div>
          )}

          {post.shifts && post.shifts.length > 0 ? (
            <div className="mt-5 rounded-2xl border border-[#e5edf5] bg-white p-4">
              <div className="text-sm font-semibold text-[#203142]">Available shifts</div>
              {renderList(post.shifts)}
            </div>
          ) : null}

          {post.description ? (
            <div className="mt-5 rounded-2xl border border-[#e5edf5] bg-white p-4">
              <div className="text-sm font-semibold text-[#203142]">Job description</div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#506274]">{post.description}</p>
            </div>
          ) : null}

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {post.qualifications ? (
              <div className="rounded-2xl border border-[#e5edf5] bg-white p-4">
                <div className="text-sm font-semibold text-[#203142]">Qualifications</div>
                {renderList(post.qualifications) ?? (
                  <p className="mt-2 text-sm text-[#506274]">{post.qualifications}</p>
                )}
              </div>
            ) : null}
            {post.requirements ? (
              <div className="rounded-2xl border border-[#e5edf5] bg-white p-4">
                <div className="text-sm font-semibold text-[#203142]">Requirements</div>
                {renderList(post.requirements) ?? (
                  <p className="mt-2 text-sm text-[#506274]">{post.requirements}</p>
                )}
              </div>
            ) : null}
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {post.benefits && post.benefits.length > 0 ? (
              <div className="rounded-2xl border border-[#e5edf5] bg-white p-4">
                <div className="text-sm font-semibold text-[#203142]">Benefits</div>
                {renderList(post.benefits)}
              </div>
            ) : null}
            {post.employerRequirements && post.employerRequirements.length > 0 ? (
              <div className="rounded-2xl border border-[#e5edf5] bg-white p-4">
                <div className="text-sm font-semibold text-[#203142]">Employer requirements</div>
                {renderList(post.employerRequirements)}
              </div>
            ) : null}
          </div>

          {post.adminRequirements && post.adminRequirements.length > 0 ? (
            <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <div className="text-sm font-semibold text-blue-900">Admin requirements checklist</div>
              <p className="mt-1 text-xs text-blue-700">Verify these before approving the listing.</p>
              {renderList(post.adminRequirements)}
            </div>
          ) : null}
        </div>

        <DialogFooter className="shrink-0 border-t border-[#e5edf5] bg-[#fbfdff] px-6 py-4 sm:flex-row sm:justify-end">
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            <ActionButton label="Close" variant="secondary" onClickAction={() => onClose()} />
            {isPendingReview ? (
              <>
                <ActionButton
                  label={isPending ? "Saving..." : "Reject"}
                  variant="secondary"
                  disabled={isPending}
                  onClickAction={() => onSendBack()}
                />
                <ActionButton
                  label={isPending ? "Saving..." : "Approve & publish"}
                  variant="primary"
                  disabled={isPending}
                  onClickAction={() => onApprove()}
                />
              </>
            ) : null}
            {isLive ? (
              <>
                <ActionButton
                  label="Close listing"
                  variant="secondary"
                  disabled={isPending}
                  onClickAction={() => onClosePost()}
                />
                <ActionButton
                  label="Flag as inappropriate"
                  variant="primary"
                  disabled={isPending}
                  onClickAction={() => onFlagInappropriate()}
                />
              </>
            ) : null}
            {isRemoved ? (
              <span className="self-center text-xs text-[#7b8ca0]">
                This listing is no longer visible to applicants.
              </span>
            ) : null}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function JobPostRow({
  post,
  isSaving,
  onOpen,
  onApprove,
  onReject,
  onFlag,
}: {
  post: JobPostRecord;
  isSaving: boolean;
  onOpen: (post: JobPostRecord) => void;
  onApprove: (post: JobPostRecord) => void;
  onReject: (post: JobPostRecord) => void;
  onFlag: (post: JobPostRecord) => void;
}) {
  const awaitingReview = needsAdminReview(post);
  const isLive = isPublishedLive(post);

  return (
    <div
      data-post-id={post.id}
      onClick={() => onOpen(post)}
      className={`group flex cursor-pointer flex-col gap-4 rounded-2xl border p-4 transition hover:shadow-sm lg:flex-row lg:items-center lg:justify-between ${
        awaitingReview
          ? "border-amber-200 bg-amber-50/40 hover:border-amber-300"
          : "border-[#dfe8f0] bg-[#fbfdff] hover:border-[#b9d0e8]"
      }`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <EmployerAvatar name={post.companyName} logoUrl={post.employerLogoUrl} size="sm" />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-[#29425e]">{post.title}</div>
          </div>
        </div>
        <div className="mt-1 text-xs text-[#7b8ca0]">
          {post.companyName} • {post.position}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#7b8ca0]">
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(post.createdAt)}
          </span>
          {post.salary ? <span>{post.salary}</span> : null}
          {awaitingReview ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-800">
              Awaiting approval
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="inline-flex items-center gap-1.5 text-sm font-medium text-[#29425e]">
          <Briefcase className="h-4 w-4 text-[#7b8ca0]" />
          {post.applicantCount ?? 0}
        </div>
        <StatusBadge value={awaitingReview ? "pending" : post.status} />
        {awaitingReview ? (
          <>
            <ActionButton
              label={isSaving ? "Saving..." : "Approve"}
              variant="primary"
              disabled={isSaving}
              onClickAction={(e) => {
                e.stopPropagation();
                onApprove(post);
              }}
            />
            <ActionButton
              label="Reject"
              disabled={isSaving}
              onClickAction={(e) => {
                e.stopPropagation();
                onReject(post);
              }}
            />
          </>
        ) : isLive ? (
          <ActionButton
            label="Flag"
            onClickAction={(e) => {
              e.stopPropagation();
              onFlag(post);
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

export default function JobPostsPage() {
  const { data } = useAdminPortal();
  const mutate = useAdminJobPostAction();
  const queryClient = useQueryClient();

  const [overviewPost, setOverviewPost] = useState<JobPostRecord | null>(null);
  const [dismissPost, setDismissPost] = useState<JobPostRecord | null>(null);
  const [inappropriatePost, setInappropriatePost] = useState<JobPostRecord | null>(null);

  const [dismissReason, setDismissReason] = useState("");
  const [inappropriateReason, setInappropriateReason] = useState("");
  const [inappropriateCategory, setInappropriateCategory] = useState<string>(INAPPROPRIATE_REASONS[0]);
  const [reviewChecklist, setReviewChecklist] = useState({
    documentsReady: true,
    salaryClear: true,
    scheduleClear: true,
    accessibilityIncluded: true,
  });

  const runJobAction = (
    jobId: string,
    status: string,
    rejectionNotes?: string,
    onDone?: () => void
  ) => {
    mutate.mutate(
      {
        jobId,
        status,
        ...(rejectionNotes ? { rejectionNotes } : {}),
      },
      {
        onSuccess: () => onDone?.(),
      }
    );
  };

  const handleApprove = (jobId: string, onDone?: () => void) => {
    runJobAction(jobId, "active", undefined, onDone);
  };

  const openDismissModal = (post: JobPostRecord) => {
    setOverviewPost(null);
    setDismissPost(post);
    setDismissReason("");
  };

  const openInappropriateModal = (post: JobPostRecord) => {
    setOverviewPost(null);
    setInappropriatePost(post);
    setInappropriateReason("");
    setInappropriateCategory(INAPPROPRIATE_REASONS[0]);
  };

  const confirmDismiss = () => {
    if (!dismissPost?.id) return;
    const notes = dismissReason.trim();
    if (!notes) return;

    runJobAction(
      dismissPost.id,
      "rejected",
      `Under Review: ${notes}`,
      () => {
        setDismissReason("");
        setDismissPost(null);
      }
    );
  };

  const confirmInappropriate = () => {
    if (!inappropriatePost?.id) return;
    const details = inappropriateReason.trim();
    if (!details) return;

    const notes = `Inappropriate: ${inappropriateCategory} — ${details}`;
    runJobAction(inappropriatePost.id, "rejected", notes, () => {
      setInappropriateReason("");
      setInappropriatePost(null);
    });
  };

  useEffect(() => {
    let channel: ReturnType<typeof supabaseClient.channel> | null = null;

    try {
      channel = supabaseClient
        .channel("admin-job-posts-realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "job_posts" },
          () => {
            void queryClient.invalidateQueries({ queryKey: ["admin-portal"] });
            void queryClient.invalidateQueries({ queryKey: ["portal"] });
          }
        )
        .subscribe();
    } catch (e) {
      console.error("Realtime subscription failed:", e);
    }

    return () => {
      if (channel) supabaseClient.removeChannel(channel);
    };
  }, [queryClient]);

  const jobPosts = (data?.jobPosts ?? []) as JobPostRecord[];
  const pendingPosts = jobPosts.filter((post) => needsAdminReview(post));
  const livePosts = jobPosts.filter((post) => isPublishedLive(post));
  const removedPosts = jobPosts.filter((post) => post.status === "rejected" || post.status === "closed");
  const pendingCount = pendingPosts.length;
  const dismissedCount = removedPosts.length;
  const activeCount = livePosts.length;

  return (
    <AdminPanel
      title="Job Post Oversight"
      description="Review employer-submitted listings, approve legitimate posts, and remove inappropriate content."
    >
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-[#dfe8f0] bg-[#f7fbff] p-4">
          <div className="text-xs uppercase tracking-wide text-[#7b8ca0]">Pending review</div>
          <div className="mt-2 text-2xl font-bold text-[#203142]">{pendingCount}</div>
        </div>
        <div className="rounded-2xl border border-[#dfe8f0] bg-[#fffaf4] p-4">
          <div className="text-xs uppercase tracking-wide text-[#7b8ca0]">Removed posts</div>
          <div className="mt-2 text-2xl font-bold text-[#203142]">{dismissedCount}</div>
        </div>
        <div className="rounded-2xl border border-[#dfe8f0] bg-[#effaf4] p-4">
          <div className="text-xs uppercase tracking-wide text-[#7b8ca0]">Live posts</div>
          <div className="mt-2 text-2xl font-bold text-[#203142]">{activeCount}</div>
        </div>
      </div>

      <div className="mt-6 space-y-8">
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-[#203142]">Pending approval</h3>
              <p className="text-sm text-[#7b8ca0]">
                Employer-submitted posts stay hidden from applicants until you approve them.
              </p>
            </div>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
              {pendingCount} waiting
            </span>
          </div>
          {pendingPosts.length ? (
            pendingPosts.map((post) => (
              <JobPostRow
                key={post.id}
                post={post}
                isSaving={mutate.isPending}
                onOpen={setOverviewPost}
                onApprove={(item) => handleApprove(item.id)}
                onReject={openDismissModal}
                onFlag={openInappropriateModal}
              />
            ))
          ) : (
            <EmptyState
              title="No posts awaiting review"
              copy="New employer job posts will appear here for approval or rejection."
            />
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-[#203142]">Live posts</h3>
              <p className="text-sm text-[#7b8ca0]">Approved listings currently visible to applicants.</p>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
              {activeCount} live
            </span>
          </div>
          {livePosts.length ? (
            livePosts.map((post) => (
              <JobPostRow
                key={post.id}
                post={post}
                isSaving={mutate.isPending}
                onOpen={setOverviewPost}
                onApprove={(item) => handleApprove(item.id)}
                onReject={openDismissModal}
                onFlag={openInappropriateModal}
              />
            ))
          ) : (
            <EmptyState title="No live posts" copy="Approved job posts will appear here once published." />
          )}
        </section>

        {removedPosts.length > 0 ? (
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-[#203142]">Removed posts</h3>
                <p className="text-sm text-[#7b8ca0]">Rejected or closed listings no longer visible to applicants.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {dismissedCount} removed
              </span>
            </div>
            {removedPosts.map((post) => (
              <JobPostRow
                key={post.id}
                post={post}
                isSaving={mutate.isPending}
                onOpen={setOverviewPost}
                onApprove={(item) => handleApprove(item.id)}
                onReject={openDismissModal}
                onFlag={openInappropriateModal}
              />
            ))}
          </section>
        ) : null}
      </div>

      <JobOverviewDialog
        post={overviewPost}
        open={Boolean(overviewPost)}
        onClose={() => setOverviewPost(null)}
        isPending={mutate.isPending}
        onApprove={() => {
          if (!overviewPost?.id) return;
          handleApprove(overviewPost.id, () => setOverviewPost(null));
        }}
        onSendBack={() => {
          if (!overviewPost) return;
          openDismissModal(overviewPost);
        }}
        onFlagInappropriate={() => {
          if (!overviewPost) return;
          openInappropriateModal(overviewPost);
        }}
        onClosePost={() => {
          if (!overviewPost?.id) return;
          runJobAction(overviewPost.id, "closed", undefined, () => setOverviewPost(null));
        }}
      />

      <Dialog
        open={Boolean(dismissPost)}
        onOpenChange={(open) => {
          if (!open) {
            setDismissPost(null);
            setDismissReason("");
          }
        }}
      >
        <DialogContent className="flex max-h-[90vh] max-w-xl flex-col gap-4 overflow-hidden bg-white">
          <DialogHeader className="shrink-0">
            <DialogTitle>Reject job post</DialogTitle>
            <DialogDescription>
              Reject this listing and return it to the employer with feedback. It will stay hidden from applicants.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
          {dismissPost ? (
            <div className="rounded-2xl border border-[#e5edf5] bg-[#f8fbff] px-4 py-3 text-sm">
              <div className="font-semibold text-[#203142]">{dismissPost.title}</div>
              <div className="mt-1 text-[#7b8ca0]">
                {dismissPost.companyName} • {dismissPost.position}
              </div>
            </div>
          ) : null}

          <div className="space-y-4">
            <div className="rounded-2xl border border-[#dfe8f0] bg-[#f7fbff] p-3">
              <div className="text-sm font-semibold text-[#29425e]">Review checklist</div>
              <div className="mt-2 grid gap-2">
                {REVIEW_CHECKLIST_ITEMS.map(({ key, label }) => (
                  <label
                    key={key}
                    className="flex items-center gap-2 rounded-xl border border-[#e5edf5] bg-white px-3 py-2 text-sm text-[#506274]"
                  >
                    <input
                      type="checkbox"
                      checked={reviewChecklist[key]}
                      onChange={() =>
                        setReviewChecklist((prev) => ({
                          ...prev,
                          [key]: !prev[key],
                        }))
                      }
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold text-[#29425e]">Feedback for employer</div>
              <textarea
                value={dismissReason}
                onChange={(e) => setDismissReason(e.target.value)}
                placeholder="Example: Missing required documents, unclear salary, or accessibility details need updates."
                className="mt-2 w-full min-h-[110px] rounded-2xl border border-[#dfe8f0] bg-white p-3 text-sm outline-none focus:border-[#2f6fa4]"
              />
            </div>
          </div>
          </div>

          <DialogFooter className="shrink-0 gap-2 border-t border-[#e5edf5] pt-4">
            <ActionButton
              label="Cancel"
              variant="secondary"
              onClickAction={() => {
                setDismissPost(null);
                setDismissReason("");
              }}
            />
            <ActionButton
              label={mutate.isPending ? "Saving..." : "Reject post"}
              variant="primary"
              disabled={!dismissReason.trim() || mutate.isPending}
              onClickAction={() => confirmDismiss()}
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(inappropriatePost)}
        onOpenChange={(open) => {
          if (!open) {
            setInappropriatePost(null);
            setInappropriateReason("");
          }
        }}
      >
        <DialogContent className="flex max-h-[90vh] max-w-xl flex-col gap-4 overflow-hidden bg-white">
          <DialogHeader className="shrink-0">
            <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-red-100 text-red-600">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <DialogTitle>Flag inappropriate listing</DialogTitle>
            <DialogDescription>
              Remove this post from applicant view and record why it violates posting guidelines.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
          {inappropriatePost ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm">
              <div className="font-semibold text-red-900">{inappropriatePost.title}</div>
              <div className="mt-1 text-red-700">
                {inappropriatePost.companyName} • {inappropriatePost.position}
              </div>
            </div>
          ) : null}

          <div className="space-y-4">
            <div>
              <div className="text-sm font-semibold text-[#29425e]">Reason category</div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {INAPPROPRIATE_REASONS.map((reason) => (
                  <label
                    key={reason}
                    className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition ${
                      inappropriateCategory === reason
                        ? "border-red-300 bg-red-50 text-red-900"
                        : "border-[#e5edf5] bg-white text-[#506274] hover:border-[#d5e3f0]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="inappropriate-reason"
                      checked={inappropriateCategory === reason}
                      onChange={() => setInappropriateCategory(reason)}
                      className="accent-red-600"
                    />
                    <span>{reason}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold text-[#29425e]">Details (required)</div>
              <textarea
                value={inappropriateReason}
                onChange={(e) => setInappropriateReason(e.target.value)}
                placeholder="Describe what makes this post inappropriate so it can be documented in the audit log."
                className="mt-2 w-full min-h-[110px] rounded-2xl border border-[#dfe8f0] bg-white p-3 text-sm outline-none focus:border-red-400"
              />
            </div>
          </div>
          </div>

          <DialogFooter className="shrink-0 gap-2 border-t border-[#e5edf5] pt-4">
            <ActionButton
              label="Cancel"
              variant="secondary"
              onClickAction={() => {
                setInappropriatePost(null);
                setInappropriateReason("");
              }}
            />
            <ActionButton
              label={mutate.isPending ? "Removing..." : "Remove listing"}
              variant="primary"
              disabled={!inappropriateReason.trim() || mutate.isPending}
              onClickAction={() => confirmInappropriate()}
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPanel>
  );
}
