import { prisma } from "@/lib/backend/prisma";

import { readDatabase } from "@/lib/backend/store";
import { createServerSupabaseClient, supabaseAdmin } from "@/lib/supabase-server";
import type { Role } from "@/lib/backend/types";

// List of admin emails - can be extended
const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(",").map(e => e.toLowerCase().trim()) || [];

type SupabaseAuthUser = {
  id: string;
  email?: string | null;
  phone?: string | null;
  user_metadata?: {
    full_name?: string;
    phone?: string;
    role?: string;
  };
};

function normalizeRole(value: string | null | undefined): Role | null {
  const normalized = value?.toString().toLowerCase().trim();
  if (normalized === "admin" || normalized === "employer" || normalized === "applicant") {
    return normalized;
  }

  return null;
}

function inferRoleFromRequest(request: Request): Role {
  const pathname = new URL(request.url).pathname;

  // Only infer admin from path if it's actually an admin endpoint
  if (pathname.startsWith("/api/portal/admin")) return "admin";
  // Don't infer employer/applicant from path - always require explicit metadata
  
  return "applicant";
}

function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.toString().toLowerCase().trim();
  return ADMIN_EMAILS.map((e) => e.toLowerCase().trim()).includes(normalized);
}


async function getAuthenticatedSupabaseUser(request: Request): Promise<SupabaseAuthUser | null> {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.replace("Bearer ", "")
    : null;

  // Prefer Authorization Bearer token (works with client-side fetches)
  // even when we don't have the supabaseAdmin helper configured.
  if (token) {
    try {
      const serverSupabase = await createServerSupabaseClient();
      const {
        data: { user },
        error,
      } = await serverSupabase.auth.getUser(token);

      if (error || !user) {
        console.warn(
          "Supabase auth getUser failed for authorization token. Falling back to cookie session.",
          error?.message ?? "unknown error"
        );
      } else {
        return user;
      }
    } catch (error) {
      console.warn(
        "Supabase auth getUser threw for authorization token. Falling back to cookie session:",
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  // Fallback: cookie/session-based lookup
  try {
    const serverSupabase = await createServerSupabaseClient();
    const {
      data: { user },
      error,
    } = await serverSupabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error("Supabase server session lookup failed:", error);
    return null;
  }
}


async function ensurePortalUserRecord(user: SupabaseAuthUser, request: Request) {
  const email = user.email?.toLowerCase();
  if (!email) {
    return null;
  }

  try {
    // Check if user is admin by email or metadata
    const emailIsAdmin = isAdminEmail(email);
    const userMetadataRole = normalizeRole(user.user_metadata?.role);

    // Prisma fallback to detect admin role if already stored
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ id: user.id }, { email }],
      },
    });

    let requestedRole: Role = "applicant";

    // Determine the role (priority):
    // 1. If admin email -> admin
    // 2. If metadata says admin/employer/applicant -> use it
    // 3. If DB already has a stored role -> use it
    // 4. Otherwise -> infer via profile existence
    if (emailIsAdmin) {
      requestedRole = "admin";
    } else if (userMetadataRole) {
      requestedRole = userMetadataRole;
    } else if (existingUser?.role) {
      requestedRole = existingUser.role;
    } else {
      // Supabase fallback: infer role by existence of profile rows.
      // This fixes cases where user_metadata.role is missing.
      try {
        const db = await readDatabase();
        const fallbackUser = db.users?.find((record) => record.email?.toLowerCase() === email);

        if (fallbackUser?.role) {
          requestedRole = fallbackUser.role;
        } else {
          // NOTE: createServerSupabaseClient is only available at runtime in this file scope.
          // To avoid circular imports, we use dynamic import.
          const { createServerSupabaseClient } = await import("@/lib/supabase-server");
          const sb = await createServerSupabaseClient();

          const { data: employerProfile, error: employerErr } = await sb
            .from("employer_profiles")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();

          if (!employerErr && employerProfile?.id) {
            requestedRole = "employer";
          } else {
            const { data: applicantProfile, error: applicantErr } = await sb
              .from("applicant_profiles")
              .select("id")
              .eq("user_id", user.id)
              .maybeSingle();

            if (!applicantErr && applicantProfile?.id) {
              requestedRole = "applicant";
            }
          }
        }
      } catch (roleInferErr) {
        // If inference fails, keep default applicant.
        console.warn("[Auth] role inference via supabase profile existence failed:", roleInferErr);
      }
    }


    let fallbackStatus: string | null = null;
    try {
      const db = await readDatabase();
      const fallbackUser = db.users?.find((record) => record.email?.toLowerCase() === email);
      fallbackStatus = fallbackUser?.status ?? null;
    } catch (error) {
      console.warn("Unable to read fallback database for user status:", error);
    }

    const approvedVerification = await prisma.verification.findFirst({
      where: {
        OR: [
          { email: { equals: email, mode: "insensitive" } },
          { email: email.toLowerCase() },
        ],
        status: "approved",
      },
      orderBy: { submittedAt: "desc" },
    });

    const statusCandidates = [
      existingUser?.status,
      fallbackStatus,
      approvedVerification ? "verified" : null,
    ].filter((status): status is string => Boolean(status));

    const resolvedStatus =
      statusCandidates.find((status) => status !== "pending") ??
      statusCandidates[0] ??
      "pending";

    const allowedStatuses = ["active", "pending", "verified", "suspended"] as const;
    const toUserStatus = (value: unknown): (typeof allowedStatuses)[number] => {
      const str = typeof value === "string" ? value : null;
      if (str && (allowedStatuses as readonly string[]).includes(str)) return str as (typeof allowedStatuses)[number];
      return "pending";
    };

    const storedUserName = existingUser?.fullName || null;
    const storedUserPhone = existingUser?.phone || null;

    const fullName =
      (user.user_metadata?.full_name && user.user_metadata.full_name.trim()) ||
      storedUserName ||
      user.email ||
      "User";
    const phone = user.user_metadata?.phone || storedUserPhone || user.phone || "";
    const finalStatus = requestedRole === "admin" ? "verified" : toUserStatus(resolvedStatus);

    const portalUser = await prisma.user.upsert({
      where: { email },
      update: {
        fullName,
        phone,
        role: requestedRole,
        status: finalStatus,
      },
      create: {
        id: user.id,
        email,
        fullName,
        phone,
        role: requestedRole,
        status: finalStatus,
      },
    });

    console.log(`[Auth] User ${email}: role=${portalUser.role}, status=${finalStatus}, isAdminEmail=${emailIsAdmin}, metadataRole=${userMetadataRole}`);

    if (portalUser.role === "employer") {
      try {
        await prisma.employerProfile.upsert({
          where: { userId: portalUser.id },
          update: {},
          create: {
            userId: portalUser.id,
            companyName: `${portalUser.fullName}'s Business`,
            contactPerson: portalUser.fullName,
            headline: "New employer account",
            location: "Barangay 634",
            verified: false,
            businessType: "Pending business type",
          },
        });
      } catch (err) {
        console.warn("Failed to create employer profile:", err);
      }
    }

    if (portalUser.role === "applicant") {
      try {
        await prisma.applicantProfile.upsert({
          where: { userId: portalUser.id },
          update: {
            fullName: portalUser.fullName,
            email: portalUser.email,
            phone: portalUser.phone ?? "",
          },
          create: {
            userId: portalUser.id,
            fullName: portalUser.fullName,
            preferredName: portalUser.fullName.split(" ")[0] ?? portalUser.fullName,
            email: portalUser.email,
            phone: portalUser.phone ?? "",
            barangay: "Barangay 634",
            address: "",
            headline: "New applicant account",
            bio: "",
            skills: [],
            documentsReady: [],
          },
        });
      } catch (err) {
        console.warn("Failed to create applicant profile:", err);
      }
    }

    return {
      id: portalUser.id,
      role: portalUser.role,
      fullName: portalUser.fullName,
      email: portalUser.email,
      phone: portalUser.phone ?? "",
      status: portalUser.status,
      createdAt: portalUser.createdAt.toISOString(),
    };
  } catch (error) {
    console.error("Error in ensurePortalUserRecord:", error);
    // If Prisma operations fail, return a minimal user object based on Supabase data
    // This ensures users can still access the portal even if database operations are having issues
    const isAdminEmail = ADMIN_EMAILS.includes(email);
    const userMetadataRole = normalizeRole(user.user_metadata?.role);

    let fallbackStoredUser: { fullName?: string | null; role?: string | null } | null = null;
    let requestedRole: Role = "applicant";
    if (isAdminEmail) {
      requestedRole = "admin";
    } else if (userMetadataRole) {
      requestedRole = userMetadataRole;
    }

    try {
      fallbackStoredUser = await prisma.user.findFirst({ where: { email } });
      if (fallbackStoredUser?.role) {
        requestedRole = fallbackStoredUser.role as Role;
      }
    } catch (dbLookupError) {
      console.warn("Failed to query Prisma user for fallback role resolution:", dbLookupError);
    }

    try {
      const { createServerSupabaseClient } = await import("@/lib/supabase-server");
      const sb = await createServerSupabaseClient();

      const [{ data: employerProfile, error: employerErr }, { data: applicantProfile, error: applicantErr }] =
        await Promise.all([
          sb.from("employer_profiles").select("id").eq("user_id", user.id).maybeSingle(),
          sb.from("applicant_profiles").select("id").eq("user_id", user.id).maybeSingle(),
        ]);

      if (!employerErr && employerProfile?.id) {
        requestedRole = "employer";
      } else if (!applicantErr && applicantProfile?.id) {
        requestedRole = "applicant";
      }
    } catch (profileLookupError) {
      console.warn("Failed to infer role from Supabase profiles in fallback path:", profileLookupError);
    }
    const fullName =
      (user.user_metadata?.full_name && user.user_metadata.full_name.trim()) ||
      fallbackStoredUser?.fullName ||
      user.email ||
      "User";
    const hasApprovedVerification = await prisma.verification.findFirst({
      where: {
        OR: [
          { email: { equals: email, mode: "insensitive" } },
          { email: email.toLowerCase() },
        ],
        status: "approved",
      },
      orderBy: { submittedAt: "desc" },
    });
    const status: "pending" | "verified" =
      requestedRole === "admin" || hasApprovedVerification
        ? "verified"
        : "pending";
    console.log(`[Auth Fallback] User ${email}: role=${requestedRole}, status=${status}, isAdminEmail=${isAdminEmail}, metadataRole=${userMetadataRole}`);
    return {
      id: user.id,
      role: requestedRole,
      fullName: fullName,
      email: email,
      phone: user.phone ?? "",
      status,
      createdAt: new Date().toISOString(),
    };
  }
}

export async function getCurrentPortalUser(request: Request) {
  const user = await getAuthenticatedSupabaseUser(request);
  if (!user) {
    return { portalUser: null, user: null };
  }

  const email = user.email;
  if (!email) {
    return { portalUser: null, user };
  }

  let portalUser = await ensurePortalUserRecord(user, request);

  if (!portalUser) {
    try {
      const db = await readDatabase();
      portalUser =
        db.users?.find((record) => record.email?.toLowerCase() === email.toLowerCase()) ?? null;
    } catch (err) {
      console.error("Failed to read from database fallback:", err);
    }
  }

  return { portalUser, user };
}

export async function requirePortalRole(request: Request, requiredRole: string) {
  const { portalUser } = await getCurrentPortalUser(request);
  if (!portalUser) {
    return null;
  }

  if (portalUser.role?.toString().toLowerCase() !== requiredRole?.toString().toLowerCase()) {
    return null;
  }

  return portalUser;
}

export function defaultRedirectForRole(role: string) {
  switch (role?.toString().toLowerCase()) {
    case "admin":
      return "/admin";
    case "employer":
      return "/employer";
    case "applicant":
      return "/applicant";
    default:
      return "/";
  }
}
