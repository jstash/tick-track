from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from src.utils.dates import get_current_datetime_utc
from src.db import Base

default_datetime_func = get_current_datetime_utc


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(16), index=True)
    email: Mapped[str] = mapped_column(String(120), index=True)
    password: Mapped[str] = mapped_column(String(128))
    create_date: Mapped[datetime] = mapped_column(
        DateTime, default=default_datetime_func, index=True
    )


class Price(Base):
    __tablename__ = "prices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    ticker: Mapped[str] = mapped_column(String(16), index=True)
    price: Mapped[float] = mapped_column(Float)
    create_date: Mapped[datetime] = mapped_column(
        DateTime, default=default_datetime_func, index=True
    )


class Watchlist(Base):
    __tablename__ = "watchlists"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    create_date: Mapped[datetime] = mapped_column(
        DateTime, default=default_datetime_func, index=True
    )
