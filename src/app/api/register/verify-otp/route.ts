import { NextRequest, NextResponse } from "next/server";
import { verifyOtp } from "@/lib/otp";

export async function POST(req: NextRequest) {
  const { email, otp } = await req.json();

  if (!email || !otp) {
    return NextResponse.json(
      { error: "Email and code are required." },
      { status: 400 }
    );
  }

  const result = await verifyOtp(email, otp);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
