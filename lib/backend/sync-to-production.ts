/**
 * Sync local portal-db.json to production Prisma database (idempotent).
 * Usage: npx tsx lib/backend/sync-to-production.ts
 */
import { readFile } from "node:fs/promises";
import * as path from "node:path";
import { prisma } from "./prisma";
import type { PortalDatabase } from "./types";

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "portal-db.json");

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function clearAll(db: PortalDatabase) {
  // Delete in FK-safe order.
  // We intentionally avoid TRUNCATE ... CASCADE because it hit statement timeouts.
  await prisma.verification.deleteMany();
  await prisma.interview.deleteMany();
  await prisma.application.deleteMany();
  await prisma.jobPost.deleteMany();
  await prisma.applicantProfile.deleteMany();
  await prisma.employerProfile.deleteMany();
  await prisma.user.deleteMany();

  // Remaining independent tables
  await prisma.auditLog.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.report.deleteMany();
  await prisma.service.deleteMany();
}

async function syncToProduction() {
  console.log("🔄 Starting sync from local JSON to production database (idempotent)...");

  try {
    const raw = await readFile(dbPath, "utf8");
    const db = JSON.parse(raw) as PortalDatabase;

    console.log(
      `📊 Local data: ${db.users.length} users, ${db.verifications.length} verifications, ${db.applicantProfiles.length} applicants, ${db.employerProfiles.length} employers`
    );

    console.log("🗑️ Clearing existing production data...");
    await clearAll(db);

    console.log("🌱 Seeding production data (upsert by id)...");

    // USERS
    for (let i = 0; i < db.users.length; i++) {
      const u = db.users[i];
      await prisma.user.upsert({
        where: { id: u.id },
        update: {
          role: u.role,
          fullName: u.fullName,
          email: u.email,
          phone: u.phone || null,
          status: u.status,
          createdAt: new Date(u.createdAt),
        },
        create: {
          id: u.id,
          role: u.role,
          fullName: u.fullName,
          email: u.email,
          phone: u.phone || null,
          status: u.status,
          createdAt: new Date(u.createdAt),
        },
      });
      if (i % 100 === 0 && i !== 0) await sleep(30);
    }

    // EMPLOYER PROFILES
    for (let i = 0; i < db.employerProfiles.length; i++) {
      const p = db.employerProfiles[i];
      await prisma.employerProfile.upsert({
        where: { id: p.id },
        update: {
          userId: p.userId,
          companyName: p.companyName,
          contactPerson: p.contactPerson,
          headline: p.headline,
          location: p.location,
          verified: p.verified,
          businessType: p.businessType,
        },
        create: {
          id: p.id,
          userId: p.userId,
          companyName: p.companyName,
          contactPerson: p.contactPerson,
          headline: p.headline,
          location: p.location,
          verified: p.verified,
          businessType: p.businessType,
        },
      });
      if (i % 100 === 0 && i !== 0) await sleep(30);
    }

    // APPLICANT PROFILES
    for (let i = 0; i < db.applicantProfiles.length; i++) {
      const p = db.applicantProfiles[i];
      await prisma.applicantProfile.upsert({
        where: { id: p.id },
        update: {
          userId: p.userId,
          fullName: p.fullName,
          preferredName: p.preferredName,
          email: p.email,
          phone: p.phone,
          barangay: p.barangay,
          address: p.address,
          headline: p.headline,
          bio: p.bio,
          skills: p.skills as any,
          documentsReady: p.documentsReady as any,
        },
        create: {
          id: p.id,
          userId: p.userId,
          fullName: p.fullName,
          preferredName: p.preferredName,
          email: p.email,
          phone: p.phone,
          barangay: p.barangay,
          address: p.address,
          headline: p.headline,
          bio: p.bio,
          skills: p.skills as any,
          documentsReady: p.documentsReady as any,
        },
      });
      if (i % 100 === 0 && i !== 0) await sleep(30);
    }

    // JOB POSTS
    for (let i = 0; i < db.jobPosts.length; i++) {
      const jp = db.jobPosts[i];
      await prisma.jobPost.upsert({
        where: { id: jp.id },
        update: {
          employerId: jp.employerId,
          title: jp.title,
          position: jp.position,
          postType: jp.postType as any,
          createdAt: new Date(jp.createdAt),
          status: jp.status as any,
          qualifications: jp.qualifications,
          requirements: jp.requirements,
          description: jp.description,
          employmentType: jp.employmentType,
          schedule: jp.schedule,
          salary: jp.salary,
          urgency: jp.urgency,
          benefits: jp.benefits as any,
          employerRequirements: jp.employerRequirements as any,
          adminRequirements: jp.adminRequirements as any,
        },
        create: {
          id: jp.id,
          employerId: jp.employerId,
          title: jp.title,
          position: jp.position,
          postType: jp.postType as any,
          createdAt: new Date(jp.createdAt),
          status: jp.status as any,
          qualifications: jp.qualifications,
          requirements: jp.requirements,
          description: jp.description,
          employmentType: jp.employmentType,
          schedule: jp.schedule,
          salary: jp.salary,
          urgency: jp.urgency,
          benefits: jp.benefits as any,
          employerRequirements: jp.employerRequirements as any,
          adminRequirements: jp.adminRequirements as any,
        },
      });
      if (i % 100 === 0 && i !== 0) await sleep(30);
    }

    // APPLICATIONS
    for (let i = 0; i < db.applications.length; i++) {
      const app = db.applications[i];
      await prisma.application.upsert({
        where: { id: app.id },
        update: {
          jobPostId: app.jobPostId,
          applicantId: app.applicantId,
          fullName: app.fullName,
          email: app.email,
          contact: app.contact,
          position: app.position,
          appliedDate: new Date(app.appliedDate),
          status: app.status as any,
          availability: app.availability,
          shiftPreference: app.shiftPreference,
          introduction: app.introduction,
          documents: app.documents as any,
        },
        create: {
          id: app.id,
          jobPostId: app.jobPostId,
          applicantId: app.applicantId,
          fullName: app.fullName,
          email: app.email,
          contact: app.contact,
          position: app.position,
          appliedDate: new Date(app.appliedDate),
          status: app.status as any,
          availability: app.availability,
          shiftPreference: app.shiftPreference,
          introduction: app.introduction,
          documents: app.documents as any,
        },
      });
      if (i % 100 === 0 && i !== 0) await sleep(30);
    }

    // INTERVIEWS
    for (let i = 0; i < db.interviews.length; i++) {
      const iv = db.interviews[i];
      await prisma.interview.upsert({
        where: { id: iv.id },
        update: {
          applicationId: iv.applicationId,
          applicantName: iv.applicantName,
          position: iv.position,
          contact: iv.contact,
          interviewDate: iv.interviewDate ? new Date(iv.interviewDate) : null,
          interviewTime: iv.interviewTime,
          location: iv.location,
        },
        create: {
          id: iv.id,
          applicationId: iv.applicationId,
          applicantName: iv.applicantName,
          position: iv.position,
          contact: iv.contact,
          interviewDate: iv.interviewDate ? new Date(iv.interviewDate) : null,
          interviewTime: iv.interviewTime,
          location: iv.location,
        },
      });
      if (i % 100 === 0 && i !== 0) await sleep(30);
    }

    // VERIFICATIONS
    for (let i = 0; i < db.verifications.length; i++) {
      const v = db.verifications[i];
      const type =
        v.type === "Applicant Verification"
          ? "ApplicantVerification"
          : v.type === "Employer Verification"
          ? "EmployerVerification"
          : (v.type as any);

      await prisma.verification.upsert({
        where: { id: v.id },
        update: {
          type: type as any,
          subjectName: v.subjectName,
          status: v.status as any,
          submittedAt: new Date(v.submittedAt),
          email: v.email,
          documents: v.documents as any,
          notes: v.notes,
          inviteToken: v.inviteToken,
          inviteSentAt: v.inviteSentAt ? new Date(v.inviteSentAt) : null,
          approvedAt: v.approvedAt ? new Date(v.approvedAt) : null,
          rejectedAt: v.rejectedAt ? new Date(v.rejectedAt) : null,
        },
        create: {
          id: v.id,
          type: type as any,
          subjectName: v.subjectName,
          status: v.status as any,
          submittedAt: new Date(v.submittedAt),
          email: v.email,
          documents: v.documents as any,
          notes: v.notes,
          inviteToken: v.inviteToken,
          inviteSentAt: v.inviteSentAt ? new Date(v.inviteSentAt) : null,
          approvedAt: v.approvedAt ? new Date(v.approvedAt) : null,
          rejectedAt: v.rejectedAt ? new Date(v.rejectedAt) : null,
        },
      });
      if (i % 100 === 0 && i !== 0) await sleep(30);
    }

    // REPORTS
    for (let i = 0; i < db.reports.length; i++) {
      const r = db.reports[i];
      await prisma.report.upsert({
        where: { id: r.id },
        update: {
          category: r.category,
          subject: r.subject,
          severity: r.severity as any,
          status: r.status as any,
          createdAt: new Date(r.createdAt),
        },
        create: {
          id: r.id,
          category: r.category,
          subject: r.subject,
          severity: r.severity as any,
          status: r.status as any,
          createdAt: new Date(r.createdAt),
        },
      });
      if (i % 100 === 0 && i !== 0) await sleep(30);
    }

    // ALERTS
    for (let i = 0; i < db.alerts.length; i++) {
      const a = db.alerts[i];
      await prisma.alert.upsert({
        where: { id: a.id },
        update: {
          description: a.description,
          level: a.level as any,
          status: a.status as any,
          createdAt: new Date(a.createdAt),
        },
        create: {
          id: a.id,
          description: a.description,
          level: a.level as any,
          status: a.status as any,
          createdAt: new Date(a.createdAt),
        },
      });
      if (i % 100 === 0 && i !== 0) await sleep(30);
    }

    // AUDIT LOGS
    for (let i = 0; i < db.auditLogs.length; i++) {
      const al = db.auditLogs[i];
      await prisma.auditLog.upsert({
        where: { id: al.id },
        update: {
          action: al.action,
          actor: al.actor,
          target: al.target,
          createdAt: new Date(al.createdAt),
        },
        create: {
          action: al.action,
          actor: al.actor,
          target: al.target,
          // Let Prisma/DB generate createdAt default
          createdAt: new Date(al.createdAt),
        },
      });
      if (i % 100 === 0 && i !== 0) await sleep(30);
    }

    // SERVICES
    for (let i = 0; i < db.services.length; i++) {
      const s = db.services[i];
      await prisma.service.upsert({
        where: { id: s.id },
        update: {
          title: s.title,
          applications: s.applications,
          status: s.status as any,
        },
        create: {
          id: s.id,
          title: s.title,
          applications: s.applications,
          status: s.status as any,
        },
      });
      if (i % 100 === 0 && i !== 0) await sleep(30);
    }

    console.log("✨ Sync complete!");
  } catch (error) {
    console.error("❌ Sync failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

syncToProduction().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

