import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ breedId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { breedId } = await params;

  const breedRows = await query<{ breed_id: string; season: string; name: string }>(
    "SELECT breed_id, season, name FROM crops_vegetable WHERE breed_id = $1",
    [breedId]
  );
  if (breedRows.length === 0) {
    return NextResponse.json({ error: "Breed not found." }, { status: 404 });
  }

  const [climateZones, fertilizers, fertilizerCost, herbicides, herbicideCost, market, marketDiff] =
    await Promise.all([
      query<{ climate_zone: string }>(
        "SELECT climate_zone FROM crops_climate WHERE br_id = $1",
        [breedId]
      ),
      query<{ company_nm: string; fertilizer_nm: string; cost: number }>(
        `SELECT cf.company_nm, cf.fertilizer_nm, bf.cost
         FROM crop_fertilizers cf
         LEFT JOIN biofertilizers bf
           ON cf.company_nm = bf.company_nm AND cf.fertilizer_nm = bf.fertilizer_nm
         WHERE cf.breed_id = $1
         ORDER BY cf.company_nm`,
        [breedId]
      ),
      query<{ get_total_fertilizer_cost: number }>(
        "SELECT get_total_fertilizer_cost($1)",
        [breedId]
      ),
      query<{ herbicide: string; price: number; quantity: number; herbs: string | null }>(
        `SELECT h.herbicide, h.price, h.quantity, ht2.herbs
         FROM herbs_t1 ht1
         JOIN herbs h ON ht1.herbicide = h.herbicide
         LEFT JOIN herbs_t2 ht2 ON ht2.herbicide = h.herbicide
         WHERE ht1.br_id = $1
         ORDER BY h.herbicide`,
        [breedId]
      ),
      query<{ get_total_herbicide_cost: number }>(
        "SELECT get_total_herbicide_cost($1)",
        [breedId]
      ),
      query<{
        breed_id: string;
        govt_sub_price: number;
        open_market_price: number;
        govt_import: number | null;
        govt_export: number | null;
      }>(
        "SELECT breed_id, govt_sub_price, open_market_price, govt_import, govt_export FROM market WHERE breed_id = $1",
        [breedId]
      ),
      query<{ get_market_price_difference: number | null }>(
        "SELECT get_market_price_difference($1)",
        [breedId]
      ),
    ]);

  return NextResponse.json({
    breed: breedRows[0],
    climateZones: climateZones.map((c) => c.climate_zone),
    fertilizers,
    totalFertilizerCost: fertilizerCost[0]?.get_total_fertilizer_cost ?? 0,
    herbicides,
    totalHerbicideCost: herbicideCost[0]?.get_total_herbicide_cost ?? 0,
    market: market[0] ?? null,
    marketPriceDifference: marketDiff[0]?.get_market_price_difference ?? null,
  });
}
