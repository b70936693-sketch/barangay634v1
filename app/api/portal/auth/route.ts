import { getCurrentPortalUser } from '@/lib/backend/auth';
import { prisma } from '@/lib/backend/prisma';
import { readDatabase } from '@/lib/backend/store';
import { NextRequest, NextResponse } from 'next/server';

async function resolveApprovedVerification(email: string) {
  try {
    const record = await prisma.verification.findFirst({
      where: {
        OR: [
          { email: { equals: email, mode: "insensitive" } },
          { email: email.toLowerCase() },
        ],
        status: "approved",
      },
      orderBy: { submittedAt: "desc" },
    });
    if (record) return true;
  } catch (error) {
    console.warn("Prisma verification lookup failed, falling back to portal database:", error);
  }

  try {
    const db = await readDatabase();
    const normalizedEmail = email.toLowerCase();
    const user = db.users.find((entry) => entry.email?.toLowerCase() === normalizedEmail);
    if (user?.status === "verified" || user?.status === "active") {
      return true;
    }

    const employer = db.employerProfiles.find((profile) => {
      const linkedUser = db.users.find((entry) => entry.id === profile.userId);
      return linkedUser?.email?.toLowerCase() === normalizedEmail;
    });
    if (employer?.verified) {
      return true;
    }

    return db.verifications.some(
      (verification) =>
        verification.email?.toLowerCase() === normalizedEmail && verification.status === "approved"
    );
  } catch (error) {
    console.warn("Portal database verification lookup failed:", error);
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { portalUser, user } = await getCurrentPortalUser(request);

    const hasApprovedVerification = portalUser?.email
      ? await resolveApprovedVerification(portalUser.email)
      : false;

    const isApproved =
      portalUser?.role === "admin" ||
      portalUser?.status === "verified" ||
      portalUser?.status === "active" ||
      hasApprovedVerification;

    const redirectTo =
      !portalUser
        ? "/"
        : portalUser.role === "admin"
        ? "/admin"
        : isApproved
        ? portalUser.role === "employer"
          ? "/employer"
          : "/applicant"
        : "/auth/continue";
    
    return NextResponse.json({ 
      portalUser,
      user,
      isAuthenticated: !!portalUser,
      role: portalUser?.role || null,
      status: portalUser?.status || null,
      isApproved,
      redirectTo,
    });
  } catch (error) {
    console.error('Error in /api/portal/auth:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

