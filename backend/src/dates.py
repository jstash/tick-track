from datetime import datetime, timedelta, timezone


def get_current_datetime_utc() -> datetime:
    return datetime.now(timezone.utc)


def get_hours_ago_utc(num_hours: int) -> datetime:
    return datetime.now(timezone.utc) - timedelta(hours=num_hours)
