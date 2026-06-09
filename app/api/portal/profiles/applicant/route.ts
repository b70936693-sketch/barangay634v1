import { NextResponse } from "next/server";

import { requirePortalRole } from "@/lib/backend/auth";
import { readDatabase, updateApplicantProfileByUserId, withDerivedData, writeDatabase } from "@/lib/backend/store";

export async function PATCH(request: Request) {
  const user = await requirePortalRole(request, "applicant");
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();

  try {
    const db = await readDatabase();
    const profile = updateApplicantProfileByUserId(db, user.id, body);

    if (!profile) {
      return NextResponse.json({ error: "Applicant profile not found" }, { status: 404 });
    }

    await writeDatabase(db);
    return NextResponse.json({ profile, portal: withDerivedData(db, user) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save applicant profile";
    console.error("PATCH /api/portal/profiles/applicant failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
