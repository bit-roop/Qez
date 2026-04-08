import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
const SMTP_SECURE = process.env.SMTP_SECURE === "true";
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM_EMAIL = process.env.SMTP_FROM_EMAIL;

export function isSmtpConfigured() {
  return Boolean(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS && SMTP_FROM_EMAIL);
}

export async function sendPasswordResetEmail(to: string, resetLink: string) {
  if (!isSmtpConfigured()) {
    return {
      delivered: false,
      reason: "SMTP is not configured."
    };
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });

  await transporter.sendMail({
    from: SMTP_FROM_EMAIL,
    to,
    subject: "Reset your Qez password",
    text: `Hello,

We received a request to reset the password for your Qez account.

To proceed, use the link below and choose a new password:
${resetLink}

If you did not request this, you can safely ignore this email — your account will remain unchanged.

For security reasons, this link will expire shortly.

—
Qez
Competitive quizzes, simplified`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; line-height: 1.7; color: #1c1c1c;">
        <p style="margin: 0 0 16px;">Hello,</p>
        <p style="margin: 0 0 16px;">We received a request to reset the password for your Qez account.</p>
        <p style="margin: 0 0 16px;">To proceed, click the link below and choose a new password:</p>
        <p>
          <a href="${resetLink}" style="display: inline-block; padding: 12px 18px; border-radius: 10px; background: #c2a36b; color: #0f0f0f; text-decoration: none; font-weight: 700;">
            Reset Password
          </a>
        </p>
        <p style="margin: 16px 0 8px;">If the button does not work, use this link:</p>
        <p style="margin: 0 0 16px; word-break: break-all;">${resetLink}</p>
        <p style="margin: 0 0 16px;">If you did not request this, you can safely ignore this email — your account will remain unchanged.</p>
        <p style="margin: 0 0 16px;">For security reasons, this link will expire shortly.</p>
        <p style="margin: 0;">—<br />Qez<br />Competitive quizzes, simplified</p>
      </div>
    `
  });

  return {
    delivered: true as const
  };
}

export async function sendEmailVerificationEmail(to: string, verificationLink: string) {
  if (!isSmtpConfigured()) {
    return {
      delivered: false,
      reason: "SMTP is not configured."
    };
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });

  await transporter.sendMail({
    from: SMTP_FROM_EMAIL,
    to,
    subject: "Verify your Qez email",
    text: `Hello,

Welcome to Qez.

Verify your email address by opening the link below:
${verificationLink}

If you did not create this account, you can ignore this email.

-
Qez`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.7; color: #1c1c1c;">
        <p>Hello,</p>
        <p>Welcome to Qez.</p>
        <p>Please verify your email address to activate your account.</p>
        <p>
          <a href="${verificationLink}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#ff9a53;color:#0f0f0f;text-decoration:none;font-weight:700;">
            Verify Email
          </a>
        </p>
        <p>If the button does not work, use this link:</p>
        <p style="word-break: break-all;">${verificationLink}</p>
        <p>If you did not create this account, you can ignore this email.</p>
        <p>-<br />Qez</p>
      </div>
    `
  });

  return {
    delivered: true as const
  };
}
