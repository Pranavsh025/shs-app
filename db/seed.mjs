// Seeds the database with the sample data from the original coursework.
// Run with: npm run db:seed   (needs DATABASE_URL in .env.local)
//
// NOTE: the original report's `login` table used USER_ID values like
// 'bikram'/'aditya' while `user_farmer` used numeric ids '1'/'2'/'3' -
// they never actually referenced each other. Here login.user_id is
// re-seeded to match user_farmer.user_id so a logged-in user maps to
// a real farmer profile. Demo passwords are shown in the README.

import "dotenv/config";
import pg from "pg";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("localhost") ? false : { rejectUnauthorized: false },
});

async function run() {
  const client = await pool.connect();
  try {
    console.log("Seeding database...");

    // --- login + user_farmer -------------------------------------------
    const farmers = [
      { id: "1", name: "Bikram", password: "bikram123", phone: "9479494341", region: "Japan", residence: "Fertt", land: 45.0, farming: "organic" },
      { id: "2", name: "Vishal", password: "vishal123", phone: "8989897890", region: "Jabalpur", residence: "Jodhpur", land: 456.0, farming: "wetland" },
      { id: "3", name: "Aaditya", password: "aaditya123", phone: "8989894407", region: "Chennai", residence: "Jabalpur", land: 500.0, farming: "step" },
    ];

    for (const f of farmers) {
      const hash = await bcrypt.hash(f.password, 10);
      await client.query(
        `INSERT INTO login (user_id, password) VALUES ($1, $2)
         ON CONFLICT (user_id) DO UPDATE SET password = EXCLUDED.password`,
        [f.id, hash]
      );
      await client.query(
        `INSERT INTO user_farmer (user_id, name, phone_no, region, residence, plantation_land, type_of_farming)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (user_id) DO UPDATE SET
           name = EXCLUDED.name, phone_no = EXCLUDED.phone_no, region = EXCLUDED.region,
           residence = EXCLUDED.residence, plantation_land = EXCLUDED.plantation_land,
           type_of_farming = EXCLUDED.type_of_farming`,
        [f.id, f.name, f.phone, f.region, f.residence, f.land, f.farming]
      );
    }

    // --- climate ----------------------------------------------------------
    const climate = [
      ["ALPINE", 19.5, "CHERNOZEM", 500],
      ["DRY", 10.5, "DESERT", 230.5],
      ["HOT_HUMID", 25.2, "FERRALLITIC", 350],
      ["MILD_HUMID", 18.3, "GLEY", 300],
    ];
    for (const [zone, rain, soil, sea] of climate) {
      await client.query(
        `INSERT INTO climate (climate_zone, annual_rainfall, soil_cond, sea_level) VALUES ($1,$2,$3,$4)
         ON CONFLICT (climate_zone) DO NOTHING`,
        [zone, rain, soil, sea]
      );
    }

    // --- crops_vegetable ----------------------------------------------------
    const breeds = [
      ["12A", "KHARIF", "Paddy"],
      ["1A", "KHARIF", "Paddy"],
      ["1N", "MONSOON", "BT Bengal Gram"],
      ["1Z", "KHARIF", "Bajra"],
      ["21B", "KHARIF", "Rice"],
      ["23C", "RABI", "Wheat"],
      ["2B", "MONSOON", "Watermelon"],
      ["2C", "KHARIF", "Peanut"],
      ["2X", "RABI", "Wheat"],
      ["3AM", "MONSOON", "Cucumber"],
      ["3W", "KHARIF", "Rice"],
      ["4F", "RABI", "Mustard"],
      ["4T", "KHARIF", "Rice"],
      ["6T", "RABI", "Sugarcane"],
      ["7Y", "MONSOON", "Cauliflower"],
      ["8B", "MONSOON", "Cucumber"],
    ];
    for (const [id, season, name] of breeds) {
      await client.query(
        `INSERT INTO crops_vegetable (breed_id, season, name) VALUES ($1,$2,$3)
         ON CONFLICT (breed_id) DO NOTHING`,
        [id, season, name]
      );
    }

    // --- crops_climate --------------------------------------------------
    const cropsClimate = [
      ["ALPINE", "12A"], ["DRY", "12A"], ["DRY", "1A"], ["ALPINE", "1N"],
      ["MILD_HUMID", "1Z"], ["HOT_HUMID", "21B"], ["DRY", "2X"], ["HOT_HUMID", "2X"],
      ["MILD_HUMID", "3AM"], ["HOT_HUMID", "3W"], ["MILD_HUMID", "4F"],
    ];
    for (const [zone, breed] of cropsClimate) {
      await client.query(
        `INSERT INTO crops_climate (climate_zone, br_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
        [zone, breed]
      );
    }

    // --- biofertilizers ---------------------------------------------------
    const bio = [
      ["CHAMBAL", "POTASH", 34, 12, 6, 7, 930],
      ["CHAMBAL", "UREA", 4, 12, 1, 57, 870],
      ["IFFCO", "DOUBLENP", 2, 12, 3.5, 47, 850],
      ["IFFCO", "POTASH", 34, 12, 6, 7, 950],
      ["IFFCO", "SINGLENP", 0, 12, 3.5, 27, 750],
      ["IFFCO", "UREA", 4, 12, 1, 57, 900],
      ["KRISCHCO", "DOUBLENP", 2, 12, 3.5, 47, 900],
      ["KRISCHCO", "SINGLENP", 1, 10, 4, 50, 870],
      ["KRISCHCO", "UREA", 4, 12, 1, 57, 900],
    ];
    for (const [co, fert, k, p, s, n, cost] of bio) {
      await client.query(
        `INSERT INTO biofertilizers (company_nm, fertilizer_nm, potassium, phosphorus, sulphur, nitrogen, cost)
         VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING`,
        [co, fert, k, p, s, n, cost]
      );
    }

    // --- crop_fertilizers ---------------------------------------------------
    const cropFert = [
      ["12A", "IFFCO", "POTASH"], ["1N", "CHAMBAL", "POTASH"], ["1N", "IFFCO", "POTASH"],
      ["23C", "CHAMBAL", "POTASH"], ["23C", "IFFCO", "POTASH"], ["4T", "CHAMBAL", "POTASH"],
      ["4T", "IFFCO", "POTASH"], ["8B", "CHAMBAL", "POTASH"], ["8B", "IFFCO", "POTASH"],
      ["1A", "CHAMBAL", "UREA"], ["1A", "IFFCO", "UREA"], ["1A", "KRISCHCO", "UREA"],
      ["2B", "CHAMBAL", "UREA"], ["2B", "IFFCO", "UREA"], ["2B", "KRISCHCO", "UREA"],
      ["7Y", "CHAMBAL", "UREA"], ["7Y", "IFFCO", "UREA"], ["7Y", "KRISCHCO", "UREA"],
      ["21B", "IFFCO", "DOUBLENP"], ["21B", "KRISCHCO", "DOUBLENP"],
      ["3AM", "IFFCO", "DOUBLENP"], ["3AM", "KRISCHCO", "DOUBLENP"],
      ["3W", "IFFCO", "DOUBLENP"], ["3W", "KRISCHCO", "DOUBLENP"],
      ["1Z", "IFFCO", "SINGLENP"], ["1Z", "KRISCHCO", "SINGLENP"],
      ["2X", "IFFCO", "SINGLENP"], ["2X", "KRISCHCO", "SINGLENP"],
      ["4F", "IFFCO", "SINGLENP"], ["4F", "KRISCHCO", "SINGLENP"],
    ];
    for (const [breed, co, fert] of cropFert) {
      await client.query(
        `INSERT INTO crop_fertilizers (breed_id, company_nm, fertilizer_nm) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
        [breed, co, fert]
      );
    }

    // --- herbs ---------------------------------------------------------
    const herbs = [
      ["assurell", 200, 100, 2000], ["clethodim", 200, 60, 4000], ["clodinafop", 200, 200, 3000],
      ["dakota", 200, 50, 5000], ["fargo", 200, 100, 1800], ["hoelon", 200, 80, 1600],
      ["poast", 200, 150, 2500], ["prowl", 200, 100, 3000], ["puma", 200, 75, 1000],
      ["treflan", 200, 125, 2000],
    ];
    for (const [name, land, qty, price] of herbs) {
      await client.query(
        `INSERT INTO herbs (herbicide, land_amount, quantity, price) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING`,
        [name, land, qty, price]
      );
    }

    // --- herbs_t1 --------------------------------------------------------
    const herbsT1 = [
      ["12A", "assurell"], ["6T", "assurell"], ["1A", "clethodim"], ["1N", "clodinafop"],
      ["7Y", "clodinafop"], ["1Z", "dakota"], ["21B", "dakota"], ["23C", "fargo"],
      ["2B", "fargo"], ["2C", "hoelon"], ["2X", "poast"], ["4T", "poast"],
      ["3AM", "puma"], ["8B", "puma"], ["3W", "treflan"], ["4F", "treflan"],
    ];
    for (const [breed, herb] of herbsT1) {
      await client.query(
        `INSERT INTO herbs_t1 (br_id, herbicide) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
        [breed, herb]
      );
    }

    // --- herbs_t2 --------------------------------------------------------
    const herbsT2 = [
      ["assurell", "Wild Oats, Downy Brome, Green Foxtail"],
      ["clethodim", "Grasses"],
      ["clodinafop", "Wild Oats, Downy Brome, Green Foxtail"],
      ["dakota", "Wild Oats, Green Foxtail"],
      ["fargo", "Grass and Broadleaf Weeds"],
      ["hoelon", "Grass and Broadleaf Weeds"],
      ["poast", "Wild Oats"],
      ["prowl", "Downy Brome"],
      ["puma", "Wild Oats, Downy Brome"],
      ["treflan", "Grass and Broadleaf Weeds"],
    ];
    for (const [herb, targets] of herbsT2) {
      await client.query(
        `INSERT INTO herbs_t2 (herbicide, herbs) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
        [herb, targets]
      );
    }

    // --- market (inserted one by one so the "sub < open" trigger runs cleanly) --
    const market = [
      ["12A", 234.50, 350.45, 1300.34, 1200.45],
      ["1A", 345.45, 434.45, 2300.45, 2100.34],
      ["2X", 350.00, 445.00, 2000.00, 1200.00],
      ["3W", 453.12, 531.23, 3400.45, 2309.34],
    ];
    for (const [breed, sub, open, imp, exp] of market) {
      await client.query(
        `INSERT INTO market (breed_id, govt_sub_price, open_market_price, govt_import, govt_export)
         VALUES ($1,$2,$3,$4,$5) ON CONFLICT (breed_id) DO NOTHING`,
        [breed, sub, open, imp, exp]
      );
    }

    // --- biopesticides -----------------------------------------------------
    const pesticides = [
      ["Algicides", 200, 50, 999.99], ["Avicides", 200, 50, 999.99],
      ["Bactericides", 200, 80, 999.99], ["Fungicides", 200, 70, 999.99],
      ["Insecticides", 200, 70, 999.99], ["Rodenticides", 200, 75, 999.99],
      ["Virucides", 200, 60, 999.99],
    ];
    for (const [name, land, qty, price] of pesticides) {
      await client.query(
        `INSERT INTO biopesticides (pesticides, land_amount, quantity, price) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING`,
        [name, land, qty, price]
      );
    }

    console.log("Done. Demo logins: 1/bikram123, 2/vishal123, 3/aaditya123");
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
