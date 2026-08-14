import { query } from "@/lib/db";
import { getLang } from "@/lib/lang-server";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function BiopesticidesPage() {
  const lang = await getLang();

  const rows = await query<{
    pesticides: string;
    land_amount: string | null;
    quantity: string | null;
    price: string;
  }>("SELECT pesticides, land_amount, quantity, price FROM biopesticides ORDER BY pesticides");

  return (
    <div className="max-w-4xl mx-auto px-5 py-14">
      <p className="breed-tag text-xs uppercase tracking-widest text-clay mb-2">
        {t(lang, "biopesticides.tag")}
      </p>
      <h1 className="font-display text-3xl mb-2">{t(lang, "biopesticides.title")}</h1>
      <p className="text-ink/60 max-w-2xl mb-10">{t(lang, "biopesticides.subtitle")}</p>

      <div className="grid sm:grid-cols-2 gap-4">
        {rows.map((r) => (
          <div
            key={r.pesticides}
            className="rounded-xl bg-card border border-ink/10 p-5 flex items-center justify-between"
          >
            <div>
              <p className="font-medium">{r.pesticides}</p>
              <p className="text-xs text-ink/50 mt-0.5">
                {r.land_amount ?? "—"} {t(lang, "biopesticides.sqUnits")} · {t(lang, "biopesticides.qty")} {r.quantity ?? "—"}
              </p>
            </div>
            <span className="breed-tag text-clay">
              ₹{Number(r.price).toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
