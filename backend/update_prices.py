#!/usr/bin/env python3
"""
update_prices.py
================
Automated weekly fuel price updater for Taguig gas stations.

Workflow:
  1. Scrapes weekly fuel price adjustments from GasWatch PH (https://gaswatchph.com/).
  2. Parses text tags (e.g., "Diesel +₱2.60/L", "Gasoline −₱4.30/L", "Kerosene −₱1.00/L").
  3. Records the shift in the `price_adjustments` tracker table (id = 1).
  4. Runs a mass calculation query across the `stations` table in PostgreSQL,
     maintaining base neighbor gaps (e.g., BGC vs. Bicutan).
  5. Includes safety fallbacks if website styling changes.

Usage:
  python update_prices.py               # Standard execution
  python update_prices.py --dry-run     # Scrape & display without DB updates
  python update_prices.py --help        # Show CLI options
"""

import os
import sys
import re
import logging
import argparse
from typing import Dict, Tuple, Optional
from datetime import datetime

# Configure UTF-8 encoding for standard output (critical on Windows & Linux environments)
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except AttributeError:
        pass

# Third-party imports
try:
    import requests
    from bs4 import BeautifulSoup
except ImportError as err:
    print(f"[FATAL] Missing required scraper package: {err}")
    print("Please run: pip install requests beautifulsoup4")
    sys.exit(1)

# PostgreSQL driver imports (supports both psycopg2 and psycopg v3)
try:
    import psycopg2
    from psycopg2 import sql as pg_sql
except ImportError:
    try:
        import psycopg as psycopg2
        from psycopg import sql as pg_sql
    except ImportError:
        print("[FATAL] Neither 'psycopg2' nor 'psycopg' is installed.")
        print("Please run: pip install psycopg2-binary (or psycopg[binary])")
        sys.exit(1)

# Optional dotenv support for loading local .env
try:
    from dotenv import load_dotenv
    # Search for .env in current directory or backend directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    dotenv_path = os.path.join(script_dir, ".env")
    if os.path.exists(dotenv_path):
        load_dotenv(dotenv_path)
    else:
        load_dotenv()
except ImportError:
    pass

# =============================================================================
# 1. EMERGENCY FALLBACK & HARDCODED SAFETY CONFIGURATION
# =============================================================================
# In the event GasWatch PH is temporarily unreachable or undergoes styling
# changes, the scraper falls back to these default numeric adjustments
# instead of crashing the pipeline. You can also inject numbers here manually.
FALLBACK_GAS: float = 0.00
FALLBACK_DIESEL: float = 0.00
FALLBACK_KEROSENE: float = 0.00

# Target scraping endpoint and browser User-Agent
GASWATCH_URL = "https://gaswatchph.com/"
HTTP_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Connection": "keep-alive",
}

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("fuel_price_updater")


# =============================================================================
# 2. WEB SCRAPER ENGINE (GasWatch PH)
# =============================================================================
def parse_shift_value(sign_char: str, numeric_str: str) -> float:
    """
    Parses sign indicator and numeric string into a signed floating point value.
    Handles standard minus '-', unicode minus '−' (\u2212), en-dash '–' (\u2013),
    and em-dash '—' (\u2014).
    """
    val = float(numeric_str)
    # Unicode and ASCII minus / negative characters
    negative_signs = {"-", "\u2212", "\u2013", "\u2014"}
    if sign_char in negative_signs:
        return -abs(val)
    return abs(val)


def scrape_gaswatch_adjustments() -> Dict[str, float]:
    """
    Scrapes https://gaswatchph.com/ to extract weekly adjustments for:
      - Gasoline
      - Diesel
      - Kerosene

    Returns:
        Dict[str, float]: e.g., {'Gasoline': -4.30, 'Diesel': 2.60, 'Kerosene': -1.00}
    """
    extracted_shifts: Dict[str, float] = {}

    # Regex pattern: Matches Fuel Type, Sign (+ or - / −), optional currency (₱, &#8369;, etc.),
    # decimal amount, and unit (/L or /liter).
    pattern = re.compile(
        r"(Diesel|Gasoline|Kerosene)\s*([+\-\u2212\u2013\u2014])\s*(?:&#8369;|[\u20b1₱Pp]|PHP)?\s*([0-9]+(?:\.[0-9]+)?)\s*/\s*L",
        re.IGNORECASE,
    )

    try:
        logger.info("Connecting to GasWatch PH: %s", GASWATCH_URL)
        response = requests.get(GASWATCH_URL, headers=HTTP_HEADERS, timeout=20)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")

        # Search specifically for header tags, update pills, or any relevant text container
        candidate_tags = soup.find_all(
            lambda tag: tag.name in ["span", "div", "p", "h1", "h2", "h3", "li"]
            and any(f in tag.text for f in ["Diesel", "Gasoline", "Kerosene"])
        )

        for tag in candidate_tags:
            text = tag.get_text(separator=" ", strip=True)
            for match in pattern.finditer(text):
                fuel = match.group(1).capitalize()
                sign = match.group(2)
                amount_str = match.group(3)

                shift_val = parse_shift_value(sign, amount_str)
                # Keep the first detected match for each fuel type in the header strip
                if fuel not in extracted_shifts:
                    extracted_shifts[fuel] = shift_val
                    logger.info("Scraped %s adjustment: %+0.2f PHP/L", fuel, shift_val)

    except requests.exceptions.RequestException as req_err:
        logger.warning(
            "Failed to fetch GasWatch PH (%s). Utilizing fallback variables.",
            req_err,
        )
    except Exception as parse_err:
        logger.warning(
            "Error while parsing HTML structure (%s). Utilizing fallback variables.",
            parse_err,
        )

    # Apply fallbacks for any missing fuel metric
    gasoline_shift = extracted_shifts.get("Gasoline", FALLBACK_GAS)
    diesel_shift = extracted_shifts.get("Diesel", FALLBACK_DIESEL)
    kerosene_shift = extracted_shifts.get("Kerosene", FALLBACK_KEROSENE)

    if "Gasoline" not in extracted_shifts:
        logger.warning("Gasoline not found in HTML. Using FALLBACK_GAS = %+0.2f", FALLBACK_GAS)
    if "Diesel" not in extracted_shifts:
        logger.warning("Diesel not found in HTML. Using FALLBACK_DIESEL = %+0.2f", FALLBACK_DIESEL)
    if "Kerosene" not in extracted_shifts:
        logger.warning("Kerosene not found in HTML. Using FALLBACK_KEROSENE = %+0.2f", FALLBACK_KEROSENE)

    return {
        "Gasoline": gasoline_shift,
        "Diesel": diesel_shift,
        "Kerosene": kerosene_shift,
    }


# =============================================================================
# 3. POSTGRESQL DATABASE MULTIPLIER & MASS CALCULATION
# =============================================================================
def get_db_connection():
    """
    Establishes connection to PostgreSQL using DATABASE_URL or individual PG* env vars.
    """
    db_url = os.getenv("DATABASE_URL")
    if db_url:
        # Normalize SQLAlchemy URL prefixes if present
        clean_url = db_url.replace("postgresql+psycopg://", "postgresql://").replace("postgresql+psycopg2://", "postgresql://")
        return psycopg2.connect(clean_url)

    # Fallback to standard libpq connection environment variables
    return psycopg2.connect(
        host=os.getenv("PGHOST", "localhost"),
        port=int(os.getenv("PGPORT", "5432")),
        user=os.getenv("PGUSER", "postgres"),
        password=os.getenv("PGPASSWORD", ""),
        dbname=os.getenv("PGDATABASE", "fuel_finder"),
    )


def apply_database_adjustments(gas_shift: float, diesel_shift: float, kerosene_shift: float, dry_run: bool = False):
    """
    Executes:
      1. Table initialization for `price_adjustments` if not exists.
      2. Upsert of the weekly shift at ID = 1 into `price_adjustments`.
      3. Single mass calculation query on `stations` preserving relative base gaps.
    """
    logger.info("Preparing database update:")
    logger.info("  Gasoline Shift : %+0.2f PHP/L", gas_shift)
    logger.info("  Diesel Shift   : %+0.2f PHP/L", diesel_shift)
    logger.info("  Kerosene Shift : %+0.2f PHP/L", kerosene_shift)

    if dry_run:
        logger.info("[DRY RUN] Skipping database commit. Queries simulated successfully.")
        return

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # Step 1: Ensure tracker table exists
            cur.execute("""
                CREATE TABLE IF NOT EXISTS price_adjustments (
                    id INTEGER PRIMARY KEY,
                    gasoline_shift NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
                    diesel_shift NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
                    kerosene_shift NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            """)

            # Step 2: Update tracker table at ID = 1 (UPSERT pattern)
            upsert_query = """
                INSERT INTO price_adjustments (id, gasoline_shift, diesel_shift, kerosene_shift, updated_at)
                VALUES (1, %s, %s, %s, NOW())
                ON CONFLICT (id) DO UPDATE 
                SET gasoline_shift = EXCLUDED.gasoline_shift,
                    diesel_shift = EXCLUDED.diesel_shift,
                    kerosene_shift = EXCLUDED.kerosene_shift,
                    updated_at = NOW();
            """
            cur.execute(upsert_query, (gas_shift, diesel_shift, kerosene_shift))
            logger.info("Tracked adjustment recorded in 'price_adjustments' at ID = 1.")

            # Step 3: Execute mass calculation query over Taguig stations
            # Updates fuel_prices (your active schema) and stations (if present)
            # Preserves neighborhood base price deltas (e.g., BGC vs Bicutan relative spread remains identical).
            
            # Check if fuel_prices table exists
            cur.execute("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'fuel_prices');")
            has_fuel_prices = cur.fetchone()[0]

            if has_fuel_prices:
                fuel_prices_query = """
                    UPDATE fuel_prices fp
                    SET price_per_liter = ROUND(fp.price_per_liter + CASE 
                            WHEN fp.fuel_type ILIKE '%gasoline%' OR fp.fuel_type ILIKE '%unleaded%' OR fp.fuel_type ILIKE '%u91%' OR fp.fuel_type ILIKE '%premium%' OR fp.fuel_type ILIKE '%p95%' THEN (SELECT gasoline_shift FROM price_adjustments WHERE id = 1)
                            WHEN fp.fuel_type ILIKE '%diesel%' THEN (SELECT diesel_shift FROM price_adjustments WHERE id = 1)
                            WHEN fp.fuel_type ILIKE '%kerosene%' THEN (SELECT kerosene_shift FROM price_adjustments WHERE id = 1)
                            ELSE 0.00
                        END, 2),
                        date_updated = CURRENT_DATE,
                        time_updated = CURRENT_TIME
                    FROM gas_stations gs
                    WHERE fp.station_id = gs.station_id
                      AND fp.status = 'active';
                """
                cur.execute(fuel_prices_query)
                prices_updated = cur.rowcount
                logger.info("Updated active prices in 'fuel_prices': %d price records updated.", prices_updated)

            # Check if stations table exists as well
            cur.execute("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stations');")
            has_stations = cur.fetchone()[0]

            if has_stations:
                mass_update_query = """
                    UPDATE stations 
                    SET gasoline_price = gasoline_price + (SELECT gasoline_shift FROM price_adjustments WHERE id = 1),
                        diesel_price = diesel_price + (SELECT diesel_shift FROM price_adjustments WHERE id = 1),
                        kerosene_price = kerosene_price + (SELECT kerosene_shift FROM price_adjustments WHERE id = 1),
                        updated_at = NOW();
                """
                cur.execute(mass_update_query)
                stations_updated = cur.rowcount
                logger.info("Updated 'stations' table: %d records updated.", stations_updated)

            # Atomic commit
            conn.commit()
            logger.info("Transaction committed successfully.")

    except Exception as db_err:
        conn.rollback()
        logger.error("Database transaction failed! Changes rolled back. Error: %s", db_err)
        raise
    finally:
        conn.close()


# =============================================================================
# 4. CLI ENTRY POINT
# =============================================================================
def main():
    parser = argparse.ArgumentParser(
        description="Weekly Fuel Price Updater (GasWatch PH Scraper & Taguig DB Multiplier)"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Scrape and show calculations without executing SQL updates against the database.",
    )
    parser.add_argument(
        "--manual-gas",
        type=float,
        default=None,
        help="Manually override Gasoline shift (e.g. --manual-gas -4.30)",
    )
    parser.add_argument(
        "--manual-diesel",
        type=float,
        default=None,
        help="Manually override Diesel shift (e.g. --manual-diesel 2.60)",
    )
    parser.add_argument(
        "--manual-kerosene",
        type=float,
        default=None,
        help="Manually override Kerosene shift (e.g. --manual-kerosene -1.00)",
    )

    args = parser.parse_args()

    logger.info("=== Fuel Finder: Weekly Price Adjustment Routine Started ===")

    # Scrape from GasWatch PH
    shifts = scrape_gaswatch_adjustments()

    # Apply manual CLI overrides if provided
    gas_val = args.manual_gas if args.manual_gas is not None else shifts["Gasoline"]
    diesel_val = args.manual_diesel if args.manual_diesel is not None else shifts["Diesel"]
    kerosene_val = args.manual_kerosene if args.manual_kerosene is not None else shifts["Kerosene"]

    # Execute DB update routine
    apply_database_adjustments(
        gas_shift=gas_val,
        diesel_shift=diesel_val,
        kerosene_shift=kerosene_val,
        dry_run=args.dry_run,
    )

    logger.info("=== Weekly Price Adjustment Routine Completed ===")


if __name__ == "__main__":
    main()
