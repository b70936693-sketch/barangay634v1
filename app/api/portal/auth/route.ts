import { getCurrentPortalUser } from '@/lib/backend/auth';
import { prisma } from '@/lib/backend/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { portalUser, user } = await getCurrentPortalUser(request);

    const hasApprovedVerification = portalUser?.email
      ? await prisma.verification.findFirst({
          where: {
            OR: [
              { email: { equals: portalUser.email, mode: "insensitive" } },
              { email: portalUser.email.toLowerCase() },
            ],
            status: "approved",
          },
          orderBy: { submittedAt: "desc" },
        })
      : null;

    const isApproved =
      portalUser?.role === "admin" ||
      portalUser?.status === "verified" ||
      portalUser?.status === "active" ||
      Boolean(hasApprovedVerification);

    const isApprovedStatus = portalUser?.status === "verified" || portalUser?.status === "active";

    const redirectTo =
      !portalUser
        ? "/"
        : portalUser.role === "admin"
        ? "/admin"
        : isApprovedStatus
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

