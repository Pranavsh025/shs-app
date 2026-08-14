import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";

type Farmer = {
  user_id: string;
  name: string;
  phone_no: string;
  region: string;
  residence: string;
  plantation_land: string;
  type_of_farming: string;
};

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const rows = await query<Farmer>(
    "SELECT * FROM user_farmer WHERE user_id = $1",
    [session.userId]
  );
  const farmer = rows[0];

  const recommended = await query<{ climate_zone: string; breed_id: string; name: string }>(
    `SELECT cc.climate_zone, cv.breed_id, cv.name
     FROM crops_climate cc
     JOIN crops_vegetable cv ON cv.breed_id = cc.br_id
     ORDER BY cc.climate_zone
     LIMIT 6`
  );

  return (
    <div className="max-w-5xl mx-auto px-5 py-14">
      <p className="breed-tag text-xs uppercase tracking-widest text-clay mb-2">
        Farmer dashboard
      </p>
      <h1 className="font-display text-3xl mb-8">
        Welcome back, {farmer?.name ?? session.name}
      </h1>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-card border border-ink/10 p-6">
          <h2 className="font-display text-xl text-moss-dark mb-4">Your profile</h2>
          {farmer ? (
            <dl className="text-sm space-y-2.5">
              <Row label="Region" value={farmer.region} />
              <Row label="Residence" value={farmer.residence} />
              <Row
                label="Plantation land"
                value={`${Number(farmer.plantation_land).toLocaleString()} acres`}
              />
              <Row label="Farming type" value={farmer.type_of_farming} />
              <Row label="Phone" value={farmer.phone_no} />
            </dl>
          ) : (
            <p className="text-ink/60 text-sm">No farmer profile on file for this account.</p>
          )}
        </div>

        <div className="rounded-2xl bg-card border border-ink/10 p-6">
          <h2 className="font-display text-xl text-moss-dark mb-4">
            Quick links
          </h2>
          <ul className="space-y-3 text-sm">
            <li>
              <Link href="/crops" className="text-moss hover:text-moss-dark underline underline-offset-4">
                Browse crop breeds by climate zone
              </Link>
            </li>
            <li>
              <Link href="/market" className="text-moss hover:text-moss-dark underline underline-offset-4">
                Compare government vs. open market prices
              </Link>
            </li>
            <li>
              <Link href="/biopesticides" className="text-moss hover:text-moss-dark underline underline-offset-4">
                Biopesticide catalog
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="font-display text-xl text-moss-dark mb-4">
          A few breeds to look at
        </h2>
        <div className="flex flex-wrap gap-2">
          {recommended.map((r) => (
            <Link
              key={r.breed_id}
              href={`/crops/${r.breed_id}`}
              className="breed-tag text-xs bg-moss/10 text-moss-dark px-3 py-1.5 rounded-lg hover:bg-moss/20 transition-colors"
            >
              {r.breed_id} · {r.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-ink/5 pb-2">
      <dt className="text-ink/50">{label}</dt>
      <dd className="font-medium text-ink">{value}</dd>
    </div>
  );
}
