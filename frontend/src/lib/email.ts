import { Resend } from "resend";

const resend = new Resend(process.env.EMAIL_API_KEY || "re_mock_key");

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!process.env.EMAIL_API_KEY) {
    console.log(`[MOCK EMAIL to ${to}] Subject: ${subject}`);
    console.log(html);
    try {
      const fs = await import("fs");
      const path = await import("path");
      const logPath = path.join(process.cwd(), "mock-emails.txt");
      const entry = `\n========================================\n[${new Date().toISOString()}]\nTo: ${to}\nSubject: ${subject}\nHTML Content:\n${html}\n========================================\n`;
      fs.appendFileSync(logPath, entry, "utf8");
    } catch (e) {
      console.error("Failed to write mock email to file:", e);
    }
    return { success: true };
  }

  try {
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error };
  }
}

export function getOTPVerificationEmailHtml(otpCode: string) {
  return `
    <div style="background-color: var(--c-bg); padding: 40px; font-family: sans-serif; color: #fff; text-align: center;">
      <h1 style="color: #fff; margin-bottom: 20px; font-family: 'Chakra Petch', sans-serif;">Caliber</h1>
      <p style="font-size: 16px; color: #a1a1aa; margin-bottom: 30px;">Verify your account to join the network.</p>
      <div style="background-color: #0d131f; padding: 20px; border-radius: 8px; border: 1px solid #1f2937; display: inline-block;">
        <h2 style="color: #06b6d4; font-size: 32px; letter-spacing: 4px; margin: 0;">${otpCode}</h2>
      </div>
      <p style="font-size: 14px; color: #71717a; margin-top: 30px;">This code expires in 15 minutes.</p>
    </div>
  `;
}

export function getPasswordResetEmailHtml(resetLink: string) {
  return `
    <div style="background-color: var(--c-bg); padding: 40px; font-family: sans-serif; color: #fff; text-align: center;">
      <h1 style="color: #fff; margin-bottom: 20px; font-family: 'Chakra Petch', sans-serif;">Caliber</h1>
      <p style="font-size: 16px; color: #a1a1aa; margin-bottom: 30px;">We received a request to reset your password.</p>
      <a href="${resetLink}" style="background-color: #06b6d4; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Reset Password</a>
      <p style="font-size: 14px; color: #71717a; margin-top: 30px;">This link expires in 15 minutes.</p>
    </div>
  `;
}
