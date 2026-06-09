import { NextResponse } from "next/server";

import { getCurrentPortalUser } from "@/lib/backend/auth";
import { readDatabase, withDerivedData } from "@/lib/backend/store";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const { portalUser } = await getCurrentPortalUser(request);
  const portalData = await readDatabase();

  const derived = withDerivedData(portalData, portalUser);

  // Temporary debug to confirm where applications disappear.
  const latestApplication = [...portalData.applications]
    .sort((a, b) => +new Date(b.appliedDate) - +new Date(a.appliedDate))[0];

  return NextResponse.json({
    ...derived,
    currentUser: portalUser,
    debug: {
      applicationsCount: portalData.applications.length,
      applicantApplicationsCount: (derived as any).applicantApplications?.length ?? 0,
      latestApplication: latestApplication
        ? {
            id: latestApplication.id,
            applicantId: latestApplication.applicantId,
            email: latestApplication.email,
            jobPostId: latestApplication.jobPostId,
            status: latestApplication.status,
          }
        : null,
      applicantProfile: (derived as any).applicantProfile
        ? {
            id: (derived as any).applicantProfile.id,
            email: (derived as any).applicantProfile.email,
            userId: (derived as any).applicantProfile.userId,
          }
        : null,
    },
  });
}


export async function POST(request: Request) {
  const { portalUser } = await getCurrentPortalUser(request);
  if (!portalUser || portalUser.role !== "admin") {
    return NextResponse.json({ error: "Admin required" }, { status: 403 });
  }

  const payload = await request.json();

  if (payload?.reset === true) {
    if (supabaseAdmin) {
      await supabaseAdmin.from("services").delete().neq("id", "");
      await supabaseAdmin.from("audit_logs").delete().neq("id", "");
      await supabaseAdmin.from("alerts").delete().neq("id", "");
      await supabaseAdmin.from("reports").delete().neq("id", "");
      await supabaseAdmin.from("verifications").delete().neq("id", "");
      await supabaseAdmin.from("interviews").delete().neq("id", "");
      await supabaseAdmin.from("applications").delete().neq("id", "");
      await supabaseAdmin.from("job_posts").delete().neq("id", "");
      await supabaseAdmin.from("applicant_profiles").delete().neq("id", "");
      await supabaseAdmin.from("employer_profiles").delete().neq("id", "");
      await supabaseAdmin.from("users").delete().neq("id", "");

      return NextResponse.json({ success: true });
    }

    const db = await readDatabase();
    const { writeDatabase } = await import("@/lib/backend/store");
    await writeDatabase(db);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ ok: false }, { status: 400 });
}
