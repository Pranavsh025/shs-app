import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { userId, password } = await req.json();

  if (!userId || !password) {
    return NextResponse.json(
      { error: "User ID and password are required." },
      { status: 400 }
    );
  }

  const rows = await query<{ user_id: string; password: string }>(
    "SELECT user_id, password FROM login WHERE user_id = $1",
    [userId]
  );

  if (rows.length === 0) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const ok = await bcrypt.compare(password, rows[0].password);
  if (!ok) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const farmer = await query<{ name: string }>(
    "SELECT name FROM user_farmer WHERE user_id = $1",
    [userId]
  );

  await createSession({
    userId,
    name: farmer[0]?.name ?? userId,
  });

  return NextResponse.json({ ok: true });
}
