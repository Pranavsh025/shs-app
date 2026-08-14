import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query, pool } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { verifyOtp, clearOtp } from "@/lib/otp";

export async function POST(req: NextRequest) {
  const {
    userId,
    password,
    email,
    otp,
    name,
    phoneNo,
    region,
    residence,
    plantationLand,
    typeOfFarming,
  } = await req.json();

  if (
    !userId ||
    !password ||
    !email ||
    !otp ||
    !name ||
    !phoneNo ||
    !region ||
    !residence ||
    plantationLand == null ||
    !typeOfFarming
  ) {
    return NextResponse.json(
      { error: "All fields are required." },
      { status: 400 }
    );
  }

  const otpResult = await verifyOtp(email, otp);
  if (!otpResult.ok) {
    return NextResponse.json({ error: otpResult.error }, { status: 400 });
  }

  const existingUser = await query<{ user_id: string }>(
    "SELECT user_id FROM login WHERE user_id = $1",
    [userId]
  );
  if (existingUser.length > 0) {
    return NextResponse.json(
      { error: "That User ID is already taken. Choose another." },
      { status: 409 }
    );
  }

  const existingEmail = await query<{ user_id: string }>(
    "SELECT user_id FROM user_farmer WHERE email = $1",
    [email]
  );
  if (existingEmail.length > 0) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 }
    );
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const hash = await bcrypt.hash(password, 10);
    await client.query("INSERT INTO login (user_id, password) VALUES ($1, $2)", [
      userId,
      hash,
    ]);
    await client.query(
      `INSERT INTO user_farmer
         (user_id, name, email, phone_no, region, residence, plantation_land, type_of_farming)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [userId, name, email, phoneNo, region, residence, plantationLand, typeOfFarming]
    );
    await client.query("COMMIT");
  } catch (err: unknown) {
    await client.query("ROLLBACK");
    const message = err instanceof Error ? err.message : "Registration failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    client.release();
  }

  await clearOtp(email);

  await createSession({ userId, name });

  return NextResponse.json({ ok: true });
}
