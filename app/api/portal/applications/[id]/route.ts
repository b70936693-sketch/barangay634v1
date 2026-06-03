import { NextResponse, NextRequest } from "next/server";
import { requirePortalRole } from "@/lib/backend/auth";
import { readDatabase, writeDatabase, setApplicationStatus } from "@/lib/backend/store";
import type { ApplicationRecord } from "@/lib/backend/types";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requirePortalRole(request, "employer");
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { status, interviewDate, interviewTime, location } = body;

  if (!status || !["reviewing", "for_interview", "rejected", "hired"].includes(status)) {
    return NextResponse.json({ error: "Valid status required" }, { status: 400 });
  }

  const db = await readDatabase();
  const employerProfile = db.employerProfiles.find(p => p.userId === user.id);

  if (!employerProfile) {
    return NextResponse.json({ error: "Employer profile not found" }, { status: 404 });
  }

  const application = db.applications.find(app => app.id === id);
  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  const jobPost = db.jobPosts.find(post => post.id === application.jobPostId);
  if (!jobPost || jobPost.employerId !== employerProfile.id) {
    return NextResponse.json({ error: "Unauthorized: not your application" }, { status: 403 });
  }

  const updatedApp = setApplicationStatus(db, id, status as ApplicationRecord["status"], {
    interviewDate,
    interviewTime,
    location,
  });
  if (!updatedApp) {
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }

  await writeDatabase(db);

  return NextResponse.json({ application: updatedApp });
}
