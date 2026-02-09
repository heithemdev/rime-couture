/**
 * Email service using nodemailer + Gmail SMTP
 * Sends OTP codes for signup verification and password reset
 */
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const MAIL_FROM = process.env.MAIL_FROM || 'Rimoucha <noreply@rimoucha.com>';

/**
 * Send a 5-digit OTP code via email
 */
export async function sendOtpEmail(
  to: string,
  code: string,
  purpose: 'SIGNUP' | 'RESET',
): Promise<void> {
  const isSignup = purpose === 'SIGNUP';
  const subject = isSignup
    ? 'Rimoucha - Verify your email'
    : 'Rimoucha - Reset your password';

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#fff0ed;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(255,77,129,0.12);">
    <tr><td style="background:linear-gradient(135deg,#ff4d81,#ff7ea5);padding:32px 24px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:28px;font-family:'Pacifico',cursive;">Rimoucha</h1>
    </td></tr>
    <tr><td style="padding:32px 24px;text-align:center;">
      <h2 style="margin:0 0 8px;color:#111;font-size:20px;">
        ${isSignup ? 'Verify your email' : 'Reset your password'}
      </h2>
      <p style="margin:0 0 24px;color:#6b6b67;font-size:15px;line-height:1.5;">
        ${isSignup
          ? 'Enter this code to complete your registration:'
          : 'Enter this code to reset your password:'}
      </p>
      <div style="display:inline-block;padding:16px 40px;background:#fff0ed;border-radius:12px;border:2px dashed #ff4d81;">
        <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#ff4d81;">${code}</span>
      </div>
      <p style="margin:20px 0 0;color:#6b6b67;font-size:13px;">
        This code expires in <strong>10 minutes</strong>.<br/>
        If you didn't request this, you can safely ignore this email.
      </p>
    </td></tr>
    <tr><td style="padding:16px 24px;text-align:center;border-top:1px solid #f0e8e5;">
      <p style="margin:0;color:#cfc5bf;font-size:12px;">© ${new Date().getFullYear()} Rimoucha. Made with ♥ in Algeria</p>
    </td></tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from: MAIL_FROM,
    to,
    subject,
    html,
  });
}
