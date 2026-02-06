from datetime import datetime, timezone


def get_current_datetime_utc() -> datetime:
    return datetime.now(timezone.utc)
