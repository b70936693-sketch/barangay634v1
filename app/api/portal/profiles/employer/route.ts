import { NextResponse } from "next/server";

import { requirePortalRole } from "@/lib/backend/auth";
import {
  getOrCreateEmployerProfile,
  readDatabase,
  updateEmployerProfileByUserId,
  withDerivedData,
  writeDatabase,
} from "@/lib/backend/store";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function PATCH(request: Request) {
  const user = await requirePortalRole(request, "employer");
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as {
    companyName?: string;
    businessType?: string;
    location?: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    logoUrl?: string | null;
    tagline?: string;
  };

  try {
    const db = await readDatabase();
    await getOrCreateEmployerProfile(db, user.id, supabaseAdmin ?? null);

    const result = updateEmployerProfileByUserId(db, user.id, body);
    if (!result) {
      return NextResponse.json({ error: "Employer profile not found" }, { status: 404 });
    }

    await writeDatabase(db);

    return NextResponse.json({
      profile: result.profile,
      user: result.user,
      portal: withDerivedData(db, result.user ?? user),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save employer profile";
    console.error("PATCH /api/portal/profiles/employer failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
