/**
 * Seed admin endpoint - ONE TIME USE ONLY
 * Call this endpoint once to populate test data in production
 * Usage: POST /api/admin/seed with Authorization header
 * DELETE THIS AFTER SEEDING in production
 */
import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/backend/prisma";
import type { PortalDatabase } from "@/lib/backend/types";

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "portal-db.json");

async function seedFromJsonFile() {
  console.log("🔄 Starting seed from local JSON...");

  try {
    const raw = await readFile(dbPath, "utf8");
    const db = JSON.parse(raw) as PortalDatabase;

    console.log(`📊 Found data: ${db.users.length} users, ${db.verifications.length} verifications`);

    // Clear existing
    console.log("🗑️ Clearing existing data...");
    await prisma.service.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.alert.deleteMany();
    await prisma.report.deleteMany();
    await prisma.verification.deleteMany();
    await prisma.interview.deleteMany();
    await prisma.application.deleteMany();
    await prisma.jobPost.deleteMany();
    await prisma.applicantProfile.deleteMany();
    await prisma.employerProfile.deleteMany();
    await prisma.user.deleteMany();

    // Users
    if (db.users.length) {
      await prisma.user.createMany({
        data: db.users.map((u) => ({
          id: u.id,
          role: u.role,
          fullName: u.fullName,
          email: u.email,
          phone: u.phone || "",
          status: u.status,
          createdAt: new Date(u.createdAt),
        })),
      });
      console.log(`✅ Seeded ${db.users.length} users`);
    }

    // Employer profiles
    if (db.employerProfiles.length) {
      await prisma.employerProfile.createMany({
        data: db.employerProfiles.map((p) => ({
          id: p.id,
          userId: p.userId,
          companyName: p.companyName,
          contactPerson: p.contactPerson,
          headline: p.headline,
          location: p.location,
          verified: p.verified,
          businessType: p.businessType,
        })),
      });
      console.log(`✅ Seeded ${db.employerProfiles.length} employer profiles`);
    }

    // Applicant profiles
    if (db.applicantProfiles.length) {
      await prisma.applicantProfile.createMany({
        data: db.applicantProfiles.map((p) => ({
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
          skills: p.skills,
          documentsReady: p.documentsReady,
        })),
      });
      console.log(`✅ Seeded ${db.applicantProfiles.length} applicant profiles`);
    }

    // Job posts
    if (db.jobPosts.length) {
      await prisma.jobPost.createMany({
        data: db.jobPosts.map((jp) => ({
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
          benefits: jp.benefits,
          employerRequirements: jp.employerRequirements,
          adminRequirements: jp.adminRequirements,
        })),
      });
      console.log(`✅ Seeded ${db.jobPosts.length} job posts`);
    }

    // Applications
    if (db.applications.length) {
      await prisma.application.createMany({
        data: db.applications.map((app) => ({
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
          documents: app.documents,
        })),
      });
      console.log(`✅ Seeded ${db.applications.length} applications`);
    }

    // Interviews
    if (db.interviews.length) {
      await prisma.interview.createMany({
        data: db.interviews.map((iv) => ({
          id: iv.id,
          applicationId: iv.applicationId,
          applicantName: iv.applicantName,
          position: iv.position,
          contact: iv.contact,
          interviewDate: iv.interviewDate,
          interviewTime: iv.interviewTime,
          location: iv.location,
        })),
      });
      console.log(`✅ Seeded ${db.interviews.length} interviews`);
    }

    // Verifications
    if (db.verifications.length) {
      await prisma.verification.createMany({
        data: db.verifications.map((v) => {
          const type =
            v.type === "Applicant Verification"
              ? "ApplicantVerification"
              : v.type === "Employer Verification"
              ? "EmployerVerification"
              : (v.type as any);

          return {
            id: v.id,
            type: type as any,
            subjectName: v.subjectName,
            status: v.status as any,
            submittedAt: new Date(v.submittedAt),
            email: v.email,
            documents: v.documents,
            notes: v.notes,
            inviteToken: v.inviteToken,
            inviteSentAt: v.inviteSentAt ? new Date(v.inviteSentAt) : null,
            approvedAt: v.approvedAt ? new Date(v.approvedAt) : null,
            rejectedAt: v.rejectedAt ? new Date(v.rejectedAt) : null,
          };
        }),
      });
      console.log(`✅ Seeded ${db.verifications.length} verifications`);
    }

    // Reports
    if (db.reports.length) {
      await prisma.report.createMany({
        data: db.reports.map((r) => ({
          id: r.id,
          category: r.category,
          subject: r.subject,
          severity: r.severity as any,
          status: r.status as any,
          createdAt: new Date(r.createdAt),
        })),
      });
      console.log(`✅ Seeded ${db.reports.length} reports`);
    }

    // Alerts
    if (db.alerts.length) {
      await prisma.alert.createMany({
        data: db.alerts.map((a) => ({
          id: a.id,
          description: a.description,
          level: a.level as any,
          status: a.status as any,
          createdAt: new Date(a.createdAt),
        })),
      });
      console.log(`✅ Seeded ${db.alerts.length} alerts`);
    }

    console.log("✨ Seeding complete!");
    return true;
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  }
}

export async function POST(request: Request) {
  // Simple auth check - in production, validate the request properly
  const authHeader = request.headers.get("authorization");
  const token = process.env.ADMIN_SEED_TOKEN || "dev-seed-token";

  if (!authHeader || !authHeader.includes(token)) {
    return NextResponse.json(
      { error: "Unauthorized - Set ADMIN_SEED_TOKEN environment variable" },
      { status: 401 }
    );
  }

  try {
    await seedFromJsonFile();
    return NextResponse.json({
      success: true,
      message: "Database seeded successfully. DELETE THIS ENDPOINT AFTER SEEDING.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Seeding failed", details: message },
      { status: 500 }
    );
  }
}
