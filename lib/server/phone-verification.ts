import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const PHONE_COOKIE_NAME = "jobserve_phone_verification";
const PHONE_VERIFICATION_TTL_MS = 5 * 60 * 1000;

type PhoneVerificationPayload = {
  phone: string;
  codeHash: string;
  expiresAt: number;
};

function getCookieSecret() {
  return process.env.PHONE_VERIFICATION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "jobserve-phone-secret";
}

function signPayload(payload: string) {
  return createHmac("sha256", getCookieSecret()).update(payload).digest("base64url");
}

function encodePayload(payload: PhoneVerificationPayload) {
  const rawPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = signPayload(rawPayload);
  return `${rawPayload}.${signature}`;
}

function decodePayload(value: string | undefined): PhoneVerificationPayload | null {
  if (!value) return null;

  const [rawPayload, signature] = value.split(".");
  if (!rawPayload || !signature) return null;

  const expectedSignature = signPayload(rawPayload);
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  const signatureBuffer = Buffer.from(signature, "utf8");

  if (
    expectedBuffer.length !== signatureBuffer.length ||
    !timingSafeEqual(expectedBuffer, signatureBuffer)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(rawPayload, "base64url").toString("utf8")) as PhoneVerificationPayload;
    if (!parsed.phone || !parsed.codeHash || !parsed.expiresAt) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function normalizePhoneNumber(input: string) {
  const digits = input.replace(/[^\d+]/g, "");

  if (digits.startsWith("+63") && digits.length === 13) return digits;
  if (digits.startsWith("63") && digits.length === 12) return `+${digits}`;
  if (digits.startsWith("09") && digits.length === 11) return `+63${digits.slice(1)}`;
  if (digits.startsWith("9") && digits.length === 10) return `+63${digits}`;

  return input.trim();
}

export function createPhoneVerificationCookie(phone: string, code: string) {
  const payload: PhoneVerificationPayload = {
    phone,
    codeHash: createHash("sha256").update(`${phone}:${code}`).digest("hex"),
    expiresAt: Date.now() + PHONE_VERIFICATION_TTL_MS,
  };

  return {
    name: PHONE_COOKIE_NAME,
    value: encodePayload(payload),
    maxAge: Math.floor(PHONE_VERIFICATION_TTL_MS / 1000),
  };
}

export function verifyPhoneVerificationCode(cookieValue: string | undefined, phone: string, code: string) {
  const payload = decodePayload(cookieValue);
  if (!payload) {
    return { ok: false, reason: "Verification session not found. Request a new SMS code." };
  }

  if (payload.expiresAt < Date.now()) {
    return { ok: false, reason: "The SMS code has expired. Request a new one." };
  }

  if (payload.phone !== phone) {
    return { ok: false, reason: "The phone number does not match the pending verification." };
  }

  const attemptedHash = createHash("sha256").update(`${phone}:${code}`).digest("hex");
  if (payload.codeHash !== attemptedHash) {
    return { ok: false, reason: "The SMS code is incorrect." };
  }

  return { ok: true, expiresAt: payload.expiresAt };
}

async function sendWithTwilio(phone: string, message: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !from) {
    return { handled: false as const };
  }

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      To: phone,
      From: from,
      Body: message,
    }),
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Twilio SMS failed: ${response.status} ${responseText}`);
  }

  return { handled: true as const };
}

async function sendWithSemaphore(phone: string, message: string) {
  const apiKey = process.env.SEMAPHORE_API_KEY;
  const senderName = process.env.SEMAPHORE_SENDER_NAME || "Barangay634";

  if (!apiKey) {
    return { handled: false as const };
  }

  const response = await fetch("https://api.semaphore.co/api/v4/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      apikey: apiKey,
      number: phone.replace(/^\+/, ""),
      message,
      sendername: senderName,
    }),
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Semaphore SMS failed: ${response.status} ${responseText}`);
  }

  return { handled: true as const };
}

export async function sendPhoneVerificationSms(phone: string, code: string) {
  const message = `Barangay 634 verification code: ${code}. It expires in 5 minutes.`;

  const twilioResult = await sendWithTwilio(phone, message);
  if (twilioResult.handled) return;

  const semaphoreResult = await sendWithSemaphore(phone, message);
  if (semaphoreResult.handled) return;

  throw new Error(
    "SMS provider is not configured. Set Twilio or Semaphore environment variables before using phone verification."
  );
}

export function getPhoneVerificationCookieName() {
  return PHONE_COOKIE_NAME;
}
