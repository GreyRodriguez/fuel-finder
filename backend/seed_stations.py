"""
Seed sample gas station data for Taguig City.

Usage:
    cd backend
    .\\venv\\Scripts\\python.exe seed_stations.py
"""

import sys
import os
from datetime import date, time

sys.path.insert(0, os.path.dirname(__file__))

from app.db.session import init_db, SessionLocal
from app.models.station import GasStation
from app.models.price import FuelPrice

STATIONS = [
    {
        "name": "Petron BGC",
        "brand": "Petron",
        "address": "9th Avenue, Bonifacio Global City",
        "barangay": "BGC",
        "city": "Taguig City",
        "latitude": 14.5500,
        "longitude": 121.0494,
        "contact_info": "02-8818-5555",
        "prices": [
            {"fuel_type": "Gasoline", "price_per_liter": 62.50},
            {"fuel_type": "Diesel", "price_per_liter": 57.80},
            {"fuel_type": "Premium Gasoline", "price_per_liter": 68.75},
        ],
    },
    {
        "name": "Shell BGC Station",
        "brand": "Shell",
        "address": "5th Avenue corner 26th St, BGC",
        "barangay": "BGC",
        "city": "Taguig City",
        "latitude": 14.5485,
        "longitude": 121.0520,
        "contact_info": "02-8819-1234",
        "prices": [
            {"fuel_type": "Gasoline", "price_per_liter": 63.10},
            {"fuel_type": "Diesel", "price_per_liter": 58.20},
            {"fuel_type": "Premium Gasoline", "price_per_liter": 69.50},
        ],
    },
    {
        "name": "Caltex Taguig Central",
        "brand": "Caltex",
        "address": "Hagonoy Road, Taguig",
        "barangay": "Hagonoy",
        "city": "Taguig City",
        "latitude": 14.5243,
        "longitude": 121.0792,
        "contact_info": "02-8555-7890",
        "prices": [
            {"fuel_type": "Gasoline", "price_per_liter": 61.90},
            {"fuel_type": "Diesel", "price_per_liter": 56.95},
            {"fuel_type": "Premium Gasoline", "price_per_liter": 67.80},
        ],
    },
    {
        "name": "Petron Fort Bonifacio",
        "brand": "Petron",
        "address": "Lawton Avenue, Fort Bonifacio",
        "barangay": "Western Bicutan",
        "city": "Taguig City",
        "latitude": 14.5100,
        "longitude": 121.0590,
        "contact_info": "02-8817-4321",
        "prices": [
            {"fuel_type": "Gasoline", "price_per_liter": 62.75},
            {"fuel_type": "Diesel", "price_per_liter": 57.50},
            {"fuel_type": "Premium Gasoline", "price_per_liter": 68.90},
        ],
    },
    {
        "name": "Shell McKinley",
        "brand": "Shell",
        "address": "McKinley Road, McKinley Hill",
        "barangay": "McKinley Hill",
        "city": "Taguig City",
        "latitude": 14.5380,
        "longitude": 121.0560,
        "contact_info": "02-8850-1122",
        "prices": [
            {"fuel_type": "Gasoline", "price_per_liter": 63.40},
            {"fuel_type": "Diesel", "price_per_liter": 58.50},
            {"fuel_type": "Premium Gasoline", "price_per_liter": 70.00},
        ],
    },
    {
        "name": "Unioil Taguig",
        "brand": "Unioil",
        "address": "Bayani Road, Western Bicutan",
        "barangay": "Western Bicutan",
        "city": "Taguig City",
        "latitude": 14.5060,
        "longitude": 121.0500,
        "contact_info": "02-8551-9900",
        "prices": [
            {"fuel_type": "Gasoline", "price_per_liter": 61.50},
            {"fuel_type": "Diesel", "price_per_liter": 56.75},
            {"fuel_type": "Premium Gasoline", "price_per_liter": 67.25},
        ],
    },
    {
        "name": "Phoenix Taguig",
        "brand": "Phoenix",
        "address": "Signal Village, Taguig",
        "barangay": "Signal Village",
        "city": "Taguig City",
        "latitude": 14.5170,
        "longitude": 121.0700,
        "contact_info": "02-8556-3344",
        "prices": [
            {"fuel_type": "Gasoline", "price_per_liter": 61.20},
            {"fuel_type": "Diesel", "price_per_liter": 56.50},
        ],
    },
    {
        "name": "Caltex BGC North",
        "brand": "Caltex",
        "address": "28th Street, Bonifacio Global City",
        "barangay": "BGC",
        "city": "Taguig City",
        "latitude": 14.5530,
        "longitude": 121.0510,
        "contact_info": "02-8818-6677",
        "prices": [
            {"fuel_type": "Gasoline", "price_per_liter": 62.00},
            {"fuel_type": "Diesel", "price_per_liter": 57.25},
            {"fuel_type": "Premium Gasoline", "price_per_liter": 68.00},
        ],
    },
    {
        "name": "Petron Upper Bicutan",
        "brand": "Petron",
        "address": "Katuparan Road, Upper Bicutan",
        "barangay": "Upper Bicutan",
        "city": "Taguig City",
        "latitude": 14.5010,
        "longitude": 121.0650,
        "contact_info": "02-8552-8877",
        "prices": [
            {"fuel_type": "Gasoline", "price_per_liter": 62.30},
            {"fuel_type": "Diesel", "price_per_liter": 57.10},
        ],
    },
]


def seed_stations():
    print("[*] Initializing tables...")
    init_db()
    print("[OK] Tables ready.\n")

    db = SessionLocal()
    try:
        existing_count = db.query(GasStation).count()
        if existing_count > 0:
            print(f"[INFO] {existing_count} station(s) already exist. Skipping seed.")
            print("       Delete existing stations first if you want to re-seed.")
            return

        today = date.today()
        now = date.today()

        for data in STATIONS:
            prices_data = data.pop("prices")
            station = GasStation(**data)
            db.add(station)
            db.flush()  # get station_id

            for p in prices_data:
                price = FuelPrice(
                    station_id=station.station_id,
                    fuel_type=p["fuel_type"],
                    price_per_liter=p["price_per_liter"],
                    date_updated=today,
                    status="active",
                )
                db.add(price)

            print(f"  [+] {station.name} ({station.brand}) — {len(prices_data)} fuel type(s)")

        db.commit()
        print(f"\n[OK] {len(STATIONS)} gas stations seeded successfully!")
        print("     Refresh your dashboard to see them on the map.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_stations()
