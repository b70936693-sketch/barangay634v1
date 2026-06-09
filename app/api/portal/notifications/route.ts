import { NextResponse } from "next/server";

import { getCurrentPortalUser } from "@/lib/backend/auth";
import { readDatabase } from "@/lib/backend/store";
import {
  listNotificationsForApplicant,
  markAllApplicationNotificationsRead,
  markApplicationNotificationRead,
} from "@/lib/backend/notification-store";

function getApplicantFilters(db: Awaited<ReturnType<typeof readDatabase>>, userId: string, email: string) {
  const profile = db.applicantProfiles.find((item) => item.userId === userId);
  return {
    applicantProfileId: profile?.id,
    applicantUserId: userId,
    applicantEmail: profile?.email || email,
  };
}

export async function GET(request: Request) {
  const { portalUser } = await getCurrentPortalUser(request);
  if (!portalUser || portalUser.role !== "applicant") {
    return NextResponse.json({ error: "Applicant access required" }, { status: 403 });
  }

  const db = await readDatabase();
  const filters = getApplicantFilters(db, portalUser.id, portalUser.email);
  const notifications = await listNotificationsForApplicant(filters);
  const unreadCount = notifications.filter((item) => !item.read).length;

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(request: Request) {
  const { portalUser } = await getCurrentPortalUser(request);
  if (!portalUser || portalUser.role !== "applicant") {
    return NextResponse.json({ error: "Applicant access required" }, { status: 403 });
  }

  const body = (await request.json()) as { notificationId?: string; markAll?: boolean };
  const db = await readDatabase();
  const filters = getApplicantFilters(db, portalUser.id, portalUser.email);

  if (body.markAll) {
    const changed = await markAllApplicationNotificationsRead(filters);
    return NextResponse.json({ ok: true, changed });
  }

  if (!body.notificationId) {
    return NextResponse.json({ error: "notificationId is required" }, { status: 400 });
  }

  const updated = await markApplicationNotificationRead(body.notificationId, filters);
  if (!updated) {
    return NextResponse.json({ error: "Notification not found" }, { status: 404 });
  }

  return NextResponse.json({ notification: updated });
}
