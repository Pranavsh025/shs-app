"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LANG_COOKIE, t as translate, type Lang } from "@/lib/i18n";

type LanguageContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (path: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export default function LanguageProvider({
  initialLang,
  children,
}: {
  initialLang: Lang;
  children: React.ReactNode;
}) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const router = useRouter();

  const setLang = useCallback(
    (next: Lang) => {
      setLangState(next);
      document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}`;
      router.refresh();
    },
    [router]
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      setLang,
      t: (path: string) => translate(lang, path),
    }),
    [lang, setLang]
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
