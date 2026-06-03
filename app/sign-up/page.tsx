"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BadgeCheck, CreditCard, IdCard, LockKeyhole, Mail, UploadCloud, UserRound } from "lucide-react";

import { getSessionSafe, supabase } from "@/lib/supabase";

type Role = "applicant" | "employer";
type Step = 1 | 2 | 3;
type UploadedIdRecord = {
  bucket: string;
  objectPath: string;
  fileName: string;
  ocrText: string;
  ocrProvider: string;
  warning?: string | null;
};

const ROLE_LABELS: Record<Role, string> = {
  applicant: "Applicant",
  employer: "Employer",
};

function normalizeRole(role?: string | null): Role {
  if (role === "applicant" || role === "employer") {
    return role;
  }
  return "employer";
}

function resolveRedirectUrl(redirectUrlParam: string | null, resolvedRole: Role) {
  const rawRedirect = redirectUrlParam || "/auth/continue";
  return !rawRedirect.includes("/auth/continue?role=") && rawRedirect.startsWith("/auth/continue")
    ? `${rawRedirect}${rawRedirect.includes("?") ? "&" : "?"}role=${resolvedRole}`
    : rawRedirect;
}

function formatCountdown(expiresAt: number | null, now: number) {
  if (!expiresAt) return "";
  const remainingMs = expiresAt - now;
  if (remainingMs <= 0) return "Expired";

  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function SignUpPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [address, setAddress] = useState("");
  const [frontIdFile, setFrontIdFile] = useState<File | null>(null);
  const [backIdFile, setBackIdFile] = useState<File | null>(null);
  const [businessPermitFile, setBusinessPermitFile] = useState<File | null>(null);
  const [uploadedFrontId, setUploadedFrontId] = useState<UploadedIdRecord | null>(null);
  const [uploadedBackId, setUploadedBackId] = useState<UploadedIdRecord | null>(null);
  const [uploadedBusinessPermit, setUploadedBusinessPermit] = useState<UploadedIdRecord | null>(null);
  const [ocrResult, setOcrResult] = useState("Waiting for upload...");
  const [otpInput, setOtpInput] = useState(["", "", "", "", "", ""]);
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null);
  const [otpStatusMessage, setOtpStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [isUploadingFrontId, setIsUploadingFrontId] = useState(false);
  const [isUploadingBackId, setIsUploadingBackId] = useState(false);
  const [isUploadingBusinessPermit, setIsUploadingBusinessPermit] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [hasPreparedAuthUser, setHasPreparedAuthUser] = useState(false);
  const [preparedEmail, setPreparedEmail] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem("jobserve_pending_role");
    window.localStorage.removeItem("jobserve_pending_role");
    window.sessionStorage.removeItem("jobserve_pending_email");
    window.localStorage.removeItem("jobserve_pending_email");
  }, []);

  useEffect(() => {
    if (!otpExpiresAt) return;

    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [otpExpiresAt]);

  const fallbackSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://barangay634.vercel.app";
  const siteOrigin = typeof window === "undefined" ? fallbackSiteUrl : window.location.origin;

  const role = normalizeRole(searchParams.get("role"));
  const redirectUrl = resolveRedirectUrl(searchParams.get("redirect_url"), role);
  const roleLabel = ROLE_LABELS[role];
  const isBarangayVerified = address.trim().toLowerCase().includes("barangay 634");
  const isEmployer = role === "employer";
  const uploadReady = Boolean(uploadedFrontId && uploadedBackId && (!isEmployer || uploadedBusinessPermit));
  const countdownLabel = formatCountdown(otpExpiresAt, now);
  const authLinkQuery = useMemo(() => {
    const params = new URLSearchParams();
    params.set("redirect_url", redirectUrl);
    params.set("role", role);
    return params.toString();
  }, [redirectUrl, role]);

  const resetMessages = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleNextFromInfo = () => {
    resetMessages();

    if (!fullName.trim() || !email.trim() || !password.trim() || !address.trim()) {
      setErrorMessage("Please complete your full name, email, password, and address first.");
      return;
    }

    setCurrentStep(2);
  };

  const handleSendCode = () => {
    resetMessages();
    setOtpStatusMessage(null);

    if (!email.trim()) {
      setErrorMessage("Enter your email address before requesting a verification code.");
      return;
    }

    setIsSendingCode(true);

    void (async () => {
      const normalizedEmail = email.trim().toLowerCase();
      console.log('Attempting to send verification email to:', normalizedEmail);
      console.log('Site origin:', siteOrigin);
      console.log('Redirect URL:', redirectUrl);

      // Always try to send verification email
      let emailSent = false;
      let errorMessage = "";

      if (!hasPreparedAuthUser || preparedEmail !== normalizedEmail) {
        console.log('Calling signUp for new/prepared user');
        // First, try to sign up (this will send email for new users)
        const signUpResult = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: {
              full_name: fullName,
              address,
              role,
            },
            emailRedirectTo: `${siteOrigin}${redirectUrl}`,
          },
        });

        console.log('SignUp result:', signUpResult);

        if (signUpResult.error) {
          const message = signUpResult.error.message?.toLowerCase() ?? "";
          console.log('SignUp error message:', message);
          if (
            message.includes("already registered") ||
            message.includes("already been registered") ||
            message.includes("user already registered") ||
            message.includes("already exists")
          ) {
            console.log('User already exists, trying resend');
            // User exists, try to resend
            const resendResult = await supabase.auth.resend({
              type: "signup",
              email: normalizedEmail,
              options: {
                emailRedirectTo: `${siteOrigin}${redirectUrl}`,
              },
            });

            console.log('Resend result:', resendResult);

            if (resendResult.error) {
              errorMessage = resendResult.error.message || "Unable to resend the verification email.";
            } else {
              emailSent = true;
            }
          } else {
            errorMessage = signUpResult.error.message || "Unable to start email verification.";
          }
        } else {
          console.log('SignUp successful, email should be sent');
          // Sign up succeeded, email should be sent automatically
          emailSent = true;
        }
      } else {
        console.log('User already prepared, calling resend');
        // User already prepared, just resend
        const resendResult = await supabase.auth.resend({
          type: "signup",
          email: normalizedEmail,
          options: {
            emailRedirectTo: `${siteOrigin}${redirectUrl}`,
          },
        });

        console.log('Resend result:', resendResult);

        if (resendResult.error) {
          errorMessage = resendResult.error.message || "Unable to resend the verification email.";
        } else {
          emailSent = true;
        }
      }

      if (!emailSent) {
        console.log('Email not sent, error:', errorMessage);
        setIsSendingCode(false);
        setErrorMessage(errorMessage);
        return;
      }

      console.log('Email sent successfully');
      setHasPreparedAuthUser(true);
      setPreparedEmail(normalizedEmail);
      setEmail(normalizedEmail);
      setOtpInput(["", "", "", "", "", ""]);
      setOtpExpiresAt(Date.now() + 5 * 60 * 1000);
      setNow(Date.now());
      setEmailVerified(false);
      setOtpStatusMessage(`Verification email sent to ${normalizedEmail}. Check inbox/spam for 6-digit code (expires ${formatCountdown(Date.now() + 5*60*1000, Date.now())})`);
      setIsSendingCode(false);
    })().catch((error) => {
      console.error("Error sending verification email:", error);
      setIsSendingCode(false);
      setErrorMessage("Unable to send verification email at this time. Please try again.");
    });
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    setOtpInput((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
  };

  const handleVerifyEmail = () => {
    resetMessages();
    setOtpStatusMessage(null);

    if (!otpExpiresAt) {
      setErrorMessage("Send a verification code first.");
      return;
    }

    if (otpExpiresAt && otpExpiresAt < Date.now()) {
      setErrorMessage("The verification code has expired. Send a new code to continue.");
      return;
    }

    if (otpInput.some((digit) => !digit)) {
      setErrorMessage("Enter the full 6-digit email code.");
      return;
    }

    setIsVerifyingEmail(true);

    void (async () => {
      const verifyResult = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: otpInput.join(""),
        type: "signup",
      });
      setIsVerifyingEmail(false);

      if (verifyResult.error) {
        setErrorMessage(verifyResult.error.message || "Unable to verify the email code.");
        return;
      }

      setEmailVerified(true);
      setOtpStatusMessage("Email address verified.");
      setCurrentStep(3);
    })();
  };

  const handleUpload = (side: "front" | "back" | "permit", file: File | null) => {
    resetMessages();

    if (!file) {
      if (side === "front") {
        setFrontIdFile(null);
        setUploadedFrontId(null);
      } else if (side === "back") {
        setBackIdFile(null);
        setUploadedBackId(null);
      } else {
        setBusinessPermitFile(null);
        setUploadedBusinessPermit(null);
      }
      setOcrResult("Waiting for upload...");
      return;
    }

    if (side === "front") {
      setFrontIdFile(file);
      setIsUploadingFrontId(true);
    } else if (side === "back") {
      setBackIdFile(file);
      setIsUploadingBackId(true);
    } else {
      setBusinessPermitFile(file);
      setIsUploadingBusinessPermit(true);
    }

    setOcrResult(`Uploading ${side === "permit" ? "business permit" : `${side} ID`} and extracting text...`);

    void (async () => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("side", side);

      const response = await fetch("/api/portal/identity", {
        method: "POST",
        body: formData,
      });

      const result = (await response.json().catch(() => null)) as
        | (UploadedIdRecord & { error?: string; warning?: string | null })
        | null;

      if (side === "front") {
        setIsUploadingFrontId(false);
      } else if (side === "back") {
        setIsUploadingBackId(false);
      } else {
        setIsUploadingBusinessPermit(false);
      }

      if (!response.ok || !result) {
        const label = side === "permit" ? "business permit" : `${side} ID`;
        setErrorMessage(result?.error || `Unable to upload the ${label}.`);
        setOcrResult(`Upload failed for the ${label}.`);
        return;
      }

      if (side === "front") {
        setUploadedFrontId(result);
      } else if (side === "back") {
        setUploadedBackId(result);
      } else {
        setUploadedBusinessPermit(result);
      }

      const nextFront = side === "front" ? result : uploadedFrontId;
      const nextBack = side === "back" ? result : uploadedBackId;
      const nextPermit = side === "permit" ? result : uploadedBusinessPermit;
      const ocrText = [nextFront?.ocrText, nextBack?.ocrText, nextPermit?.ocrText].filter(Boolean).join("\n\n");
      const warnings = [nextFront?.warning, nextBack?.warning, nextPermit?.warning].filter(Boolean).join(" ");

      setOcrResult(
        [
          ocrText ? `Detected text:\n${ocrText}` : "No OCR text detected yet.",
          warnings || "",
        ]
          .filter(Boolean)
          .join("\n\n")
      );
    })();
  };

  const handleSubmit = async () => {
    resetMessages();

    if (!emailVerified) {
      setErrorMessage("Verify your email address before completing sign up.");
      return;
    }

    if (!uploadReady) {
      setErrorMessage(
        isEmployer
          ? "Upload the front and back of your ID plus your business permit before completing sign up."
          : "Upload both the front and back of your ID before completing sign up."
      );
      return;
    }

    setIsSubmitting(true);

    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("jobserve_pending_role", role);
      window.localStorage.setItem("jobserve_pending_role", role);
      window.sessionStorage.setItem("jobserve_pending_email", email);
      window.localStorage.setItem("jobserve_pending_email", email);
    }

    try {
      const currentSession = await getSessionSafe();
      if (currentSession.data?.session?.user?.email?.toLowerCase() !== email.toLowerCase()) {
        await supabase.auth.signOut();
      }
    } catch (error) {
      console.warn("Unable to clear a stale session before sign up:", error);
    }

    const verifiedSessionResult = await getSessionSafe();
    const verifiedSession = verifiedSessionResult.data?.session;

    if (!verifiedSession?.user || verifiedSession.user.email?.toLowerCase() !== email.toLowerCase()) {
      setIsSubmitting(false);
      setErrorMessage("Email verification session was not found. Verify your email again before completing sign up.");
      return;
    }

    const updateResult = await supabase.auth.updateUser({
      data: {
        full_name: fullName,
        address,
        role,
      },
    });

    if (updateResult.error) {
      setIsSubmitting(false);
      setErrorMessage(updateResult.error.message || "Unable to finish account setup.");
      return;
    }

    const verificationResponse = await fetch("/api/portal/verifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: role === "employer" ? "employer" : "applicant",
        fullName,
        email,
        address,
        barangay: isBarangayVerified ? "Barangay 634" : address,
        documents: [
          uploadedFrontId?.objectPath,
          uploadedBackId?.objectPath,
          uploadedBusinessPermit?.objectPath,
        ].filter(Boolean),
        notes: [
          `Submitted from sign up stepper as a ${roleLabel.toLowerCase()} account.`,
          uploadedFrontId ? `Front ID: ${uploadedFrontId.fileName}` : "",
          uploadedBackId ? `Back ID: ${uploadedBackId.fileName}` : "",
          uploadedBusinessPermit ? `Business permit: ${uploadedBusinessPermit.fileName}` : "",
          uploadedFrontId?.ocrText ? `Front OCR: ${uploadedFrontId.ocrText}` : "",
          uploadedBackId?.ocrText ? `Back OCR: ${uploadedBackId.ocrText}` : "",
          uploadedBusinessPermit?.ocrText ? `Permit OCR: ${uploadedBusinessPermit.ocrText}` : "",
          uploadedFrontId?.warning || uploadedBackId?.warning || uploadedBusinessPermit?.warning
            ? `OCR warning: ${[uploadedFrontId?.warning, uploadedBackId?.warning, uploadedBusinessPermit?.warning]
                .filter(Boolean)
                .join(" ")}`
            : "",
        ]
          .filter(Boolean)
          .join("\n"),
      }),
    });

    setIsSubmitting(false);

    if (!verificationResponse.ok) {
      const verificationError = await verificationResponse.text();
      console.error("Unable to save verification record:", verificationError);
      setErrorMessage("Your account was created, but we could not save the ID verification step. Please try signing in after email confirmation.");
      return;
    }

    router.push(redirectUrl);
  };

  const steps = [
    { id: 1, label: "Info", active: currentStep === 1, completed: currentStep > 1 },
    { id: 2, label: "Email", active: currentStep === 2, completed: currentStep > 2 },
    { id: 3, label: "ID", active: currentStep === 3, completed: false },
  ] as const;

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(90,148,199,0.55),_transparent_34%),linear-gradient(180deg,#24598a_0%,#1d4d79_38%,#173d65_100%)] px-6 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center justify-center">
        <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1.2fr_2.8fr]">
          <section className="hidden lg:flex flex-col justify-between rounded-2xl bg-white/10 p-8 text-white shadow-2xl ring-1 ring-white/20 backdrop-blur max-h-[500px]">
            <div className="space-y-6 leading-relaxed">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-blue-100/90 text-left">Barangay 634 JobServe</p>
              <h1 className="max-w-md text-3xl font-bold leading-tight text-left">
                Build your local opportunity profile in guided steps
              </h1>
            </div>
            <div className="grid gap-4 text-sm text-blue-50/90 text-justify leading-relaxed">
              <div className="rounded-2xl bg-white/10 p-6">
                <p className="font-semibold text-left">3-step guided flow</p>
                <p className="mt-3 text-blue-100/80 leading-relaxed">Enter basic info, verify email with OTP code, then upload ID documents for local verification.</p>
              </div>
            </div>
          </section>

          <section className="rounded-lg bg-[#f8f9fa] p-2.5 shadow-lg">
            <div className="rounded-lg bg-white p-3.5">
              <div className="border-b border-slate-200 pb-2">
                <div className="grid grid-cols-2 gap-1.5 rounded-lg bg-slate-50 p-0.5">
                  <Link
                    href={`/sign-in?${authLinkQuery}`}
                    className="rounded-lg px-2.5 py-2 text-center text-xs font-semibold text-slate-500 hover:text-slate-700"
                  >
                    Login
                  </Link>
                  <div className="rounded-lg bg-[#2b5b90] px-2.5 py-2 text-center text-xs font-semibold text-white shadow-sm">
                    Sign Up
                  </div>
                </div>
              </div>

              <div className="mt-4 text-center">
                <h2 className="text-xl font-bold text-slate-900 mx-auto max-w-sm leading-tight">Create {roleLabel} Account</h2>
                <p className="mt-1.5 text-xs text-slate-500 max-w-md mx-auto leading-relaxed">Complete 3 simple steps</p>

                <div className="mt-4 flex items-center justify-center gap-3">
                  {steps.map((step) => (
                    <div key={step.id} className="flex items-center gap-1.5">
                      <div className="flex flex-col items-center gap-1 text-center">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shadow-sm ${
                            step.active
                              ? "bg-[#2b5b90] text-white"
                              : step.completed
                              ? "bg-emerald-500 text-white"
                              : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          {step.id}
                        </div>
                        <span className={`text-xs font-medium ${step.active ? "text-slate-900" : step.completed ? "text-emerald-600" : "text-slate-400"}`}>
                          {step.label}
                        </span>
                      </div>
                      {step.id < 3 ? <div className="h-px w-10 flex-shrink-0 bg-slate-200" /> : null}
                    </div>
                  ))}
                </div>
              </div>

              {currentStep === 1 ? (
                <div className="mt-5 grid grid-cols-1 gap-2.5">
                  <label className="space-y-1 text-left">
                    <span className="text-xs font-semibold text-slate-700 block mb-1 leading-tight">Full Name *</span>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      placeholder="Full name"
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-2.5 text-sm text-left text-slate-900 outline-none"
                      required
                    />
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <label className="space-y-1">
                      <span className="text-xs font-semibold text-slate-700 block mb-1">Email *</span>
                      <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="email@example.com"
                        className="w-full rounded-lg border border-slate-200 px-2.5 py-2.5 text-sm text-slate-900 outline-none"
                        required
                      />
                    </label>

                    <label className="space-y-1">
                      <span className="text-xs font-semibold text-slate-700 block mb-1">Password *</span>
                      <input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Password"
                        className="w-full rounded-lg border border-slate-200 px-2.5 py-2.5 text-sm text-slate-900 outline-none"
                        required
                      />
                    </label>
                  </div>

                  <label className="space-y-1">
                    <span className="text-xs font-semibold text-slate-700 block mb-1">Address *</span>
                    <input
                      type="text"
                      value={address}
                      onChange={(event) => setAddress(event.target.value)}
                      placeholder="Barangay 634, Street, City"
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-2.5 text-sm text-slate-900 outline-none"
                      required
                    />
                  </label>

                  <div className={`text-xs font-medium text-justify leading-relaxed ${isBarangayVerified ? "text-emerald-600" : "text-slate-500"}`}>
                    {isBarangayVerified ? "✓ Barangay 634 address detected in your input" : "💡 Tip: Include 'Barangay 634' in address for faster admin approval"}
                  </div>
                </div>
              ) : null}

              {currentStep === 2 ? (
                <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-xl font-bold text-slate-900 mb-3">Verify Email</h3>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={email}
                        onChange={(event) => {
                          const nextEmail = event.target.value;
                          setEmail(nextEmail);
                          setEmailVerified(false);
                          setHasPreparedAuthUser(false);
                          setPreparedEmail(null);
                          setOtpExpiresAt(null);
                        }}
                        placeholder="your@email.com"
                        className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-white"
                      />
                      <button
                        type="button"
                        onClick={handleSendCode}
                        disabled={isSendingCode}
                        className="px-4 py-2.5 rounded-xl bg-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-300 disabled:opacity-50"
                      >
                        {isSendingCode ? "..." : "Send"}
                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={otpInput.join("")}
                      onChange={(event) => {
                        const value = event.target.value.replace(/\D/g, "").slice(0, 6);
                        const digits = value.split("");
                        while (digits.length < 6) digits.push("");
                        digits.slice(0, 6).forEach((digit, index) => {
                          if (digit !== otpInput[index]) handleOtpChange(index, digit);
                        });
                      }}
                      maxLength={6}
                      inputMode="numeric"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-white"
                    />

                    <div className="text-xs leading-relaxed">
                      <p className={`font-semibold ${otpExpiresAt ? "text-red-500" : "text-slate-500"}`}>
                        {otpExpiresAt ? `Code expires: ${countdownLabel}` : "Request verification code first"}
                      </p>
                      <button 
                        type="button" 
                        onClick={handleSendCode} 
                        className="text-blue-600 font-semibold underline hover:text-blue-700"
                      >
                        Resend code
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              {currentStep === 3 ? (
                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-slate-900">ID Upload</h3>
                    <span className="px-2 py-1 rounded-full bg-blue-100 text-xs font-semibold text-blue-800">Required</span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-xs font-semibold text-slate-700 mb-1 block">Front *</span>
                      <div className="rounded-xl border-2 border-dashed border-slate-300 p-3 text-center hover:border-blue-400 transition-colors cursor-pointer">
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(event) => handleUpload("front", event.target.files?.[0] ?? null)}
                          className="hidden"
                        />
                        <div className="flex flex-col items-center gap-1 min-h-20 justify-center">
                          <CreditCard className="h-5 w-5 text-slate-400" />
                          <span className="text-xs font-medium text-slate-700 whitespace-nowrap">
                            {isUploadingFrontId ? "..." : uploadedFrontId?.fileName || frontIdFile?.name || "Front ID"}
                          </span>
                          <span className="text-xs text-slate-400">JPG/PDF</span>
                        </div>
                      </div>
                    </label>

                    <label className="block">
                      <span className="text-xs font-semibold text-slate-700 mb-1 block">Back *</span>
                      <div className="rounded-xl border-2 border-dashed border-slate-300 p-3 text-center hover:border-blue-400 transition-colors cursor-pointer">
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(event) => handleUpload("back", event.target.files?.[0] ?? null)}
                          className="hidden"
                        />
                        <div className="flex flex-col items-center gap-1 min-h-20 justify-center">
                          <IdCard className="h-5 w-5 text-slate-400" />
                          <span className="text-xs font-medium text-slate-700 whitespace-nowrap">
                            {isUploadingBackId ? "..." : uploadedBackId?.fileName || backIdFile?.name || "Back ID"}
                          </span>
                          <span className="text-xs text-slate-400">JPG/PDF</span>
                        </div>
                      </div>
                    </label>

                    {isEmployer && (
                      <label className="block">
                        <span className="text-xs font-semibold text-slate-700 mb-1 block">Business Permit *</span>
                        <div className="rounded-xl border-2 border-dashed border-slate-300 p-3 text-center hover:border-blue-400 transition-colors cursor-pointer">
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(event) => handleUpload("permit", event.target.files?.[0] ?? null)}
                            className="hidden"
                          />
                          <div className="flex flex-col items-center gap-1 min-h-20 justify-center">
                            <UploadCloud className="h-5 w-5 text-slate-400" />
                            <span className="text-xs font-medium text-slate-700 whitespace-nowrap">
                              {isUploadingBusinessPermit ? "..." : uploadedBusinessPermit?.fileName || businessPermitFile?.name || "Business Permit"}
                            </span>
                            <span className="text-xs text-slate-400">JPG/PDF</span>
                          </div>
                        </div>
                      </label>
                    )}
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border">
                    <div className="flex items-center gap-2 text-xs mb-1">
                      <UploadCloud className="h-3 w-3 text-slate-400" />
                      <span className="font-semibold text-slate-900">OCR Preview</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed max-h-16 overflow-auto">{ocrResult}</p>
                  </div>

                  {uploadReady && (
                    <div className="p-2 bg-emerald-50 border rounded-lg text-xs text-emerald-800 font-medium text-center">
                      ✓ Both IDs uploaded - ready to complete!
                    </div>
                  )}
                </div>
              ) : null}

              {otpStatusMessage && (
                <div className="mt-4 p-3 rounded-xl bg-blue-50 border text-xs text-blue-700">{otpStatusMessage}</div>
              )}
              {errorMessage && (
                <div className="mt-4 p-3 rounded-xl bg-red-50 border text-xs text-red-700">{errorMessage}</div>
              )}
              {successMessage && (
                <div className="mt-4 p-3 rounded-xl bg-emerald-50 border flex items-start gap-2 text-xs text-emerald-700">
                  <BadgeCheck className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  {successMessage}
                </div>
              )}

              <div className="mt-6 flex gap-3">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1) as Step)}
                    className="flex-1 rounded-xl bg-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-400"
                  >
                    Back
                  </button>
                )}

                {currentStep === 1 ? (
                  <button
                    type="button"
                    onClick={handleNextFromInfo}
                    className="flex-1 rounded-xl bg-[#2b5b90] px-4 py-3 text-sm font-semibold text-white hover:bg-[#234d78]"
                  >
                    Next
                  </button>
                ) : currentStep === 2 ? (
                  <button
                    type="button"
                    onClick={handleVerifyEmail}
                    disabled={isVerifyingEmail}
                    className="flex-1 rounded-xl bg-[#2b5b90] px-4 py-3 text-sm font-semibold text-white hover:bg-[#234d78] disabled:opacity-50"
                  >
                    {isVerifyingEmail ? "..." : "Verify"}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isSubmitting || !uploadReady}
                    onClick={() => void handleSubmit()}
                    className="flex-1 rounded-xl bg-[#2b5b90] px-4 py-3 text-sm font-semibold text-white hover:bg-[#234d78] disabled:opacity-50"
                  >
                    {isSubmitting ? "..." : uploadReady ? "Complete Sign Up" : "Upload IDs"}
                  </button>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(90,148,199,0.55),_transparent_34%),linear-gradient(180deg,#24598a_0%,#1d4d79_38%,#173d65_100%)] px-4 py-8">
          <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center justify-center">
            <div className="w-full max-w-xl rounded-[2rem] bg-white p-8 text-center shadow-[0_26px_70px_rgba(8,23,43,0.35)]">
              <h1 className="text-2xl font-bold text-slate-900">Loading sign up...</h1>
              <p className="mt-2 text-sm text-slate-500">Preparing the registration flow.</p>
            </div>
          </div>
        </div>
      }
    >
      <SignUpPageContent />
    </Suspense>
  );
}
