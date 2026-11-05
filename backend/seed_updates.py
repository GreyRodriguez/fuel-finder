"""
Seed script for the "Latest Updates & Price Trends" feature.

Creates the new tables (idempotent) and records this week's average prices from the real `fuel_prices` table.

Usage (from backend/):
    python seed_updates.py                # create tables + snapshot this week's real average prices
    python seed_updates.py --snapshot     # only snapshot (run weekly, e.g. right after update_prices.py)
    python seed_updates.py --demo         # ALSO insert clearly-labelled SAMPLE history/forecasts/advisories
                                          # so the pages have something to show in development

Sample rows are tagged ("Sample data" source / "[Sample]" title) and can be deleted from /admin/updates.
"""
import argparse
import os
import random
import sys
from datetime import date, timedelta

sys.path.insert(0, os.path.dirname(__file__))

from app.db.session import init_db, SessionLocal
from app.models.updates import EnergyAdvisory, FuelPriceSnapshot, MarketForecast
from app.services.trends import record_weekly_snapshot, upsert_snapshot, week_start

SAMPLE_SOURCE = "Sample data"


def backfill_history(db, live, weeks: int = 8) -> int:
    """Walk backwards from today's real average with small deterministic weekly moves (DEMO ONLY)."""
    rng = random.Random(42)
    this_week = week_start()
    added = 0
    for ft, (avg, count) in live.items():
        price = avg
        for i in range(1, weeks + 1):
            price = round(price - rng.choice([-2.4, -1.1, -0.4, 0.6, 1.3, 2.2]), 2)
            wk = this_week - timedelta(days=7 * i)
            exists = db.query(FuelPriceSnapshot).filter(
                FuelPriceSnapshot.week_start == wk, FuelPriceSnapshot.fuel_type == ft
            ).first()
            if not exists:
                upsert_snapshot(db, ft, wk, price, count)
                added += 1
    db.commit()
    return added


def seed_samples(db) -> None:
    if db.query(MarketForecast).filter(MarketForecast.source == SAMPLE_SOURCE).first() is None:
        next_monday = week_start() + timedelta(days=7)
        for fuel, change in (("Gasoline", -1.20), ("Diesel", 0.80), ("Kerosene", 0.00)):
            db.add(MarketForecast(
                fuel_type=fuel, change_per_liter=change, effective_date=next_monday,
                source=SAMPLE_SOURCE, notes="Sample forecast for development.",
            ))
    if db.query(EnergyAdvisory).filter(EnergyAdvisory.source == SAMPLE_SOURCE).first() is None:
        today = date.today()
        samples = [
            ("[Sample] Weekly price adjustment notice", "Placeholder advisory showing how a weekly price adjustment notice appears.", "All", 2),
            ("[Sample] Diesel supply advisory", "Placeholder advisory limited to diesel, used to test the fuel-type filter.", "Diesel", 9),
            ("[Sample] Fuel discount reminder", "Placeholder advisory used to test date-range filtering.", "All", 40),
        ]
        for title, summary, fuel, days_ago in samples:
            db.add(EnergyAdvisory(
                title=title, summary=summary, source=SAMPLE_SOURCE,
                published_date=today - timedelta(days=days_ago), fuel_type=fuel,
            ))
    db.commit()


def main():
    parser = argparse.ArgumentParser(description="Seed price-trend data")
    parser.add_argument("--snapshot", action="store_true", help="Only record this week's average prices")
    parser.add_argument("--demo", action="store_true", help="Also insert clearly-labelled sample data")
    args = parser.parse_args()

    print("[*] Ensuring tables exist...")
    init_db()
    db = SessionLocal()
    try:
        live = record_weekly_snapshot(db)
        if not live:
            print("[WARN] No active fuel prices found - run seed_stations.py first.")
        for ft, (avg, count) in live.items():
            print(f"[OK] {ft}: avg PHP {avg:.2f} across {count} stations (week of {week_start()})")

        if args.demo and not args.snapshot:
            added = backfill_history(db, live)
            seed_samples(db)
            print(f"[DEMO] Added {added} SAMPLE weekly history points plus sample forecasts/advisories.")
    finally:
        db.close()


if __name__ == "__main__":
    main()

