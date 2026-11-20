from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.core.config import settings

# psycopg v3 uses 'postgresql+psycopg' prefix; auto-fix if user has plain 'postgresql://' or 'postgres://'
_db_url = settings.DATABASE_URL
if _db_url.startswith("postgres://"):
    _db_url = _db_url.replace("postgres://", "postgresql+psycopg://", 1)
elif _db_url.startswith("postgresql://") and "+psycopg" not in _db_url:
    _db_url = _db_url.replace("postgresql://", "postgresql+psycopg://", 1)

_engine_kwargs = {"pool_pre_ping": True}
if not _db_url.startswith("sqlite"):
    _engine_kwargs.update({"pool_size": 10, "max_overflow": 10})

engine = create_engine(_db_url, **_engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables on startup."""
    from app.models import user, station, price, updates, feedback  # noqa: F401
    Base.metadata.create_all(bind=engine)
