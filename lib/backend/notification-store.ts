import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export type ApplicationNotificationRecord = {
  id: string;
  applicationId: string;
  applicantProfileId: string;
  applicantUserId?: string;
  applicantEmail: string;
  type: "hired" | "rejected";
  title: string;
  message: string;
  jobTitle: string;
  employerName: string;
  emailSent: boolean;
  emailError?: string;
  read: boolean;
  createdAt: string;
};

const dataDir = path.join(process.cwd(), "data");
const notificationsPath = path.join(dataDir, "application-notifications.json");

async function ensureNotificationsFile() {
  await mkdir(dataDir, { recursive: true });
  try {
    await readFile(notificationsPath, "utf8");
  } catch {
    await writeFile(notificationsPath, "[]", "utf8");
  }
}

export async function readApplicationNotifications(): Promise<ApplicationNotificationRecord[]> {
  await ensureNotificationsFile();
  const raw = await readFile(notificationsPath, "utf8");
  const parsed = JSON.parse(raw) as ApplicationNotificationRecord[];
  return Array.isArray(parsed) ? parsed : [];
}

async function writeApplicationNotifications(records: ApplicationNotificationRecord[]) {
  await ensureNotificationsFile();
  await writeFile(notificationsPath, JSON.stringify(records, null, 2), "utf8");
}

export function buildDecisionNotification(
  input: {
    applicationId: string;
    applicantProfileId: string;
    applicantUserId?: string;
    applicantEmail: string;
    applicantName: string;
    jobTitle: string;
    employerName: string;
    decision: "hired" | "rejected";
    emailSent: boolean;
    emailError?: string;
  },
): ApplicationNotificationRecord {
  const isHired = input.decision === "hired";

  return {
    id: randomUUID(),
    applicationId: input.applicationId,
    applicantProfileId: input.applicantProfileId,
    applicantUserId: input.applicantUserId,
    applicantEmail: input.applicantEmail,
    type: input.decision,
    title: isHired ? "You are hired!" : "Application not selected",
    message: isHired
      ? `${input.employerName} selected you for ${input.jobTitle}. Check your portal for next steps.`
      : `${input.employerName} has decided not to move forward with your application for ${input.jobTitle}. Keep exploring new roles on Barangay 634.`,
    jobTitle: input.jobTitle,
    employerName: input.employerName,
    emailSent: input.emailSent,
    emailError: input.emailError,
    read: false,
    createdAt: new Date().toISOString(),
  };
}

export async function createApplicationNotification(
  notification: ApplicationNotificationRecord,
): Promise<ApplicationNotificationRecord> {
  const records = await readApplicationNotifications();
  records.unshift(notification);
  await writeApplicationNotifications(records);
  return notification;
}

export async function listNotificationsForApplicant(filters: {
  applicantProfileId?: string;
  applicantUserId?: string;
  applicantEmail?: string;
}) {
  const records = await readApplicationNotifications();
  const email = filters.applicantEmail?.toLowerCase();

  return records.filter((item) => {
    if (filters.applicantProfileId && item.applicantProfileId === filters.applicantProfileId) return true;
    if (filters.applicantUserId && item.applicantUserId === filters.applicantUserId) return true;
    if (email && item.applicantEmail.toLowerCase() === email) return true;
    return false;
  });
}

export async function markApplicationNotificationRead(notificationId: string, filters: {
  applicantProfileId?: string;
  applicantUserId?: string;
  applicantEmail?: string;
}) {
  const records = await readApplicationNotifications();
  const email = filters.applicantEmail?.toLowerCase();
  const index = records.findIndex((item) => {
    if (item.id !== notificationId) return false;
    if (filters.applicantProfileId && item.applicantProfileId === filters.applicantProfileId) return true;
    if (filters.applicantUserId && item.applicantUserId === filters.applicantUserId) return true;
    if (email && item.applicantEmail.toLowerCase() === email) return true;
    return false;
  });

  if (index === -1) return null;

  records[index] = { ...records[index], read: true };
  await writeApplicationNotifications(records);
  return records[index];
}

export async function markAllApplicationNotificationsRead(filters: {
  applicantProfileId?: string;
  applicantUserId?: string;
  applicantEmail?: string;
}) {
  const records = await readApplicationNotifications();
  const email = filters.applicantEmail?.toLowerCase();

  let changed = 0;
  const next = records.map((item) => {
    const matches =
      (filters.applicantProfileId && item.applicantProfileId === filters.applicantProfileId) ||
      (filters.applicantUserId && item.applicantUserId === filters.applicantUserId) ||
      (email && item.applicantEmail.toLowerCase() === email);

    if (matches && !item.read) {
      changed += 1;
      return { ...item, read: true };
    }
    return item;
  });

  if (changed > 0) {
    await writeApplicationNotifications(next);
  }

  return changed;
}
