-- ============================================================
-- Sustainable Harvest Solutions - PostgreSQL Schema
-- Converted from the original MySQL/MariaDB DBMS coursework
-- (sql/01-05 in the uploaded project) so it can run on a
-- Vercel-friendly Postgres host (Neon / Vercel Postgres / Supabase).
--
-- Changes from the original MySQL version:
--  - DELIMITER blocks removed (not a Postgres concept)
--  - Functions/Procedures rewritten in PL/pgSQL
--  - herbs.PRICE and herbs.LAND_AMOUNT/QUANTITY are NUMERIC instead
--    of VARCHAR (the original stored numbers as text)
--  - SIGNAL SQLSTATE '45000' -> RAISE EXCEPTION
--  - login.USER_ID re-seeded to match user_farmer.USER_ID (see
--    seed.mjs) because in the original report the login table used
--    names ('bikram','aditya') while user_farmer used numeric ids
--    ('1','2','3') - they never actually joined.
-- ============================================================

-- 1) login
CREATE TABLE IF NOT EXISTS login (
  user_id  VARCHAR(45) PRIMARY KEY,
  password VARCHAR(255) NOT NULL   -- bcrypt hash
);

-- 2) user_farmer
CREATE TABLE IF NOT EXISTS user_farmer (
  user_id          VARCHAR(45) PRIMARY KEY REFERENCES login(user_id) ON DELETE CASCADE,
  name             VARCHAR(200) NOT NULL,
  phone_no         VARCHAR(20)  NOT NULL,
  region           VARCHAR(200) NOT NULL,
  residence        VARCHAR(500) NOT NULL,
  plantation_land  NUMERIC(9,4) NOT NULL,
  type_of_farming  VARCHAR(45)  NOT NULL
);

-- 3) climate
CREATE TABLE IF NOT EXISTS climate (
  climate_zone     VARCHAR(45) PRIMARY KEY,
  annual_rainfall  NUMERIC NOT NULL,
  soil_cond        VARCHAR(45) NOT NULL,
  sea_level        NUMERIC NOT NULL
);

-- 4) crops_vegetable (breed catalog) - created before crops_climate for the FK
CREATE TABLE IF NOT EXISTS crops_vegetable (
  breed_id VARCHAR(200) PRIMARY KEY,
  season   VARCHAR(200) NOT NULL,
  name     VARCHAR(450) NOT NULL
);

-- 5) crops_climate (which breeds grow in which climate zone)
CREATE TABLE IF NOT EXISTS crops_climate (
  climate_zone VARCHAR(200) NOT NULL REFERENCES climate(climate_zone) ON DELETE CASCADE,
  br_id        VARCHAR(200) NOT NULL REFERENCES crops_vegetable(breed_id) ON DELETE CASCADE,
  PRIMARY KEY (climate_zone, br_id)
);

-- 6) biofertilizers (fertilizer catalog with cost)
CREATE TABLE IF NOT EXISTS biofertilizers (
  company_nm    VARCHAR(200) NOT NULL,
  fertilizer_nm VARCHAR(200) NOT NULL,
  potassium     NUMERIC,
  phosphorus    NUMERIC,
  sulphur       NUMERIC,
  nitrogen      NUMERIC,
  cost          NUMERIC NOT NULL,
  PRIMARY KEY (company_nm, fertilizer_nm)
);

-- 7) crop_fertilizers (breed <-> fertilizer mapping)
CREATE TABLE IF NOT EXISTS crop_fertilizers (
  breed_id      VARCHAR(200) NOT NULL REFERENCES crops_vegetable(breed_id) ON DELETE CASCADE,
  company_nm    VARCHAR(200) NOT NULL,
  fertilizer_nm VARCHAR(45)  NOT NULL,
  PRIMARY KEY (breed_id, company_nm, fertilizer_nm)
);

-- 8) herbs (herbicide catalog)
CREATE TABLE IF NOT EXISTS herbs (
  herbicide   VARCHAR(45) PRIMARY KEY,
  land_amount NUMERIC,
  quantity    NUMERIC NOT NULL,
  price       NUMERIC NOT NULL
);

-- 9) herbs_t1 (breed <-> herbicide mapping)
CREATE TABLE IF NOT EXISTS herbs_t1 (
  br_id     VARCHAR(200) NOT NULL REFERENCES crops_vegetable(breed_id) ON DELETE CASCADE,
  herbicide VARCHAR(45)  NOT NULL REFERENCES herbs(herbicide) ON DELETE CASCADE,
  PRIMARY KEY (br_id, herbicide)
);

-- 10) herbs_t2 (herbicide -> targeted weeds)
CREATE TABLE IF NOT EXISTS herbs_t2 (
  herbicide VARCHAR(45) PRIMARY KEY REFERENCES herbs(herbicide) ON DELETE CASCADE,
  herbs     VARCHAR(200) NOT NULL
);

-- 11) market
CREATE TABLE IF NOT EXISTS market (
  breed_id           VARCHAR(200) PRIMARY KEY REFERENCES crops_vegetable(breed_id) ON DELETE CASCADE,
  govt_sub_price     NUMERIC(8,2) NOT NULL,
  open_market_price  NUMERIC(8,2) NOT NULL,
  govt_import        NUMERIC(8,2),
  govt_export        NUMERIC(8,2)
);

-- 12) biopesticides
CREATE TABLE IF NOT EXISTS biopesticides (
  pesticides  VARCHAR(200) PRIMARY KEY,
  land_amount NUMERIC,
  quantity    NUMERIC,
  price       NUMERIC(7,2) NOT NULL
);

-- History tables (used by triggers)
CREATE TABLE IF NOT EXISTS market_history (
  id             SERIAL PRIMARY KEY,
  breed_id       VARCHAR(200) NOT NULL,
  old_sub_price  NUMERIC(8,2),
  old_open_price NUMERIC(8,2),
  new_sub_price  NUMERIC(8,2),
  new_open_price NUMERIC(8,2),
  update_date    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crop_fertilizers_history (
  id            SERIAL PRIMARY KEY,
  breed_id      VARCHAR(200) NOT NULL,
  company_nm    VARCHAR(200) NOT NULL,
  fertilizer_nm VARCHAR(45)  NOT NULL,
  delete_date   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS herbs_history (
  id          SERIAL PRIMARY KEY,
  br_id       VARCHAR(200) NOT NULL,
  herbicide   VARCHAR(45)  NOT NULL,
  delete_date TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Functions
-- ============================================================

-- Total fertilizer cost for a breed (join crop_fertilizers -> biofertilizers)
CREATE OR REPLACE FUNCTION get_total_fertilizer_cost(p_breed_id VARCHAR)
RETURNS NUMERIC AS $$
DECLARE
  total_cost NUMERIC;
BEGIN
  SELECT SUM(bf.cost) INTO total_cost
  FROM crop_fertilizers cf
  JOIN biofertilizers bf
    ON cf.company_nm = bf.company_nm
   AND cf.fertilizer_nm = bf.fertilizer_nm
  WHERE cf.breed_id = p_breed_id;

  RETURN COALESCE(total_cost, 0);
END;
$$ LANGUAGE plpgsql;

-- Total herbicide cost for a breed
CREATE OR REPLACE FUNCTION get_total_herbicide_cost(p_breed_id VARCHAR)
RETURNS NUMERIC AS $$
DECLARE
  total_cost NUMERIC;
BEGIN
  SELECT SUM(h.price) INTO total_cost
  FROM herbs_t1 ht1
  JOIN herbs h ON ht1.herbicide = h.herbicide
  WHERE ht1.br_id = p_breed_id;

  RETURN COALESCE(total_cost, 0);
END;
$$ LANGUAGE plpgsql;

-- Market price difference (open market - govt subsidy) for a breed
CREATE OR REPLACE FUNCTION get_market_price_difference(p_breed_id VARCHAR)
RETURNS NUMERIC AS $$
DECLARE
  diff NUMERIC;
BEGIN
  SELECT (m.open_market_price - m.govt_sub_price) INTO diff
  FROM market m
  WHERE m.breed_id = p_breed_id;

  RETURN diff;
END;
$$ LANGUAGE plpgsql;

-- Cursor-based variant of the fertilizer cost function (kept to mirror
-- the original coursework's cursor exercise; equivalent to the SUM()
-- version above but iterates row by row).
CREATE OR REPLACE FUNCTION get_total_fertilizer_cost_cursor(p_breed_id VARCHAR)
RETURNS NUMERIC AS $$
DECLARE
  cur CURSOR FOR
    SELECT bf.cost
    FROM crop_fertilizers cf
    JOIN biofertilizers bf
      ON cf.company_nm = bf.company_nm
     AND cf.fertilizer_nm = bf.fertilizer_nm
    WHERE cf.breed_id = p_breed_id;
  row_cost NUMERIC;
  total_cost NUMERIC := 0;
BEGIN
  OPEN cur;
  LOOP
    FETCH cur INTO row_cost;
    EXIT WHEN NOT FOUND;
    total_cost := total_cost + row_cost;
  END LOOP;
  CLOSE cur;
  RETURN total_cost;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Procedures
-- ============================================================

CREATE OR REPLACE PROCEDURE update_market_prices(
  p_breed_id VARCHAR,
  p_new_sub_price NUMERIC,
  p_new_open_price NUMERIC
) AS $$
DECLARE
  breed_exists INT;
BEGIN
  SELECT COUNT(*) INTO breed_exists FROM market WHERE breed_id = p_breed_id;

  IF breed_exists = 0 THEN
    RAISE EXCEPTION 'Breed ID does not exist in the market table!';
  END IF;

  UPDATE market
  SET govt_sub_price = p_new_sub_price,
      open_market_price = p_new_open_price
  WHERE breed_id = p_breed_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE PROCEDURE delete_crop_fertilizers_by_breed(p_breed_id VARCHAR) AS $$
DECLARE
  breed_exists INT;
BEGIN
  SELECT COUNT(*) INTO breed_exists FROM crop_fertilizers WHERE breed_id = p_breed_id;

  IF breed_exists = 0 THEN
    RAISE EXCEPTION 'Breed ID does not exist in the crop fertilizers table!';
  END IF;

  DELETE FROM crop_fertilizers WHERE breed_id = p_breed_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE PROCEDURE delete_herbs_by_breed(p_breed_id VARCHAR) AS $$
DECLARE
  breed_exists INT;
BEGIN
  SELECT COUNT(*) INTO breed_exists FROM herbs_t1 WHERE br_id = p_breed_id;

  IF breed_exists = 0 THEN
    RAISE EXCEPTION 'Breed ID does not exist in the herbs table!';
  END IF;

  DELETE FROM herbs_t1 WHERE br_id = p_breed_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Triggers
-- ============================================================

CREATE OR REPLACE FUNCTION trg_log_market_update() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO market_history (breed_id, old_sub_price, old_open_price, new_sub_price, new_open_price, update_date)
  VALUES (OLD.breed_id, OLD.govt_sub_price, OLD.open_market_price, NEW.govt_sub_price, NEW.open_market_price, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_update_market_prices ON market;
CREATE TRIGGER after_update_market_prices
AFTER UPDATE ON market
FOR EACH ROW EXECUTE FUNCTION trg_log_market_update();


CREATE OR REPLACE FUNCTION trg_log_fertilizer_delete() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO crop_fertilizers_history (breed_id, company_nm, fertilizer_nm, delete_date)
  VALUES (OLD.breed_id, OLD.company_nm, OLD.fertilizer_nm, NOW());
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS before_delete_crop_fertilizers ON crop_fertilizers;
CREATE TRIGGER before_delete_crop_fertilizers
BEFORE DELETE ON crop_fertilizers
FOR EACH ROW EXECUTE FUNCTION trg_log_fertilizer_delete();


CREATE OR REPLACE FUNCTION trg_log_herbs_delete() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO herbs_history (br_id, herbicide, delete_date)
  VALUES (OLD.br_id, OLD.herbicide, NOW());
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_delete_herbs ON herbs_t1;
CREATE TRIGGER after_delete_herbs
AFTER DELETE ON herbs_t1
FOR EACH ROW EXECUTE FUNCTION trg_log_herbs_delete();


CREATE OR REPLACE FUNCTION trg_validate_market_insert() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.govt_sub_price >= NEW.open_market_price THEN
    RAISE EXCEPTION 'Government Subsidy Price cannot be greater than or equal to Open Market Price!';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS before_insert_market ON market;
CREATE TRIGGER before_insert_market
BEFORE INSERT ON market
FOR EACH ROW EXECUTE FUNCTION trg_validate_market_insert();
