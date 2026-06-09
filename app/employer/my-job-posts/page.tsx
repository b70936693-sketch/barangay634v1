"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { format } from "date-fns";

import { Edit3, Eye, Clock, Briefcase, Calendar, PlusCircle, Users, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useListJobPosts, JobPostStatus } from "../api-client-react";
import ApplicantModal from "./components/ApplicantModal";




const statusConfig = {
  [JobPostStatus.active]: { label: "Active", color: "default" },
  [JobPostStatus.pending]: { label: "Pending Review", color: "secondary" },
  [JobPostStatus.closed]: { label: "Closed", color: "destructive" },
} as const;

export default function MyJobPostsPage() {
  const { data: { jobPosts = [] } = {}, isLoading } = useListJobPosts();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJobPost, setSelectedJobPost] = useState<{ id: string; title: string } | null>(null);

  const grouped = useMemo(() => {
    const groups = {
      active: [] as any[],
      pending: [] as any[],
      closed: [] as any[],
    };

    jobPosts.forEach((post: any) => {
      if (post.status === JobPostStatus.active) {
        groups.active.push(post);
      } else if (post.status === JobPostStatus.pending) {
        groups.pending.push(post);
      } else {
        groups.closed.push(post);
      }
    });

    return groups;
  }, [jobPosts]);

  const openModal = (post: { id: string; title: string }) => {
    setSelectedJobPost(post);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-w-0 max-w-full space-y-6 overflow-x-hidden pb-8">
        <div className="space-y-3">
          <div className="h-8 w-64 rounded-xl bg-gradient-to-r from-[#f0f5f9] to-[#e2ecf5] animate-pulse" />
          <div className="h-5 w-80 rounded-lg bg-gradient-to-r from-[#f0f5f9] to-[#e2ecf5] animate-pulse" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="w-full min-w-0 overflow-hidden">
              <CardHeader className="p-6 pb-4 bg-gradient-to-r from-[#2f5e8f]/20 to-[#214b74]/20">
                <div className="h-6 w-48 rounded-xl bg-gradient-to-r from-[#f0f5f9] to-[#e2ecf5] animate-pulse" />
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-5 w-3/4 rounded-lg bg-gradient-to-r from-[#f0f5f9] to-[#e2ecf5] animate-pulse" />
                  <div className="h-4 w-2/3 rounded-lg bg-gradient-to-r from-[#f0f5f9] to-[#e2ecf5] animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0 max-w-full space-y-6 overflow-x-hidden pb-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#224264]">My Job Posts</h2>
        <p className="text-[#73869a]">
          Manage your active postings, track applicant volume, and control post status.
        </p>
      </div>

      {jobPosts.length === 0 ? (
        <Card className="border-dashed border-[#d6e1eb]">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <Briefcase className="mb-6 h-16 w-16 text-[#2f6fa4]/40" />
            <h3 className="text-xl font-semibold text-[#27425f] mb-2">No job posts yet</h3>
            <p className="max-w-md text-[#75889c] mb-6">
              Create your first job post to start receiving local applicant submissions through Barangay 634.
            </p>
            <Link 
              href="/employer/create-post" 
              className="inline-flex items-center gap-2 rounded-full bg-[#2f6fa4] px-6 py-3 font-semibold text-white shadow-lg hover:bg-[#255b89] transition-colors"
            >
              <PlusCircle className="h-4 w-4" />
              Create First Job Post
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {grouped.active.length > 0 && (
            <div>
              <div className="mb-6 flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-[#53b97a]"></div>
                <h3 className="text-lg font-semibold text-[#2f5e8f]">Active Posts ({grouped.active.length})</h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {grouped.active.map((post: any) => (
                  <JobPostCard key={post.id} post={post} type="active" openModal={openModal} />
                ))}
              </div>
            </div>
          )}

          {grouped.pending.length > 0 && (
            <div>
              <div className="mb-6 flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-[#f59e0b]"></div>
                <h3 className="text-lg font-semibold text-[#2f5e8f]">Pending Review ({grouped.pending.length})</h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {grouped.pending.map((post: any) => (
                  <JobPostCard key={post.id} post={post} type="pending" openModal={openModal} />
                ))}
              </div>
            </div>
          )}

          {grouped.closed.length > 0 && (
            <div>
              <div className="mb-6 flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-[#ea7a6b]"></div>
                <h3 className="text-lg font-semibold text-[#2f5e8f]">Closed Posts ({grouped.closed.length})</h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {grouped.closed.map((post: any) => (
                  <JobPostCard key={post.id} post={post} type="closed" openModal={openModal} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
      <ApplicantModal
        jobPostId={selectedJobPost?.id ?? ""}
        jobTitle={selectedJobPost?.title}
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedJobPost(null);
        }}
      />
    </div>
  );
}

interface JobPostCardProps {
  post: any;
  type: "active" | "pending" | "closed";
  openModal: (post: { id: string; title: string }) => void;
}

function getApplicantCount(post: { applicantCount?: number; applicant_count?: number }) {
  return post.applicantCount ?? post.applicant_count ?? 0;
}

function getPostedDateLabel(post: { publishedAt?: string | null; postedAt?: string | null; createdAt?: string; created_at?: string }) {
  const raw = post.publishedAt ?? post.postedAt ?? post.createdAt ?? post.created_at;
  if (!raw) return "Date unavailable";

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return format(date, "MMM d, yyyy");
}

function JobPostCard({ post, type, openModal }: JobPostCardProps) {
  const status =
    statusConfig[post.status as keyof typeof statusConfig] ??
    { label: "Unknown", color: "secondary" };
  const applicantCount = getApplicantCount(post);
  const postedDate = getPostedDateLabel(post);
  const isActive = type === "active";

  const headerClass =
    type === "active"
      ? "bg-gradient-to-r from-[#2f5e8f] to-[#214b74] text-white"
      : type === "pending"
        ? "border-t-4 border-amber-400 bg-gradient-to-r from-amber-50 to-orange-50 text-[#27425f]"
        : "border-t-4 border-rose-400 bg-gradient-to-r from-rose-50 to-orange-50 text-[#27425f]";

  const chipClass = isActive
    ? "bg-white/20 text-white"
    : "bg-white/80 text-[#506274]";

  return (
    <Card className="flex h-full w-full min-w-0 max-w-full flex-col overflow-hidden transition-shadow hover:shadow-[0_16px_32px_rgba(37,91,142,0.1)]">
      <CardHeader className={`space-y-3 p-4 sm:p-5 ${headerClass}`}>
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h4 className="text-base font-bold leading-snug break-words sm:text-lg">{post.title}</h4>
            <p className={`mt-1 text-sm break-words ${isActive ? "text-white/90" : "text-[#6d8195]"}`}>
              {post.position}
            </p>
          </div>
          <Badge
            variant={status.color as any}
            className={`shrink-0 text-[10px] font-semibold uppercase tracking-wide ${
              isActive ? "border-white/30 bg-white/10 text-white" : ""
            }`}
          >
            {status.label}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] font-medium uppercase tracking-wide sm:text-xs">
          <div className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ${chipClass}`}>
            <Users className="h-3 w-3 shrink-0" />
            <span className="whitespace-nowrap">
              {applicantCount} {applicantCount === 1 ? "applicant" : "applicants"}
            </span>
          </div>
          <div className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ${chipClass}`}>
            <Calendar className="h-3 w-3 shrink-0" />
            <span className="whitespace-nowrap">Posted {postedDate}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <div className="flex min-w-0 items-start gap-2 text-[#506274]">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#6d8195]" />
            <span className="break-words">{post.location || "Barangay 634"}</span>
          </div>
          <div className="flex min-w-0 items-start gap-2 text-[#506274]">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#6d8195]" />
            <span className="break-words">{post.schedule || "Flexible"}</span>
          </div>
        </div>

        <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-justify text-[#506274] break-words">
          {post.description || "No description provided."}
        </p>

        <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2">
          <Link href={`/employer/edit-post/${post.id}`} className="min-w-0">
            <Button variant="outline" className="h-9 w-full justify-center gap-2 text-xs">
              <Edit3 className="h-3.5 w-3.5 shrink-0" />
              Edit Post
            </Button>
          </Link>
          <Button
            className="h-9 w-full min-w-0 justify-center gap-2 bg-primary text-xs hover:bg-primary/90"
            onClick={() => openModal({ id: post.id, title: post.title })}
          >
            <Eye className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {applicantCount} {applicantCount === 1 ? "Applicant" : "Applicants"}
            </span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

