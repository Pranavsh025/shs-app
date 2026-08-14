import Link from "next/link";
import type { SessionPayload } from "@/lib/auth";
import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import LogoutButton from "@/components/LogoutButton";
import LanguageToggle from "@/components/LanguageToggle";

export default function NavBar({
  session,
  lang,
}: {
  session: SessionPayload | null;
  lang: Lang;
}) {
  return (
    <header className="border-b border-ink/10 bg-cream/95 backdrop-blur sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="font-display italic text-xl text-moss-dark shrink-0">
          Sustainable Harvest Solutions
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link href="/crops" className="hover:text-moss transition-colors">
            {t(lang, "nav.crops")}
          </Link>
          <Link href="/market" className="hover:text-moss transition-colors">
            {t(lang, "nav.market")}
          </Link>
          <Link href="/biopesticides" className="hover:text-moss transition-colors">
            {t(lang, "nav.biopesticides")}
          </Link>
          {session ? (
            <>
              <Link href="/dashboard" className="hover:text-moss transition-colors">
                {t(lang, "nav.dashboard")}
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/register" className="hover:text-moss transition-colors">
                {t(lang, "nav.register")}
              </Link>
              <Link
                href="/login"
                className="rounded-full bg-moss text-cream px-4 py-1.5 hover:bg-moss-dark transition-colors"
              >
                {t(lang, "nav.login")}
              </Link>
            </>
          )}
          <LanguageToggle />
        </nav>
      </div>
    </header>
  );
}
