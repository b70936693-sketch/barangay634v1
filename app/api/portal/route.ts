import { NextResponse } from "next/server";

import { getCurrentPortalUser } from "@/lib/backend/auth";
import { readDatabase, withDerivedData } from "@/lib/backend/store";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const { portalUser } = await getCurrentPortalUser(request);
  const portalData = await readDatabase();

  return NextResponse.json({
    ...withDerivedData(portalData, portalUser),
    currentUser: portalUser,
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
