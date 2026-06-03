import { NextResponse } from "next/server";

import {
  getPhoneVerificationCookieName,
  normalizePhoneNumber,
  verifyPhoneVerificationCode,
} from "@/lib/server/phone-verification";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { phone?: string; code?: string };
    const phone = normalizePhoneNumber(body.phone ?? "");
    const code = (body.code ?? "").trim();

    if (!phone || !code) {
      return NextResponse.json({ error: "Phone number and SMS code are required." }, { status: 400 });
    }

    const cookieName = getPhoneVerificationCookieName();
    const cookieHeader = request.headers.get("cookie") ?? "";
    const cookieValue = cookieHeader
      .split(";")
      .map((entry) => entry.trim())
      .find((entry) => entry.startsWith(`${cookieName}=`))
      ?.slice(cookieName.length + 1);

    const verificationResult = verifyPhoneVerificationCode(cookieValue, phone, code);
    if (!verificationResult.ok) {
      return NextResponse.json({ error: verificationResult.reason }, { status: 400 });
    }

    const response = NextResponse.json({ ok: true, phone });
    response.cookies.set({
      name: cookieName,
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to verify SMS code.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
