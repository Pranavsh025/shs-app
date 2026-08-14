"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

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
      {pending ? "Logging out…" : "Log out"}
    </button>
  );
}
