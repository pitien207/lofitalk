import nodemailer from "nodemailer";

const {
  MAIL_HOST,
  MAIL_PORT,
  MAIL_USER,
  MAIL_PASS,
  MAIL_FROM,
  MAIL_SECURE,
} = process.env;

const transporter =
  MAIL_HOST && MAIL_PORT && MAIL_USER && MAIL_PASS
    ? nodemailer.createTransport({
        host: MAIL_HOST,
        port: Number(MAIL_PORT),
        secure: MAIL_SECURE === "true",
        auth: {
          user: MAIL_USER,
          pass: MAIL_PASS,
        },
      })
    : null;

export async function sendVerificationEmail(recipient, code) {
  if (!transporter) {
    console.warn("Email transporter not configured. Skipping email send.");
    return;
  }

  const fromAddress = MAIL_FROM || MAIL_USER;
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; line-height:1.5;">
      <p>Hi there,</p>
      <p>Your LofiTalk verification code is:</p>
      <p style="font-size: 24px; font-weight: 700; letter-spacing: 6px;">
        ${code}
      </p>
      <p>This code expires in 15 minutes. If you didn't request it, please ignore this email.</p>
      <p>— The LofiTalk Team</p>
    </div>
  `;

  await transporter.sendMail({
    from: fromAddress,
    to: recipient,
    subject: "Verify your LofiTalk account",
    text: `Your LofiTalk verification code is ${code}. It expires in 15 minutes.`,
    html: htmlBody,
  });
}

export async function sendPasswordResetEmail(recipient, code) {
  if (!transporter) {
    console.warn("Email transporter not configured. Skipping email send.");
    return;
  }

  const fromAddress = MAIL_FROM || MAIL_USER;
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; line-height:1.5;">
      <p>Hi there,</p>
      <p>We received a request to reset your LofiTalk password. Use the verification code below:</p>
      <p style="font-size: 24px; font-weight: 700; letter-spacing: 6px;">
        ${code}
      </p>
      <p>This code expires in 15 minutes. If you didn't request a reset, you can safely ignore this message.</p>
      <p>— The LofiTalk Team</p>
    </div>
  `;

  await transporter.sendMail({
    from: fromAddress,
    to: recipient,
    subject: "Reset your LofiTalk password",
    text: `Use this code to reset your password: ${code}. It expires in 15 minutes.`,
    html: htmlBody,
  });
}
