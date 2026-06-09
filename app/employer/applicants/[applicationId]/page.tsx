import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, Mail, Phone } from "lucide-react";

import { readDatabase, withDerivedData } from "@/lib/backend/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ApplicantDocumentsPreview } from "@/app/employer/applicants/components/ApplicantDocumentsPreview";
import { ApplicantAvatar } from "@/components/applicant-avatar";

function getStatusBadge(status: string) {
  switch (status) {
    case "pending":
      return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700 border-yellow-500/30">Pending</Badge>;
    case "reviewing":
      return <Badge variant="secondary" className="bg-blue-500/20 text-blue-700 border-blue-500/30">Reviewing</Badge>;
    case "for_interview":
      return <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-700 border-cyan-500/30">For Interview</Badge>;
    case "hired":
      return <Badge variant="secondary" className="bg-green-500/20 text-green-700 border-green-500/30">Hired</Badge>;
    case "rejected":
      return <Badge variant="secondary" className="bg-red-500/20 text-red-700 border-red-500/30">Rejected</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default async function EmployerApplicantDetailsPage({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = await params;
  const db = await readDatabase();
  const data = withDerivedData(db);
  const applicant = data.applications.find((application) => application.id === applicationId);

  if (!applicant) {
    return notFound();
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Applicant details</h2>
          <p className="text-muted-foreground">Review the selected candidate and confirm their final status.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/employer/all-applicants" className="inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to applicants
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-start gap-4">
              <ApplicantAvatar name={applicant.fullName} photoUrl={(applicant as { photoUrl?: string | null }).photoUrl} size="xl" />
              <div className="space-y-2">
                <p className="text-sm font-semibold text-muted-foreground">Applicant</p>
                <h3 className="text-2xl font-semibold">{applicant.fullName}</h3>
                {getStatusBadge(applicant.status)}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Position Applied</p>
                <p className="mt-1 font-semibold">{applicant.position}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Applied Date</p>
                <p className="mt-1 font-semibold">{format(new Date(applicant.appliedDate), "MMM d, yyyy")}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Contact</p>
                <p className="mt-1 font-semibold flex items-center gap-2"><Phone className="h-4 w-4" />{applicant.contact}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="mt-1 font-semibold flex items-center gap-2"><Mail className="h-4 w-4" />{applicant.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Application details</CardTitle>
            <CardDescription>Data comes from the portal database and reflects the candidate&apos;s submitted documents.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Introduction</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{applicant.introduction}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-card p-4">
                  <p className="text-sm text-muted-foreground">Availability</p>
                  <p className="mt-2 font-semibold">{applicant.availability}</p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-4">
                  <p className="text-sm text-muted-foreground">Shift Preference</p>
                  <p className="mt-2 font-semibold">{applicant.shiftPreference}</p>
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-sm text-muted-foreground">Documents submitted</p>
                <p className="mt-1 text-xs text-muted-foreground">Click a file to preview it on the right.</p>
                <div className="mt-4">
                  <ApplicantDocumentsPreview documents={applicant.documents ?? []} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
