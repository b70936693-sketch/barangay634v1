import { NextResponse } from "next/server";

import { requirePortalRole } from "@/lib/backend/auth";
import { readDatabase, updateInterview, withDerivedData, writeDatabase } from "@/lib/backend/store";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requirePortalRole(request, "employer");
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const db = await readDatabase();
  const employerProfile = db.employerProfiles.find((profile) => profile.userId === user.id);

  if (!employerProfile) {
    return NextResponse.json({ error: "Employer profile not found" }, { status: 404 });
  }

  const interviewRecord = db.interviews.find((interview) => interview.id === id);
  if (!interviewRecord) {
    return NextResponse.json({ error: "Interview not found" }, { status: 404 });
  }

  const application = db.applications.find((item) => item.id === interviewRecord.applicationId);
  const jobPost = application ? db.jobPosts.find((post) => post.id === application.jobPostId) : null;

  const ownsJobPost =
    jobPost &&
    (jobPost.employerId === employerProfile.id || jobPost.employerId === user.id);
  if (!application || !jobPost || !ownsJobPost) {
    return NextResponse.json({ error: "Unauthorized: not your interview" }, { status: 403 });
  }

  const interview = updateInterview(db, id, body);

  if (!interview) {
    return NextResponse.json({ error: "Interview not found" }, { status: 404 });
  }

  try {
    await writeDatabase(db);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save interview schedule";
    console.error("Interview reschedule failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ interview, portal: withDerivedData(db) });
}
