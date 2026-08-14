import nodemailer from "nodemailer";

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      "Email is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS in .env.local (see .env.example)."
    );
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transporter;
}

export async function sendOtpEmail(to: string, otp: string) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  await getTransporter().sendMail({
    from: `Sustainable Harvest Solutions <${from}>`,
    to,
    subject: "Your verification code",
    text: `Your Sustainable Harvest Solutions verification code is ${otp}. It expires in 10 minutes.`,
    html: `
      <div style="font-family: sans-serif; font-size: 15px; color: #1c2117;">
        <p>Your Sustainable Harvest Solutions verification code is:</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px;">${otp}</p>
        <p style="color: #666;">This code expires in 10 minutes. If you didn't request it, you can ignore this email.</p>
      </div>
    `,
  });
}
