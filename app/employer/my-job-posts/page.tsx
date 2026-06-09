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
      <div className="space-y-6 pb-8">
        <div className="space-y-3">
          <div className="h-8 w-64 rounded-xl bg-gradient-to-r from-[#f0f5f9] to-[#e2ecf5] animate-pulse" />
          <div className="h-5 w-80 rounded-lg bg-gradient-to-r from-[#f0f5f9] to-[#e2ecf5] animate-pulse" />
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 md:pb-0">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="min-w-[22rem] flex-shrink-0 overflow-hidden">
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
    <div className="space-y-6 pb-8">
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
              <div className="flex gap-4 overflow-x-auto pb-2 md:pb-0">
                {grouped.active.map((post: any) => (
                  <div key={post.id} className="min-w-[22rem] flex-shrink-0">
                    <JobPostCard post={post} type="active" openModal={openModal} />
                  </div>
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
              <div className="flex gap-4 overflow-x-auto pb-2 md:pb-0">
                {grouped.pending.map((post: any) => (
                  <div key={post.id} className="min-w-[22rem] flex-shrink-0">
                    <JobPostCard post={post} type="pending" openModal={openModal} />
                  </div>
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
              <div className="flex gap-4 overflow-x-auto pb-2 md:pb-0">
                {grouped.closed.map((post: any) => (
                  <div key={post.id} className="min-w-[22rem] flex-shrink-0">
                    <JobPostCard post={post} type="closed" openModal={openModal} />
                  </div>
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

  return (
    <Card className="overflow-hidden hover:shadow-[0_20px_40px_rgba(37,91,142,0.12)] transition-all hover:-translate-y-1">
      <CardHeader className={`p-6 text-white ${type === 'active' ? 'bg-gradient-to-r from-[#2f5e8f] to-[#214b74]' : type === 'pending' ? 'bg-gradient-to-r from-[#f59e0b]/20 to-[#d97706]/20 border-t-4 border-yellow-500' : 'bg-gradient-to-r from-[#ea7a6b]/20 to-[#dc2626]/20 border-t-4 border-red-500'}`}>
        <div className="flex items-start justify-between">
          <div>
            <h4 className="text-xl font-bold">{post.title}</h4>
            <p className="mt-1 text-white/90">{post.position}</p>
          </div>
          <Badge variant={status.color as any} className="text-sm font-semibold uppercase tracking-wide border-white/30 bg-white/10">
            {status.label}
          </Badge>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-wide">
          <div className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-1 backdrop-blur-sm">
            <Users className="h-3 w-3" />
            {applicantCount} {applicantCount === 1 ? "applicant" : "applicants"}
          </div>
          <div className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-1 backdrop-blur-sm">
            <Calendar className="h-3 w-3" />
            Posted {postedDate}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2 text-[#506274]">
            <MapPin className="h-4 w-4 text-[#6d8195]" />
            {post.location || 'Barangay 634'}
          </div>
          <div className="flex items-center gap-2 text-[#506274]">
            <Clock className="h-4 w-4 text-[#6d8195]" />
            {post.schedule || 'Flexible'}
          </div>
        </div>

        <div className="text-sm text-[#506274] line-clamp-3 leading-relaxed">{post.description}</div>

        <div className="flex gap-2 pt-2">
          <Link href={`/employer/edit-post/${post.id}`} className="flex-1">
            <Button variant="outline" className="w-full justify-center gap-2 text-xs h-9">
              <Edit3 className="h-3.5 w-3.5" />
              Edit Post
            </Button>
          </Link>
          <Button 
            className="w-full justify-center gap-2 text-xs h-9 flex-1 bg-primary hover:bg-primary/90"
            onClick={() => openModal({ id: post.id, title: post.title })}
          >
            <Eye className="h-3.5 w-3.5" />
            {applicantCount} {applicantCount === 1 ? "Applicant" : "Applicants"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

