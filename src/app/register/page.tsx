"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";

type Step = "email" | "otp" | "details";

const FARMING_TYPES = ["organic", "wetland", "step", "dryland", "irrigated"];

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [step, setStep] = useState<Step>("email");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phoneNo, setPhoneNo] = useState("");
  const [region, setRegion] = useState("");
  const [residence, setResidence] = useState("");
  const [plantationLand, setPlantationLand] = useState("");
  const [typeOfFarming, setTypeOfFarming] = useState(FARMING_TYPES[0]);

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/register/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("register.genericError"));
        return;
      }
      setStep("otp");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/register/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("register.genericError"));
        return;
      }
      setStep("details");
    } finally {
      setLoading(false);
    }
  }

  async function submitRegistration(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          password,
          email,
          otp,
          name,
          phoneNo,
          region,
          residence,
          plantationLand: plantationLand ? Number(plantationLand) : null,
          typeOfFarming,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("register.genericError"));
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-5 py-20">
      <p className="breed-tag text-xs uppercase tracking-widest text-clay mb-3">
        {t("register.tag")}
      </p>
      <h1 className="font-display text-3xl mb-8">{t("register.title")}</h1>

      {step === "email" && (
        <form onSubmit={sendOtp} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-ink/70 mb-1.5">
              {t("register.emailLabel")}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-ink/20 bg-card px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-moss"
              placeholder={t("register.emailPlaceholder")}
              autoComplete="email"
            />
          </div>

          {error && (
            <p className="text-clay text-sm bg-clay/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-moss text-cream py-3 font-medium hover:bg-moss-dark transition-colors disabled:opacity-60"
          >
            {loading ? t("register.sendingOtp") : t("register.sendOtp")}
          </button>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={verifyOtp} className="space-y-5">
          <p className="text-sm text-ink/60">
            {t("register.otpSentTo")} <span className="font-medium text-ink">{email}</span>.{" "}
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setOtp("");
                setError(null);
              }}
              className="text-moss hover:text-moss-dark underline underline-offset-4"
            >
              {t("register.changeEmail")}
            </button>
          </p>

          <div>
            <label className="block text-sm font-medium text-ink/70 mb-1.5">
              {t("register.otpLabel")}
            </label>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full rounded-lg border border-ink/20 bg-card px-4 py-2.5 tracking-[0.3em] text-center font-data focus:outline-none focus:ring-2 focus:ring-moss"
              placeholder={t("register.otpPlaceholder")}
              inputMode="numeric"
              required
            />
          </div>

          {error && (
            <p className="text-clay text-sm bg-clay/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-moss text-cream py-3 font-medium hover:bg-moss-dark transition-colors disabled:opacity-60"
          >
            {loading ? t("register.verifying") : t("register.verifyOtp")}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={(e) => sendOtp(e as unknown as React.FormEvent)}
            className="w-full text-center text-sm text-ink/60 hover:text-moss transition-colors"
          >
            {t("register.resendOtp")}
          </button>
        </form>
      )}

      {step === "details" && (
        <form onSubmit={submitRegistration} className="space-y-5">
          <p className="text-clay text-sm bg-clay/10 rounded-lg px-3 py-2 inline-block">
            ✓ {t("register.otpVerified")}
          </p>

          <div>
            <label className="block text-sm font-medium text-ink/70 mb-1.5">
              {t("register.userIdLabel")}
            </label>
            <input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full rounded-lg border border-ink/20 bg-card px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-moss"
              placeholder={t("register.userIdPlaceholder")}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink/70 mb-1.5">
              {t("register.passwordLabel")}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-ink/20 bg-card px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-moss"
              autoComplete="new-password"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink/70 mb-1.5">
              {t("register.nameLabel")}
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-ink/20 bg-card px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-moss"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink/70 mb-1.5">
              {t("register.phoneLabel")}
            </label>
            <input
              value={phoneNo}
              onChange={(e) => setPhoneNo(e.target.value)}
              className="w-full rounded-lg border border-ink/20 bg-card px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-moss"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink/70 mb-1.5">
                {t("register.regionLabel")}
              </label>
              <input
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full rounded-lg border border-ink/20 bg-card px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-moss"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink/70 mb-1.5">
                {t("register.residenceLabel")}
              </label>
              <input
                value={residence}
                onChange={(e) => setResidence(e.target.value)}
                className="w-full rounded-lg border border-ink/20 bg-card px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-moss"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink/70 mb-1.5">
                {t("register.landLabel")}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={plantationLand}
                onChange={(e) => setPlantationLand(e.target.value)}
                className="w-full rounded-lg border border-ink/20 bg-card px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-moss"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink/70 mb-1.5">
                {t("register.farmingTypeLabel")}
              </label>
              <select
                value={typeOfFarming}
                onChange={(e) => setTypeOfFarming(e.target.value)}
                className="w-full rounded-lg border border-ink/20 bg-card px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-moss"
              >
                {FARMING_TYPES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <p className="text-clay text-sm bg-clay/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-moss text-cream py-3 font-medium hover:bg-moss-dark transition-colors disabled:opacity-60"
          >
            {loading ? t("register.submitting") : t("register.submit")}
          </button>
        </form>
      )}

      <p className="mt-8 text-center text-sm text-ink/60">
        {t("register.haveAccount")}{" "}
        <Link href="/login" className="text-moss hover:text-moss-dark underline underline-offset-4">
          {t("register.logInInstead")}
        </Link>
      </p>
    </div>
  );
}
