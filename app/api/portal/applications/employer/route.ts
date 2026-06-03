import { NextResponse } from "next/server";
import { requirePortalRole } from "@/lib/backend/auth";
import { getCurrentPortalUser } from "@/lib/backend/auth";
import { readDatabase } from "@/lib/backend/store";

export async function GET(request: Request) {
  const user = await requirePortalRole(request, "employer");
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { portalUser } = await getCurrentPortalUser(request);
  if (!portalUser || !portalUser.role || portalUser.role !== 'employer') {
    return NextResponse.json({ error: "Employer profile not found" }, { status: 404 });
  }

  const db: any = await readDatabase();
  const employerProfile =
    db.employerProfiles.find((p: any) => p.userId === portalUser.id) ??
    db.employerProfiles.find((p: any) => p.id === portalUser.id) ??
    null;

  if (!employerProfile) {
    return NextResponse.json({ error: "Employer profile not found" }, { status: 404 });
  }

  const employerJobPostIds = db.jobPosts
    .filter((p: any) => p.employerId === employerProfile.id)
    .map((p: any) => p.id);
  const apps = db.applications.filter((app: any) => employerJobPostIds.includes(app.jobPostId)).map((app: any) => ({
    ...app,
    employerName: employerProfile?.companyName || "Employer",
    title: db.jobPosts.find((p: any) => p.id === app.jobPostId)?.title || app.position,
    location: employerProfile?.location || "Barangay 634",
  }));

  return NextResponse.json({ applications: apps });
}

