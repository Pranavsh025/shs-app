import Link from "next/link";
import type { SessionPayload } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

export default function NavBar({ session }: { session: SessionPayload | null }) {
  return (
    <header className="border-b border-ink/10 bg-cream/95 backdrop-blur sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        <Link href="/" className="font-display italic text-xl text-moss-dark">
          Sustainable Harvest Solutions
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link href="/crops" className="hover:text-moss transition-colors">
            Crops &amp; Climate
          </Link>
          <Link href="/market" className="hover:text-moss transition-colors">
            Market
          </Link>
          <Link href="/biopesticides" className="hover:text-moss transition-colors">
            Biopesticides
          </Link>
          {session ? (
            <>
              <Link href="/dashboard" className="hover:text-moss transition-colors">
                Dashboard
              </Link>
              <LogoutButton />
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-moss text-cream px-4 py-1.5 hover:bg-moss-dark transition-colors"
            >
              Log in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
