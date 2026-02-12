from datetime import datetime

from pydantic.main import BaseModel
from sqlalchemy import Boolean, DateTime, Float, Integer, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from src.dates import get_current_datetime_utc
from src.db import Base

default_datetime_func = get_current_datetime_utc


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(16), index=True)
    full_name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(120), index=True)
    disabled: Mapped[bool] = mapped_column(Boolean, default=False)
    hashed_password: Mapped[str] = mapped_column(String(128))
    timestamp: Mapped[datetime] = mapped_column(
        DateTime, default=default_datetime_func, index=True
    )


class Price(Base):
    __tablename__ = "prices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    ticker: Mapped[str] = mapped_column(String(16), index=True)
    price: Mapped[float] = mapped_column(Float)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime, default=default_datetime_func, index=True
    )


class Watchlist(Base):
    __tablename__ = "watchlists"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    symbol: Mapped[str] = mapped_column(String(120), index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    timestamp: Mapped[datetime] = mapped_column(
        DateTime, default=default_datetime_func, index=True
    )


class WatchlistAdd(BaseModel):
    """Request body for POST /watchlist."""

    symbol: str


class UserCreate(BaseModel):
    """Request body for POST /register."""

    username: str
    full_name: str
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: str | None = None
