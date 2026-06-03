import { NextResponse } from "next/server";

import {
  createPhoneVerificationCookie,
  normalizePhoneNumber,
  sendPhoneVerificationSms,
} from "@/lib/server/phone-verification";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { phone?: string };
    const phone = normalizePhoneNumber(body.phone ?? "");

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
    }

    const code = `${Math.floor(100000 + Math.random() * 900000)}`;
    await sendPhoneVerificationSms(phone, code);

    const response = NextResponse.json({
      ok: true,
      phone,
      expiresInSeconds: 300,
    });

    const cookie = createPhoneVerificationCookie(phone, code);
    response.cookies.set({
      name: cookie.name,
      value: cookie.value,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: cookie.maxAge,
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to send SMS code.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
