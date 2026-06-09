import { NextResponse } from "next/server";

import { getCurrentPortalUser, requirePortalRole } from "@/lib/backend/auth";
import { getApplicantPhotoUrl, resolveApplicantProfileForApplication } from "@/lib/applicant-profile-meta";
import { getEmployerProfile, readDatabase } from "@/lib/backend/store";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requirePortalRole(request, "employer");
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { portalUser } = await getCurrentPortalUser(request);
  if (!portalUser || portalUser.role !== "employer") {
    return NextResponse.json({ error: "Employer profile not found" }, { status: 404 });
  }

  const { id: jobPostId } = await params;
  if (!jobPostId) {
    return NextResponse.json({ error: "Job post id is required" }, { status: 400 });
  }

  const db = await readDatabase();
  const employerProfile = getEmployerProfile(db, portalUser.id, portalUser.email);
  if (!employerProfile) {
    return NextResponse.json({ error: "Employer profile not found" }, { status: 404 });
  }

  const jobPost = db.jobPosts.find((post) => post.id === jobPostId);
  const ownsJobPost =
    jobPost &&
    (jobPost.employerId === employerProfile.id || jobPost.employerId === portalUser.id);

  if (!jobPost || !ownsJobPost) {
    return NextResponse.json({ error: "Job post not found or unauthorized" }, { status: 403 });
  }

  const applications = db.applications
    .filter((application) => application.jobPostId === jobPostId)
    .sort((a, b) => +new Date(b.appliedDate) - +new Date(a.appliedDate))
    .map((application) => {
      const applicantProfile = resolveApplicantProfileForApplication(db.applicantProfiles, application);
      return {
        ...application,
        photoUrl: getApplicantPhotoUrl(applicantProfile?.headline),
        jobTitle: jobPost.title,
        employerName: employerProfile.companyName,
      };
    });

  return NextResponse.json({ applications });
}
