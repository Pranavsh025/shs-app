import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { generateOtp, storeOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/mailer";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email || typeof email !== "string" || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 400 }
    );
  }

  const existing = await query<{ user_id: string }>(
    "SELECT user_id FROM user_farmer WHERE email = $1",
    [email]
  );
  if (existing.length > 0) {
    return NextResponse.json(
      { error: "An account with this email already exists. Try logging in instead." },
      { status: 409 }
    );
  }

  const otp = generateOtp();

  try {
    await storeOtp(email, otp);
    await sendOtpEmail(email, otp);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Could not send verification email.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
