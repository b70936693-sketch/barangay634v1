"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Building, Clock, LayoutDashboard, PlusCircle, Settings, Users } from "lucide-react";
import { useGetDashboardSummary } from "@workspace/api-client-react";

// Default dashboard redirect/page
export default function EmployerPage() {
  const { data: summary = {} } = useGetDashboardSummary();
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employer Dashboard</h1>
          <p className="text-muted-foreground mt-2">Manage your job posts, applicants, and company profile.</p>
        </div>
        <Button asChild size="lg">
          <Link href="/employer/create-post">
            <PlusCircle className="mr-2 h-4 w-4" />
            Post a New Job
          </Link>
        </Button>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-4 pr-2 sm:pr-0">
        <Link href="/employer/my-job-posts" className="group min-w-[18rem] flex-shrink-0">
          <Card className="h-32 p-6 group-hover:shadow-md transition-all border-2 border-border hover:border-primary flex flex-col justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold text-primary">{summary.activePosts ?? 0}</CardTitle>
              <CardDescription>Active Job Posts</CardDescription>
            </CardHeader>
            <Briefcase className="self-end h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
          </Card>
        </Link>

        <Link href="/employer/all-applicants" className="group min-w-[18rem] flex-shrink-0">
          <Card className="h-32 p-6 group-hover:shadow-md transition-all border-2 border-border hover:border-primary flex flex-col justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold text-primary">{summary.totalApplicants ?? 0}</CardTitle>
              <CardDescription>Total Applicants</CardDescription>
            </CardHeader>
            <Users className="self-end h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
          </Card>
        </Link>

        <Link href="/employer/pending-review" className="group min-w-[18rem] flex-shrink-0">
          <Card className="h-32 p-6 group-hover:shadow-md transition-all border-2 border-border hover:border-primary flex flex-col justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold text-primary">{summary.pendingReview ?? 0}</CardTitle>
              <CardDescription>Pending Review</CardDescription>
            </CardHeader>
            <Clock className="self-end h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
          </Card>
        </Link>

        <Link href="/employer/company-profile" className="group min-w-[18rem] flex-shrink-0">
          <Card className="h-32 p-6 group-hover:shadow-md transition-all border-2 border-border hover:border-primary flex flex-col justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold">Profile</CardTitle>
              <CardDescription>Company Settings</CardDescription>
            </CardHeader>
            <Building className="self-end h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Start managing your hiring process</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-0">
          <Button asChild variant="outline" className="justify-start h-16">
            <Link href="/employer/my-job-posts">
              <LayoutDashboard className="mr-3 h-5 w-5" />
              View Job Posts
            </Link>
          </Button>
          <Button asChild variant="outline" className="justify-start h-16">
            <Link href="/employer/create-post">
              <PlusCircle className="mr-3 h-5 w-5" />
              Create Job Post
            </Link>
          </Button>
          <Button asChild variant="outline" className="justify-start h-16 md:col-span-2 lg:col-span-1">
            <Link href="/employer/settings">
              <Settings className="mr-3 h-5 w-5" />
              Account Settings
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}



