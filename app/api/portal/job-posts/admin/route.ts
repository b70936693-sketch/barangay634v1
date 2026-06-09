import { NextResponse } from "next/server";
import { requirePortalRole } from "@/lib/backend/auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { readDatabase, writeDatabase, updateJobPostStatusWithNotes, updateJobPostStatus } from "@/lib/backend/store";

async function updateJobPostRow(
  adminClient: NonNullable<typeof supabaseAdmin>,
  jobId: string,
  payload: Record<string, unknown>,
) {
  const adminAny = adminClient as any;
  let currentPayload = { ...payload };

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const { data, error } = await adminAny
      .from("job_posts")
      .update(currentPayload)
      .eq("id", jobId)
      .select()
      .single();

    if (!error) {
      return { data, error: null };
    }

    if (error.code === "PGRST204") {
      const match = String(error.message ?? "").match(/'([^']+)' column/);
      const missingColumn = match?.[1];
      if (missingColumn && missingColumn in currentPayload) {
        const { [missingColumn]: _removed, ...rest } = currentPayload;
        currentPayload = rest;
        continue;
      }
    }

    return { data: null, error };
  }

  return {
    data: null,
    error: { message: "Failed to update job post after removing unsupported columns." },
  };
}

export async function PATCH(request: Request) {
  const user = await requirePortalRole(request, "admin");
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { jobId, status, rejectionNotes } = await request.json();

  const normalizedStatus = String(status ?? "").toLowerCase();
  const trimmedNotes = typeof rejectionNotes === "string" ? rejectionNotes.trim() : undefined;

  // Admin actions mapping:
  // - active  => make live / visible to applicants
  // - rejected => hide/block from applicants (flagged as rejected)
  // - closed (or anything else) => not visible to applicants
  const updateStatus =
    normalizedStatus === "active"
      ? "active"
      : normalizedStatus === "rejected" || normalizedStatus === "fake"
        ? "rejected"
        : "closed";

  // Persist rejection notes when provided.
  // NOTE: Prisma schema currently does not include a dedicated rejection notes field on JobPost.
  // If your Supabase schema has a compatible column, this will store into it.
  // Common candidates: `rejection_notes`, `rejectionNotes`, `rejection_notes_text`.
  const updatePayload: Record<string, any> = { status: updateStatus };
  if (trimmedNotes) updatePayload.rejection_notes = trimmedNotes;

  try {
    if (updateStatus === "active") {
      updatePayload.published_at = new Date().toISOString();
    } else {
      updatePayload.published_at = null;
    }

    // If Supabase is configured, update there first. Use a non-null cast because
    // we've already ensured the caller is an admin and this path is valid.
    if (supabaseAdmin) {
      const { data, error } = await updateJobPostRow(supabaseAdmin, jobId, updatePayload);

      if (error) throw error;
      if (!data) {
        return NextResponse.json({ error: "Job post not found or already processed" }, { status: 404 });
      }

      // Sync to local JSON store if present so development fallback remains consistent.
      try {
        const db = await readDatabase();
        if (trimmedNotes) {
          updateJobPostStatusWithNotes(db, jobId, updateStatus as any, trimmedNotes);
        } else {
          updateJobPostStatus(db, jobId, updateStatus as any);
        }
        await writeDatabase(db, true);
      } catch (syncErr: any) {
        console.warn("Admin job post JSON sync warning:", syncErr?.message ?? syncErr);
      }

      return NextResponse.json(data);
    }

    // Fallback: update local JSON store when Supabase is not configured
    const db = await readDatabase();
    const updated = trimmedNotes
      ? updateJobPostStatusWithNotes(db, jobId, updateStatus as any, trimmedNotes)
      : updateJobPostStatus(db, jobId, updateStatus as any);

    if (!updated) {
      return NextResponse.json({ error: "Job post not found or already processed" }, { status: 404 });
    }

    await writeDatabase(db, true);
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Admin job post update error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
