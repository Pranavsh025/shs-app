import type { Metadata } from "next";
import { Fraunces, Inter, Space_Mono } from "next/font/google";
import "./globals.css";
import { getSession } from "@/lib/auth";
import { getLang } from "@/lib/lang-server";
import { t } from "@/lib/i18n";
import NavBar from "@/components/NavBar";
import LanguageProvider from "@/components/LanguageProvider";

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const spaceMono = Space_Mono({
  variable: "--font-data",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Sustainable Harvest Solutions",
  description:
    "Climate-matched crop, fertilizer, herbicide and market data for farmers.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const lang = await getLang();

  return (
    <html
      lang={lang}
      className={`${fraunces.variable} ${inter.variable} ${spaceMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-ink">
        <LanguageProvider initialLang={lang}>
          <NavBar session={session} lang={lang} />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-ink/10 py-6 text-center text-xs text-ink/50 font-body">
            {t(lang, "footer.brand")}
          </footer>
        </LanguageProvider>
      </body>
    </html>
  );
}
