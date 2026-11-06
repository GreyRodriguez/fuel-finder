import time
from collections import defaultdict, deque

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.core.security import get_optional_user
from app.db.session import get_db
from app.models.feedback import Feedback
from app.models.station import GasStation
from app.schemas.updates import FeedbackCreate, FeedbackOut

router = APIRouter(prefix="/api/feedback", tags=["feedback"])

# Simple in-memory sliding-window rate limit: RATE_LIMIT submissions per RATE_WINDOW_SECONDS per client.
# (Per process — use Redis or similar if you run several workers.)
RATE_LIMIT = 5
RATE_WINDOW_SECONDS = 600
_hits: dict[str, deque] = defaultdict(deque)


def _client_key(request: Request, user) -> str:
    if user is not None:
        return f"user:{user.user_id}"
    fwd = request.headers.get("x-forwarded-for")
    ip = fwd.split(",")[0].strip() if fwd else (request.client.host if request.client else "unknown")
    return f"ip:{ip}"


def _check_rate_limit(key: str) -> None:
    now = time.monotonic()
    q = _hits[key]
    while q and now - q[0] > RATE_WINDOW_SECONDS:
        q.popleft()
    if len(q) >= RATE_LIMIT:
        retry_after = int(RATE_WINDOW_SECONDS - (now - q[0])) + 1
        raise HTTPException(
            status_code=429,
            detail="You're sending feedback too quickly. Please try again in a few minutes.",
            headers={"Retry-After": str(retry_after)},
        )
    q.append(now)


@router.post("/", response_model=FeedbackOut, status_code=201)
def submit_feedback(
    payload: FeedbackCreate,
    request: Request,
    db: Session = Depends(get_db),
    user=Depends(get_optional_user),
):
    # Honeypot: bots fill the hidden field. Pretend success, store nothing.
    if payload.website:
        return FeedbackOut(feedback_id=0)

    _check_rate_limit(_client_key(request, user))

    if payload.station_id is not None:
        station = db.query(GasStation).filter(GasStation.station_id == payload.station_id).first()
        if not station:
            raise HTTPException(status_code=422, detail="Selected station was not found.")

    entry = Feedback(
        user_id=user.user_id if user else None,
        name=payload.name or (user.full_name if user else None),
        email=payload.email or (user.email if user else None),
        category=payload.category,
        message=payload.message,
        station_id=payload.station_id,
        fuel_type=payload.fuel_type,
        reported_price=payload.reported_price,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return FeedbackOut(feedback_id=entry.feedback_id)

