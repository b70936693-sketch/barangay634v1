import { NextRequest, NextResponse } from "next/server";
// import type { ApplicantRow } from "@/app/admin/applicants/page";
import { readDatabase, updateVerification, writeDatabase } from "@/lib/backend/store";
import { requirePortalRole } from "@/lib/backend/auth";

export async function PUT(request: NextRequest) {
  const authUser = await requirePortalRole(request, "admin");
  if (!authUser) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { applicantId, action } = body;

    if (action !== "verify") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const db = await readDatabase();
    // Find verification for applicant - create if not exists
    let verification = db.verifications.find(v => v.type === "Applicant Verification" && v.subjectName === db.users.find(u => u.id === applicantId)?.fullName);

    if (!verification) {
      // Create pending verification
      verification = {
        id: crypto.randomUUID(),
        type: "Applicant Verification",
        subjectName: db.users.find(u => u.id === applicantId)?.fullName || "Unknown",
        status: "pending",
        submittedAt: new Date().toISOString(),
        documents: [],
      };
      db.verifications.unshift(verification);
    }

    const result = await updateVerification(db, verification.id, "approved");
    if (!result) {
      return NextResponse.json({ error: "Verification not found" }, { status: 404 });
    }

    await writeDatabase(db);

    return NextResponse.json({ success: true, verification: result });
  } catch (error: any) {
    console.error("Verify applicant error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

