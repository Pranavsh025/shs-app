import { notFound } from "next/navigation";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getLang } from "@/lib/lang-server";
import { t } from "@/lib/i18n";
import MarketUpdateForm from "@/components/MarketUpdateForm";

export const dynamic = "force-dynamic";

export default async function BreedPage({
  params,
}: {
  params: Promise<{ breedId: string }>;
}) {
  const { breedId } = await params;
  const session = await getSession();
  const lang = await getLang();

  const breedRows = await query<{ breed_id: string; season: string; name: string }>(
    "SELECT breed_id, season, name FROM crops_vegetable WHERE breed_id = $1",
    [breedId]
  );
  if (breedRows.length === 0) notFound();
  const breed = breedRows[0];

  const [climateZones, fertilizers, fertCostRows, herbicides, herbCostRows, marketRows, diffRows] =
    await Promise.all([
      query<{ climate_zone: string }>(
        "SELECT climate_zone FROM crops_climate WHERE br_id = $1",
        [breedId]
      ),
      query<{ company_nm: string; fertilizer_nm: string; cost: string | null }>(
        `SELECT cf.company_nm, cf.fertilizer_nm, bf.cost
         FROM crop_fertilizers cf
         LEFT JOIN biofertilizers bf
           ON cf.company_nm = bf.company_nm AND cf.fertilizer_nm = bf.fertilizer_nm
         WHERE cf.breed_id = $1
         ORDER BY cf.company_nm`,
        [breedId]
      ),
      query<{ get_total_fertilizer_cost: string }>(
        "SELECT get_total_fertilizer_cost($1)",
        [breedId]
      ),
      query<{ herbicide: string; price: string; quantity: string; herbs: string | null }>(
        `SELECT h.herbicide, h.price, h.quantity, ht2.herbs
         FROM herbs_t1 ht1
         JOIN herbs h ON ht1.herbicide = h.herbicide
         LEFT JOIN herbs_t2 ht2 ON ht2.herbicide = h.herbicide
         WHERE ht1.br_id = $1
         ORDER BY h.herbicide`,
        [breedId]
      ),
      query<{ get_total_herbicide_cost: string }>(
        "SELECT get_total_herbicide_cost($1)",
        [breedId]
      ),
      query<{
        govt_sub_price: string;
        open_market_price: string;
        govt_import: string | null;
        govt_export: string | null;
      }>(
        "SELECT govt_sub_price, open_market_price, govt_import, govt_export FROM market WHERE breed_id = $1",
        [breedId]
      ),
      query<{ get_market_price_difference: string | null }>(
        "SELECT get_market_price_difference($1)",
        [breedId]
      ),
    ]);

  const market = marketRows[0] ?? null;
  const marketDiff = diffRows[0]?.get_market_price_difference;

  return (
    <div className="max-w-4xl mx-auto px-5 py-14">
      <div className="flex items-center gap-3 mb-2">
        <span className="breed-tag text-xs bg-amber/15 text-clay px-2 py-1 rounded-md">
          {breed.breed_id}
        </span>
        <span className="text-xs text-ink/50 uppercase tracking-wide">
          {breed.season}
        </span>
      </div>
      <h1 className="font-display text-4xl mb-2">{breed.name}</h1>
      <p className="text-ink/60 mb-10">
        {t(lang, "breed.grownIn")}{" "}
        {climateZones.map((c) => c.climate_zone.replace("_", " ")).join(", ") ||
          t(lang, "breed.noClimateZone")}
      </p>

      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <section className="rounded-2xl bg-card border border-ink/10 p-6">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-display text-xl text-moss-dark">{t(lang, "breed.fertilizers")}</h2>
            <span className="breed-tag text-sm text-clay">
              ₹{Number(fertCostRows[0]?.get_total_fertilizer_cost ?? 0).toLocaleString()} {t(lang, "breed.total")}
            </span>
          </div>
          {fertilizers.length === 0 ? (
            <p className="text-sm text-ink/50">{t(lang, "breed.noFertilizers")}</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {fertilizers.map((f, i) => (
                <li key={i} className="flex justify-between border-b border-ink/5 pb-2">
                  <span>
                    {f.fertilizer_nm}{" "}
                    <span className="text-ink/40">— {f.company_nm}</span>
                  </span>
                  <span className="breed-tag">
                    {f.cost != null ? `₹${Number(f.cost).toLocaleString()}` : "n/a"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl bg-card border border-ink/10 p-6">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-display text-xl text-moss-dark">{t(lang, "breed.herbicides")}</h2>
            <span className="breed-tag text-sm text-clay">
              ₹{Number(herbCostRows[0]?.get_total_herbicide_cost ?? 0).toLocaleString()} {t(lang, "breed.total")}
            </span>
          </div>
          {herbicides.length === 0 ? (
            <p className="text-sm text-ink/50">{t(lang, "breed.noHerbicides")}</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {herbicides.map((h) => (
                <li key={h.herbicide} className="border-b border-ink/5 pb-2">
                  <div className="flex justify-between">
                    <span className="capitalize">{h.herbicide}</span>
                    <span className="breed-tag">₹{Number(h.price).toLocaleString()}</span>
                  </div>
                  {h.herbs && (
                    <p className="text-xs text-ink/40 mt-0.5">{t(lang, "breed.targets")} {h.herbs}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-2xl bg-card border border-ink/10 p-6 mb-10">
        <h2 className="font-display text-xl text-moss-dark mb-4">{t(lang, "breed.marketPricing")}</h2>
        {market ? (
          <div className="grid sm:grid-cols-3 gap-6 breed-tag text-sm">
            <div>
              <p className="text-ink/50 text-xs mb-1">{t(lang, "breed.govtSubsidyPrice")}</p>
              <p className="text-lg">₹{Number(market.govt_sub_price).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-ink/50 text-xs mb-1">{t(lang, "breed.openMarketPrice")}</p>
              <p className="text-lg">₹{Number(market.open_market_price).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-ink/50 text-xs mb-1">{t(lang, "breed.priceDifference")}</p>
              <p className={`text-lg ${Number(marketDiff) >= 0 ? "text-moss" : "text-clay"}`}>
                {marketDiff != null ? `₹${Number(marketDiff).toFixed(2)}` : "—"}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-ink/50">{t(lang, "breed.noMarketData")}</p>
        )}

        {session && (
          <MarketUpdateForm
            breedId={breed.breed_id}
            currentSub={market ? Number(market.govt_sub_price) : undefined}
            currentOpen={market ? Number(market.open_market_price) : undefined}
          />
        )}
      </section>
    </div>
  );
}
