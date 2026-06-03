import { NextResponse } from "next/server";

import { requirePortalRole } from "@/lib/backend/auth";
import { readDatabase, sendVerificationInvite, updateAlert, updateJobPostStatus, updateJobPostStatusWithNotes, updateReport, updateService, updateVerification, withDerivedData, writeDatabase } from "@/lib/backend/store";


export async function GET(request: Request) {
  const user = await requirePortalRole(request, "admin");
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = await readDatabase();
  return NextResponse.json({
    ...withDerivedData(db, user),
    currentUser: user,
  });
}

export async function PATCH(request: Request) {
  const user = await requirePortalRole(request, "admin");
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const db = await readDatabase();

  let result = null;

  if (body.type === "verification") {
    result = await updateVerification(db, body.id, body.status);

    // If admin approves, also mark the invite as sent (creates invite token if needed).
    if (result && body.status === "approved") {
      // Ensure inviteToken/inviteSentAt are persisted.
      await sendVerificationInvite(db, body.id);
    }
  }


  if (body.type === "verification_invite") {
    result = sendVerificationInvite(db, body.id);
  }

  if (body.type === "report") {
    result = updateReport(db, body.id, body.status);
  }

  if (body.type === "alert") {
    result = updateAlert(db, body.id, body.status);
  }

  if (body.type === "service") {
    result = updateService(db, body.id, body.status);
  }

  if (body.type === "job_post") {
    const hasNotes = typeof body.rejectionNotes === "string";

    if ((body.status === "closed" || body.status === "rejected") && hasNotes) {
      result = updateJobPostStatusWithNotes(db, body.id, body.status, body.rejectionNotes);
    } else {
      result = updateJobPostStatus(db, body.id, body.status);
    }
  }


  if (!result) {
    return NextResponse.json({ error: "Record not found" }, { status: 404 });
  }

  await writeDatabase(db);
  return NextResponse.json({ result, portal: withDerivedData(db, user) });
}
