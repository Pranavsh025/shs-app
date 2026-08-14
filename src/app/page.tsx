import Link from "next/link";
import { query } from "@/lib/db";
import { getLang } from "@/lib/lang-server";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function Home() {
  const lang = await getLang();

  const [climateCount, breedCount, farmerCount] = await Promise.all([
    query<{ count: string }>("SELECT COUNT(*) FROM climate"),
    query<{ count: string }>("SELECT COUNT(*) FROM crops_vegetable"),
    query<{ count: string }>("SELECT COUNT(*) FROM user_farmer"),
  ]);

  const zones = await query<{
    climate_zone: string;
    annual_rainfall: string;
    soil_cond: string;
    breeds: string;
  }>(`
    SELECT c.climate_zone, c.annual_rainfall, c.soil_cond,
           COALESCE(STRING_AGG(cc.br_id, ', ' ORDER BY cc.br_id), '—') AS breeds
    FROM climate c
    LEFT JOIN crops_climate cc ON cc.climate_zone = c.climate_zone
    GROUP BY c.climate_zone, c.annual_rainfall, c.soil_cond
    ORDER BY c.climate_zone
  `);

  return (
    <div>
      <section className="furrows border-b border-ink/10">
        <div className="max-w-6xl mx-auto px-5 py-20 md:py-28">
          <h1 className="font-display text-4xl md:text-6xl leading-[1.05] text-ink max-w-3xl">
            {t(lang, "home.titlePre")}{" "}
            <em className="italic text-moss">{t(lang, "home.titleEm")}</em>
            {t(lang, "home.titlePost")}
          </h1>
          <p className="mt-6 max-w-xl text-ink/70 text-lg font-body">
            {t(lang, "home.subtitle")}
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/crops"
              className="rounded-full bg-moss text-cream px-6 py-3 font-medium hover:bg-moss-dark transition-colors"
            >
              {t(lang, "home.browseZones")}
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-ink/20 px-6 py-3 font-medium hover:border-moss hover:text-moss transition-colors"
            >
              {t(lang, "home.farmerLogin")}
            </Link>
          </div>

          <div className="mt-14 grid grid-cols-3 max-w-md gap-6 breed-tag">
            <Stat value={climateCount[0]?.count} label={t(lang, "home.statClimateZones")} />
            <Stat value={breedCount[0]?.count} label={t(lang, "home.statCropBreeds")} />
            <Stat value={farmerCount[0]?.count} label={t(lang, "home.statFarmers")} />
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 py-16">
        <h2 className="font-display text-2xl text-ink mb-2">{t(lang, "home.zonesHeading")}</h2>
        <p className="text-ink/60 mb-8 max-w-2xl">{t(lang, "home.zonesSubheading")}</p>
        <div className="grid sm:grid-cols-2 gap-5">
          {zones.map((z) => (
            <div
              key={z.climate_zone}
              className="rounded-2xl bg-card border border-ink/10 p-6 hover:border-moss/50 transition-colors"
            >
              <div className="flex items-baseline justify-between">
                <h3 className="font-display text-xl text-moss-dark">
                  {z.climate_zone.replace("_", " ")}
                </h3>
                <span className="breed-tag text-xs text-ink/50">
                  {z.soil_cond}
                </span>
              </div>
              <p className="text-sm text-ink/60 mt-1">
                {Number(z.annual_rainfall).toFixed(1)} {t(lang, "home.rainfall")}
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {z.breeds.split(", ").map((b) => (
                  <Link
                    key={b}
                    href={`/crops/${b}`}
                    className="breed-tag text-xs bg-amber/15 text-clay px-2 py-1 rounded-md hover:bg-amber/30 transition-colors"
                  >
                    {b}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value?: string; label: string }) {
  return (
    <div>
      <div className="text-3xl text-moss-dark font-bold">{value ?? "—"}</div>
      <div className="text-xs text-ink/50 uppercase tracking-wide mt-1">
        {label}
      </div>
    </div>
  );
}
