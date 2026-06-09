import "server-only";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type SendEmailResult = {
  sent: boolean;
  provider?: "resend" | "smtp" | "console";
  error?: string;
};

async function sendWithResend(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    return { sent: false };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    return { sent: false, error: `Resend failed (${response.status}): ${body}` };
  }

  return { sent: true, provider: "resend" };
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const trimmedTo = input.to.trim();
  if (!trimmedTo) {
    return { sent: false, error: "Recipient email is required." };
  }

  try {
    const resendResult = await sendWithResend(input);
    if (resendResult.sent) {
      return resendResult;
    }

    if (process.env.NODE_ENV !== "production") {
      console.info("[email:dev]", {
        to: trimmedTo,
        subject: input.subject,
        preview: input.text.slice(0, 240),
      });
      return {
        sent: true,
        provider: "console",
      };
    }

    return {
      sent: false,
      error: resendResult.error || "Email provider is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL.",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send email.";
    return { sent: false, error: message };
  }
}
