// lib/email/basic.ts
// Beautiful HTML email templates for Rime Couture
// Uses nodemailer with Gmail SMTP

import { createTransport } from "nodemailer";

// SMTP configuration from environment
const transport = createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "465", 10),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const DEFAULT_APP_URL = "http://localhost:3000";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL;

const MAIL_FROM =
  process.env.MAIL_FROM ||
  (process.env.SMTP_USER ? `Rime Couture <${process.env.SMTP_USER}>` : "Rime Couture <no-reply@localhost>");

// Brand colors
const BRAND = {
  primary: "#789A99",
  pink: "#FF6B9D",
  background: "#FFF5FA",
  text: "#2D2D2D",
  muted: "#666666",
};

/**
 * Generate beautiful HTML email template
 */
function generateEmailHTML(options: {
  title: string;
  preheader: string;
  heading: string;
  body: string;
  code?: string;
  buttonText?: string;
  buttonUrl?: string;
  footer?: string;
}): string {
  const { title, preheader, heading, body, code, buttonText, buttonUrl, footer } = options;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${BRAND.background}; font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <!-- Preheader text (hidden) -->
  <div style="display: none; max-height: 0; overflow: hidden;">
    ${preheader}
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>
  
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: ${BRAND.background};">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #ffffff; border-radius: 24px; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Header with Logo -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid #f0f0f0;">
              <div style="display: inline-flex; align-items: center; gap: 12px;">
                <div style="width: 44px; height: 44px; background: linear-gradient(135deg, ${BRAND.pink}22, ${BRAND.primary}22); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                  <span style="font-size: 24px;">✨</span>
                </div>
                <span style="font-size: 28px; font-weight: 700; color: ${BRAND.primary}; letter-spacing: -0.5px;">Rime Couture</span>
              </div>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              <h1 style="margin: 0 0 16px; font-size: 26px; font-weight: 700; color: ${BRAND.text}; text-align: center; line-height: 1.3;">
                ${heading}
              </h1>
              <p style="margin: 0 0 32px; font-size: 15px; color: ${BRAND.muted}; text-align: center; line-height: 1.6;">
                ${body}
              </p>
              
              ${code ? `
              <!-- OTP Code Box -->
              <div style="background: linear-gradient(135deg, ${BRAND.background}, #fff); border: 2px dashed ${BRAND.primary}44; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 32px;">
                <p style="margin: 0 0 8px; font-size: 12px; font-weight: 600; color: ${BRAND.muted}; text-transform: uppercase; letter-spacing: 1px;">
                  Your verification code
                </p>
                <div style="font-size: 42px; font-weight: 700; color: ${BRAND.primary}; letter-spacing: 12px; font-family: 'Monaco', 'Consolas', monospace;">
                  ${code}
                </div>
                <p style="margin: 12px 0 0; font-size: 13px; color: ${BRAND.muted};">
                  Valid for <strong style="color: ${BRAND.pink};">10 minutes</strong>
                </p>
              </div>
              ` : ""}
              
              ${buttonText && buttonUrl ? `
              <!-- CTA Button -->
              <div style="text-align: center; margin-bottom: 32px;">
                <a href="${buttonUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primary}dd); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 12px; box-shadow: 0 4px 16px ${BRAND.primary}40;">
                  ${buttonText}
                </a>
              </div>
              ` : ""}
              
              <!-- Security Notice -->
              <div style="background-color: #f8f9fa; border-radius: 12px; padding: 16px; margin-top: 24px;">
                <p style="margin: 0; font-size: 13px; color: ${BRAND.muted}; text-align: center;">
                  🔒 If you didn't request this, you can safely ignore this email.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #fafafa; border-radius: 0 0 24px 24px; border-top: 1px solid #f0f0f0;">
              <p style="margin: 0 0 8px; font-size: 13px; color: ${BRAND.muted}; text-align: center;">
                ${footer || "Made with 💕 by Rime Couture"}
              </p>
              <p style="margin: 0; font-size: 12px; color: #999999; text-align: center;">
                © ${new Date().getFullYear()} Rime Couture. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text version of email
 */
function generateEmailText(options: {
  heading: string;
  body: string;
  code?: string;
}): string {
  const { heading, body, code } = options;
  
  let text = `${heading}\n\n${body}`;
  
  if (code) {
    text += `\n\nYour verification code: ${code}\n\nThis code is valid for 10 minutes.`;
  }
  
  text += `\n\n---\nRime Couture\nIf you didn't request this, please ignore this email.`;
  
  return text;
}

export type OtpPurpose = "SIGNUP" | "RESET";

/**
 * Send OTP email for signup or password reset
 */
export async function sendOtp(
  email: string,
  code: string,
  purpose: OtpPurpose
): Promise<void> {
  const isSignup = purpose === "SIGNUP";

  const subject = isSignup
    ? "✨ Welcome to Rime Couture - Verify Your Email"
    : "🔐 Reset Your Password - Rime Couture";

  const heading = isSignup
    ? "Verify Your Email"
    : "Reset Your Password";

  const body = isSignup
    ? "Thank you for joining Rime Couture! Enter the code below to complete your registration and start exploring our beautiful collection."
    : "We received a request to reset your password. Enter the code below to create a new password for your account.";

  const preheader = isSignup
    ? `Your verification code is ${code}`
    : `Your password reset code is ${code}`;

  const html = generateEmailHTML({
    title: subject,
    preheader,
    heading,
    body,
    code,
  });

  const text = generateEmailText({
    heading,
    body,
    code,
  });

  try {
    await transport.sendMail({
      from: MAIL_FROM,
      to: email,
      subject,
      text,
      html,
    });
    console.log(`[email] OTP sent to ${email} for ${purpose}`);
  } catch (error) {
    console.error("[email] Failed to send OTP:", error);
    throw new Error("Failed to send verification email");
  }
}

/**
 * Send welcome email after successful signup
 */
export async function sendWelcomeEmail(
  email: string,
  name: string
): Promise<void> {
  const html = generateEmailHTML({
    title: "Welcome to Rime Couture! 💕",
    preheader: `Welcome ${name}! Your account has been created successfully.`,
    heading: `Welcome, ${name}! 💕`,
    body: "Your account has been created successfully. Start exploring our beautiful collection of handcrafted pieces designed with love.",
    buttonText: "Start Shopping",
    buttonUrl: APP_URL,
    footer: "Happy shopping! 🛍️",
  });

  const text = generateEmailText({
    heading: `Welcome, ${name}!`,
    body: "Your account has been created successfully. Start exploring our beautiful collection.",
  });

  try {
    await transport.sendMail({
      from: MAIL_FROM,
      to: email,
      subject: "Welcome to Rime Couture! 💕",
      text,
      html,
    });
    console.log(`[email] Welcome email sent to ${email}`);
  } catch (error) {
    console.error("[email] Failed to send welcome email:", error);
    // Don't throw - welcome email is not critical
  }
}

/**
 * Send password changed notification
 */
export async function sendPasswordChangedEmail(email: string): Promise<void> {
  const html = generateEmailHTML({
    title: "Password Changed - Rime Couture",
    preheader: "Your password has been changed successfully.",
    heading: "Password Changed",
    body: "Your password has been changed successfully. If you didn't make this change, please contact our support team immediately.",
    footer: "Stay secure! 🔒",
  });

  const text = generateEmailText({
    heading: "Password Changed",
    body: "Your password has been changed successfully. If you didn't make this change, please contact support immediately.",
  });

  try {
    await transport.sendMail({
      from: MAIL_FROM,
      to: email,
      subject: "🔐 Password Changed - Rime Couture",
      text,
      html,
    });
    console.log(`[email] Password changed notification sent to ${email}`);
  } catch (error) {
    console.error("[email] Failed to send password changed email:", error);
    // Don't throw - notification is not critical
  }
}
