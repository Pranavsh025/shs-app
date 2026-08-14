import Link from "next/link";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function MarketPage() {
  const rows = await query<{
    breed_id: string;
    name: string;
    govt_sub_price: string;
    open_market_price: string;
    govt_import: string | null;
    govt_export: string | null;
  }>(`
    SELECT m.breed_id, cv.name, m.govt_sub_price, m.open_market_price, m.govt_import, m.govt_export
    FROM market m
    JOIN crops_vegetable cv ON cv.breed_id = m.breed_id
    ORDER BY m.breed_id
  `);

  return (
    <div className="max-w-5xl mx-auto px-5 py-14">
      <p className="breed-tag text-xs uppercase tracking-widest text-clay mb-2">
        Market
      </p>
      <h1 className="font-display text-3xl mb-2">Subsidy vs. open market</h1>
      <p className="text-ink/60 max-w-2xl mb-10">
        Government subsidy price against open market price for every breed
        that has pricing on file, plus import/export reference numbers.
      </p>

      <div className="overflow-x-auto rounded-2xl border border-ink/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-moss/10 text-left text-ink/60 breed-tag text-xs uppercase">
              <th className="px-4 py-3">Breed</th>
              <th className="px-4 py-3">Subsidy price</th>
              <th className="px-4 py-3">Open market</th>
              <th className="px-4 py-3">Difference</th>
              <th className="px-4 py-3">Import ref.</th>
              <th className="px-4 py-3">Export ref.</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const diff = Number(r.open_market_price) - Number(r.govt_sub_price);
              return (
                <tr key={r.breed_id} className="border-t border-ink/10 bg-card">
                  <td className="px-4 py-3">
                    <Link
                      href={`/crops/${r.breed_id}`}
                      className="font-medium text-moss-dark hover:underline"
                    >
                      {r.name}
                    </Link>
                    <span className="breed-tag text-xs text-ink/40 ml-2">
                      {r.breed_id}
                    </span>
                  </td>
                  <td className="px-4 py-3 breed-tag">
                    ₹{Number(r.govt_sub_price).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 breed-tag">
                    ₹{Number(r.open_market_price).toFixed(2)}
                  </td>
                  <td className={`px-4 py-3 breed-tag ${diff >= 0 ? "text-moss" : "text-clay"}`}>
                    ₹{diff.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 breed-tag text-ink/60">
                    {r.govt_import != null ? `₹${Number(r.govt_import).toFixed(2)}` : "—"}
                  </td>
                  <td className="px-4 py-3 breed-tag text-ink/60">
                    {r.govt_export != null ? `₹${Number(r.govt_export).toFixed(2)}` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
