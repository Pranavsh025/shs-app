"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useLanguage } from "@/components/LanguageProvider";

export default function LogoutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { t } = useLanguage();

  return (
    <button
      onClick={() =>
        startTransition(async () => {
          await fetch("/api/logout", { method: "POST" });
          router.push("/");
          router.refresh();
        })
      }
      disabled={pending}
      className="text-ink/70 hover:text-clay transition-colors disabled:opacity-50"
    >
      {pending ? t("nav.loggingOut") : t("nav.logout")}
    </button>
  );
}
