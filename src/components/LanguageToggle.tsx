"use client";

import { useLanguage } from "@/components/LanguageProvider";

export default function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="flex items-center rounded-full border border-ink/20 text-xs font-medium overflow-hidden breed-tag">
      <button
        type="button"
        onClick={() => setLang("en")}
        className={`px-2.5 py-1 transition-colors ${
          lang === "en" ? "bg-moss text-cream" : "text-ink/60 hover:text-ink"
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLang("hi")}
        className={`px-2.5 py-1 transition-colors ${
          lang === "hi" ? "bg-moss text-cream" : "text-ink/60 hover:text-ink"
        }`}
      >
        हिं
      </button>
    </div>
  );
}
