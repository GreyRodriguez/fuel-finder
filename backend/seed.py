"""
Seed script - run once to:
1. Create the fuel_finder database tables
2. Create the default admin user
3. Create the default regular user

Usage:
    cd backend
    .\\venv\\Scripts\\python.exe seed.py
"""

import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app.db.session import init_db, SessionLocal
from app.models.user import User
from app.core.security import hash_password

DEFAULT_ACCOUNTS = [
    {
        "full_name": "Super Admin",
        "email": "admin@fuelfinder.ph",
        "password": "Admin@1234",
        "role": "admin",
    },
    {
        "full_name": "Default User",
        "email": "user@fuelfinder.ph",
        "password": "User@1234",
        "role": "user",
    },
]


def seed():
    print("[*] Creating database tables...")
    init_db()
    print("[OK] Tables created.\n")

    db = SessionLocal()
    try:
        for account in DEFAULT_ACCOUNTS:
            existing = db.query(User).filter(User.email == account["email"]).first()
            if existing:
                print(f"[INFO] Already exists: {account['email']} ({account['role']})")
                continue

            new_user = User(
                full_name=account["full_name"],
                email=account["email"],
                password_hash=hash_password(account["password"]),
                role=account["role"],
                status="active",
            )
            db.add(new_user)
            db.commit()
            print(f"[OK] {account['role'].capitalize()} account created!")
            print(f"     Email:    {account['email']}")
            print(f"     Password: {account['password']}")
            print()

        print("------------------------------")
        print("Default login credentials:")
        print()
        print("  ADMIN")
        print("  Email:    admin@fuelfinder.ph")
        print("  Password: Admin@1234")
        print()
        print("  USER")
        print("  Email:    user@fuelfinder.ph")
        print("  Password: User@1234")
        print("------------------------------")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
