import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { breedId, newSubPrice, newOpenPrice } = await req.json();
  if (!breedId || newSubPrice == null || newOpenPrice == null) {
    return NextResponse.json({ error: "Missing fields." }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query("CALL update_market_prices($1, $2, $3)", [
      breedId,
      newSubPrice,
      newOpenPrice,
    ]);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Update failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  } finally {
    client.release();
  }
}
