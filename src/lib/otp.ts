import { query } from "@/lib/db";

const OTP_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function storeOtp(email: string, otp: string) {
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
  await query(
    `INSERT INTO otp_verifications (email, otp_code, expires_at, attempts)
     VALUES ($1, $2, $3, 0)
     ON CONFLICT (email) DO UPDATE SET
       otp_code = EXCLUDED.otp_code,
       expires_at = EXCLUDED.expires_at,
       attempts = 0,
       created_at = NOW()`,
    [email, otp, expiresAt]
  );
}

export async function verifyOtp(
  email: string,
  otp: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const rows = await query<{
    otp_code: string;
    expires_at: string;
    attempts: number;
  }>(
    "SELECT otp_code, expires_at, attempts FROM otp_verifications WHERE email = $1",
    [email]
  );

  if (rows.length === 0) {
    return { ok: false, error: "No verification code found for this email. Request a new one." };
  }

  const record = rows[0];

  if (new Date(record.expires_at).getTime() < Date.now()) {
    return { ok: false, error: "This code has expired. Request a new one." };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    return { ok: false, error: "Too many incorrect attempts. Request a new code." };
  }

  if (record.otp_code !== otp) {
    await query(
      "UPDATE otp_verifications SET attempts = attempts + 1 WHERE email = $1",
      [email]
    );
    return { ok: false, error: "Incorrect code." };
  }

  return { ok: true };
}

export async function clearOtp(email: string) {
  await query("DELETE FROM otp_verifications WHERE email = $1", [email]);
}
