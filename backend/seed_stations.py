"""
Gas station and fuel price database seeder and manager for FuelFinder.

Reads data from an external JSON file (default: backend/data/stations.json)
so stations and coordinates are never hardcoded in application logic.

Usage:
    python seed_stations.py --help
    python seed_stations.py --stats
    python seed_stations.py --backup
    python seed_stations.py --clear
    python seed_stations.py --seed
    python seed_stations.py --force
"""

import sys
import os
import json
import argparse
from datetime import date, datetime
from decimal import Decimal

# Configure UTF-8 encoding for standard output (critical on Windows consoles)
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except AttributeError:
        pass

sys.path.insert(0, os.path.dirname(__file__))

from app.db.session import init_db, SessionLocal
from app.models.station import GasStation
from app.models.price import FuelPrice

DEFAULT_DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "stations.json")
BACKUP_DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "backup_stations_and_prices.json")


def backup_database(output_path: str = BACKUP_DATA_PATH):
    """Back up all existing stations and fuel prices to a JSON file."""
    db = SessionLocal()
    try:
        stations = db.query(GasStation).all()
        backup_data = []
        for s in stations:
            s_dict = {
                "station_id": s.station_id,
                "name": s.name,
                "brand": s.brand,
                "address": s.address,
                "barangay": s.barangay,
                "city": s.city,
                "latitude": float(s.latitude),
                "longitude": float(s.longitude),
                "contact_info": s.contact_info,
                "status": s.status,
                "prices": [
                    {
                        "price_id": p.price_id,
                        "fuel_type": p.fuel_type,
                        "price_per_liter": float(p.price_per_liter),
                        "date_updated": str(p.date_updated),
                        "time_updated": str(p.time_updated),
                        "status": p.status,
                    }
                    for p in s.fuel_prices
                ],
            }
            backup_data.append(s_dict)

        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(backup_data, f, indent=2)

        print(f"[OK] Backed up {len(backup_data)} stations to '{output_path}'.")
        return len(backup_data)
    finally:
        db.close()


def clear_database():
    """Delete all current gas stations and fuel prices from the database."""
    db = SessionLocal()
    try:
        price_count = db.query(FuelPrice).count()
        station_count = db.query(GasStation).count()

        print(f"[*] Deleting {price_count} price record(s) and {station_count} gas station(s)...")

        # Due to cascade delete, deleting GasStation deletes FuelPrice,
        # but we also explicitly delete FuelPrice first to ensure clean state
        db.query(FuelPrice).delete()
        db.query(GasStation).delete()
        db.commit()

        print(f"[OK] Successfully cleared database. 0 stations and 0 prices remaining.")
    except Exception as err:
        db.rollback()
        print(f"[ERROR] Failed to clear database: {err}")
        raise
    finally:
        db.close()


def load_stations_from_file(file_path: str = DEFAULT_DATA_PATH):
    """Load station list from external JSON file."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Stations data file not found: {file_path}")

    with open(file_path, "r", encoding="utf-8") as f:
        stations = json.load(f)

    if not isinstance(stations, list):
        raise ValueError("JSON root must be a list of station objects")

    return stations


def seed_stations(data_file: str = DEFAULT_DATA_PATH, force: bool = False):
    """Seed stations and fuel prices from JSON file into database."""
    print("[*] Initializing database tables...")
    init_db()
    print("[OK] Tables ready.\n")

    db = SessionLocal()
    try:
        existing_count = db.query(GasStation).count()
        if existing_count > 0:
            if not force:
                print(f"[INFO] {existing_count} station(s) already exist in database.")
                print("       Use --force to clear and re-seed, or run --clear first.")
                return
            else:
                print(f"[*] --force flag set. Backing up and clearing existing {existing_count} station(s)...")
                backup_database()
                clear_database()

        stations_data = load_stations_from_file(data_file)
        today = date.today()
        seeded_count = 0
        total_prices_count = 0

        print(f"[*] Importing {len(stations_data)} station(s) from '{data_file}'...\n")

        for item in stations_data:
            item_copy = dict(item)
            prices_data = item_copy.pop("prices", [])

            # Create GasStation record
            station = GasStation(**item_copy)
            db.add(station)
            db.flush()  # populate station.station_id

            # Add associated fuel prices
            for p in prices_data:
                price = FuelPrice(
                    station_id=station.station_id,
                    fuel_type=p["fuel_type"],
                    price_per_liter=Decimal(str(p["price_per_liter"])),
                    date_updated=today,
                    status=p.get("status", "active"),
                )
                db.add(price)
                total_prices_count += 1

            seeded_count += 1
            print(f"  [+] #{station.station_id}: {station.name} ({station.brand}) — Lat: {station.latitude}, Lng: {station.longitude} | {len(prices_data)} fuel type(s)")

        db.commit()
        print(f"\n[OK] Successfully seeded {seeded_count} gas stations and {total_prices_count} fuel prices!")
        print("     All coordinates and station data have been updated from the external JSON file.")
    except Exception as err:
        db.rollback()
        print(f"[ERROR] Seeding failed: {err}")
        raise
    finally:
        db.close()


def print_stats():
    """Print current counts and overview of database records."""
    db = SessionLocal()
    try:
        stations = db.query(GasStation).all()
        prices_count = db.query(FuelPrice).count()

        print(f"\n--- FuelFinder Database Overview ---")
        print(f"Total Stations: {len(stations)}")
        print(f"Total Prices:   {prices_count}")
        print("\nCurrent Stations:")
        for s in stations:
            active_prices = [p for p in s.fuel_prices if p.status == "active"]
            price_str = ", ".join(f"{p.fuel_type}: ₱{float(p.price_per_liter):.2f}" for p in active_prices)
            print(f"  - [{s.station_id}] {s.name} ({s.brand}) @ ({float(s.latitude):.4f}, {float(s.longitude):.4f}) | {price_str}")
        print("------------------------------------\n")
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="Manage FuelFinder gas station data.")
    parser.add_argument("--clear", action="store_true", help="Delete all gas stations and prices from database")
    parser.add_argument("--backup", action="store_true", help="Backup existing stations and prices to JSON file")
    parser.add_argument("--seed", action="store_true", help="Seed stations from JSON file (default behavior)")
    parser.add_argument("--force", action="store_true", help="Clear existing records and re-seed from JSON file")
    parser.add_argument("--stats", action="store_true", help="Print current database statistics")
    parser.add_argument("--file", type=str, default=DEFAULT_DATA_PATH, help=f"Path to JSON file (default: {DEFAULT_DATA_PATH})")

    args = parser.parse_args()

    if args.stats:
        print_stats()
        return

    if args.backup:
        backup_database()
        return

    if args.clear:
        backup_database()
        clear_database()
        return

    if args.force:
        seed_stations(data_file=args.file, force=True)
        return

    # Default action or --seed
    seed_stations(data_file=args.file, force=False)


if __name__ == "__main__":
    main()
