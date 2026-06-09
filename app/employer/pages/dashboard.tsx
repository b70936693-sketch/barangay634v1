"use client";

import { format } from "date-fns";
import Link from "next/link";
import {
  useGetRecentActivity,
  useGetPostPerformance,
  useGetRecentApplicants,
  JobPostStatus,
  ApplicantStatus
} from "@workspace/api-client-react";
import { Activity, TrendingUp, Users, ArrowRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApplicantAvatar } from "@/components/applicant-avatar";

export default function Dashboard() {
  const { data: recentActivity, isLoading: isLoadingActivity } = useGetRecentActivity();
  const { data: postPerformance, isLoading: isLoadingPerformance } = useGetPostPerformance();
  const { data: recentApplicants, isLoading: isLoadingApplicants } = useGetRecentApplicants();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/30 border-yellow-500/30">Pending</Badge>;
      case "reviewing":
        return <Badge variant="secondary" className="bg-blue-500/20 text-blue-700 hover:bg-blue-500/30 border-blue-500/30">Reviewing</Badge>;
      case "for_interview":
        return <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-700 hover:bg-cyan-500/30 border-cyan-500/30">For Interview</Badge>;
      case "hired":
        return <Badge variant="secondary" className="bg-green-500/20 text-green-700 hover:bg-green-500/30 border-green-500/30">Hired</Badge>;
      case "rejected":
        return <Badge variant="secondary" className="bg-red-500/20 text-red-700 hover:bg-red-500/30 border-red-500/30">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard Overview</h2>
          <p className="text-muted-foreground">Welcome back! Here's what's happening with your job posts.</p>
        </div>
        <Button asChild>
          <Link href="/employer/create-post">Post a New Job</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest updates on your postings and applications</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingActivity ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-4 pb-4 border-b border-border last:border-0 last:pb-0">
                    <Skeleton className="h-2 w-2 mt-2 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivity?.length ? (
              <div className="space-y-4">
                {recentActivity.map((activity: any, idx: number) => (
                  <div key={activity.id} className="flex items-start gap-4 pb-4 border-b border-border last:border-0 last:pb-0">
                    <div className="h-2 w-2 mt-2 rounded-full bg-primary/40 shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">{activity.timeAgo}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">No recent activity.</div>
            )}
          </CardContent>
        </Card>

        {/* Post Performance */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Post Performance
            </CardTitle>
            <CardDescription>Applicants per active post</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingPerformance ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-6 w-8 rounded-full" />
                  </div>
                ))}
              </div>
            ) : postPerformance?.length ? (
              <div className="space-y-4">
                {postPerformance.map((perf: any) => (
                  <div key={perf.id} className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate pr-4">{perf.position}</span>
                    <Badge variant="secondary" className="shrink-0">{perf.applicantCount}</Badge>
                  </div>
                ))}
                <Button variant="ghost" className="w-full text-sm mt-2" asChild>
                  <Link href="/employer/my-job-posts">View All Posts <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">No active posts.</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Applicants */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Recent Applicants
            </CardTitle>
            <CardDescription>The latest candidates who applied to your posts</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/employer/all-applicants">View All</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="pl-6">Name</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Date Applied</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pr-6">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingApplicants ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="pl-6"><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell className="text-right pr-6"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : recentApplicants?.length ? (
                recentApplicants.map((applicant: any) => (
                  <TableRow key={applicant.id}>
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3 font-medium">
                        <ApplicantAvatar
                          name={applicant.fullName ?? applicant.name}
                          photoUrl={applicant.photoUrl}
                          size="sm"
                        />
                        <span>{applicant.fullName ?? applicant.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{applicant.position}</TableCell>
                    <TableCell>{format(new Date(applicant.appliedDate), "MMM d, yyyy")}</TableCell>
                    <TableCell>{getStatusBadge(applicant.status)}</TableCell>
                    <TableCell className="text-right pr-6">
                      <Button variant="secondary" size="sm" asChild>
                        <Link href={`/employer/all-applicants?search=${encodeURIComponent(applicant.fullName ?? applicant.name ?? "")}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No recent applicants found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

