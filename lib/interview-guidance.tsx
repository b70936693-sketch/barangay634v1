import { format } from "date-fns";
import { Briefcase, Calendar, CheckCircle2, ClipboardList, Clock, IdCard, MapPin, Phone, User } from "lucide-react";

export const APPLICANT_INTERVIEW_BRING = [
  { id: "valid-id", label: "Valid government ID", icon: IdCard },
  { id: "resume", label: "Printed or digital resume", icon: ClipboardList },
  { id: "clearance", label: "Barangay clearance (if available)", icon: CheckCircle2 },
  { id: "certificates", label: "Supporting certificates or work samples", icon: Briefcase },
] as const;

export const APPLICANT_INTERVIEW_PREP = [
  "Arrive 10–15 minutes before the scheduled time.",
  "Review the job post and your submitted application.",
  "Prepare 2–3 questions about the role and schedule.",
  "Wear clean, semi-formal attire suitable for the job.",
  "Bring a charged phone in case the employer needs to contact you.",
] as const;

export const EMPLOYER_INTERVIEW_PREP = [
  "Review the applicant's resume, introduction, and uploaded documents.",
  "Prepare role-specific questions about skills, availability, and shift fit.",
  "Confirm the interview room or meeting point is ready.",
  "Share the final date, time, and location with the applicant.",
] as const;

export const EMPLOYER_ASK_APPLICANT_TO_BRING = [
  "Valid government ID",
  "Updated resume",
  "Barangay clearance",
  "Any certificates relevant to the position",
] as const;

export function buildInterviewInviteMessage({
  applicantName,
  position,
  interviewDate,
  interviewTime,
  location,
}: {
  applicantName: string;
  position: string;
  interviewDate: string;
  interviewTime: string;
  location: string;
}) {
  const bringList = EMPLOYER_ASK_APPLICANT_TO_BRING.map((item) => `• ${item}`).join("\n");

  return [
    `Hello ${applicantName},`,
    "",
    `You are invited for an interview for the ${position} role.`,
    `Date: ${interviewDate}`,
    `Time: ${interviewTime}`,
    `Location: ${location}`,
    "",
    "Please bring:",
    bringList,
    "",
    "Please arrive 10–15 minutes early. Reply if you need to reschedule.",
  ].join("\n");
}

export function InterviewGuidancePanel({
  variant,
  className = "",
}: {
  variant: "employer" | "applicant";
  className?: string;
}) {
  if (variant === "employer") {
    return (
      <div className={`space-y-4 ${className}`}>
        <GuidanceBlock title="Before the interview" items={EMPLOYER_INTERVIEW_PREP} tone="blue" />
        <GuidanceBlock title="Ask the applicant to bring" items={EMPLOYER_ASK_APPLICANT_TO_BRING} tone="amber" />
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="rounded-2xl border border-cyan-200 bg-cyan-50/60 p-4">
        <p className="text-sm font-semibold text-cyan-900">What to bring</p>
        <ul className="mt-3 space-y-2">
          {APPLICANT_INTERVIEW_BRING.map(({ id, label, icon: Icon }) => (
            <li key={id} className="flex items-center gap-2 text-sm text-cyan-900/90">
              <Icon className="h-4 w-4 shrink-0 text-cyan-700" />
              <span>{label}</span>
            </li>
          ))}
        </ul>
      </div>
      <GuidanceBlock title="Before you go" items={APPLICANT_INTERVIEW_PREP} tone="neutral" />
    </div>
  );
}

function GuidanceBlock({
  title,
  items,
  tone,
}: {
  title: string;
  items: readonly string[];
  tone: "blue" | "amber" | "neutral";
}) {
  const toneClass =
    tone === "blue"
      ? "border-blue-200 bg-blue-50/60 text-blue-900"
      : tone === "amber"
        ? "border-amber-200 bg-amber-50/60 text-amber-900"
        : "border-border bg-muted/20 text-foreground";

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <p className="text-sm font-semibold">{title}</p>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-6 opacity-90">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 opacity-70" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function InterviewSummaryCard({
  applicantName,
  position,
  interviewDate,
  interviewTime,
  location,
  contact,
  contactLabel = "Contact",
  employerName,
  employerContactName,
}: {
  applicantName?: string;
  position?: string;
  interviewDate?: string | null;
  interviewTime?: string | null;
  location?: string | null;
  contact?: string | null;
  contactLabel?: string;
  employerName?: string | null;
  employerContactName?: string | null;
}) {
  const formattedDate = (() => {
    if (!interviewDate) return null;
    const parsed = new Date(interviewDate);
    return Number.isNaN(parsed.getTime()) ? interviewDate : format(parsed, "EEEE, MMMM d, yyyy");
  })();

  const formattedTime = interviewTime
    ? interviewTime.includes("M") || interviewTime.includes("m")
      ? interviewTime
      : interviewTime
    : null;

  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-cyan-50/50 p-4 space-y-3">
      {applicantName ? (
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-cyan-700" />
          <span className="font-medium text-foreground">{applicantName}</span>
          {position ? <span className="text-muted-foreground">• {position}</span> : null}
        </div>
      ) : null}
      {employerName ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Briefcase className="h-4 w-4" />
          <span>
            {employerName}
            {employerContactName ? ` • ${employerContactName}` : ""}
          </span>
        </div>
      ) : null}
      {formattedDate ? (
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-cyan-700" />
          <span className="font-semibold text-foreground">{formattedDate}</span>
        </div>
      ) : null}
      {formattedTime ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{formattedTime}</span>
        </div>
      ) : null}
      <div className="flex items-start gap-2 text-sm text-muted-foreground">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{location || "Barangay 634 Hall"}</span>
      </div>
      {contact ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Phone className="h-4 w-4" />
          <span>
            <span className="font-medium text-foreground">{contactLabel}: </span>
            {contact}
          </span>
        </div>
      ) : null}
    </div>
  );
}
