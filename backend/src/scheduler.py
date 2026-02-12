from contextlib import asynccontextmanager
from fastapi import FastAPI
from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session
from src.models import Base, Price
from src.services.market_data import get_client as get_market_data_client
from src.dates import get_current_datetime_utc
from src.db import SessionLocal, engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting")
    print("Initializing database tables")
    Base.metadata.create_all(bind=engine)
    print("Done initializing database tables")

    scheduler = BackgroundScheduler()
    scheduler.add_job(scheduled_update_prices, "interval", minutes=1)
    scheduler.start()
    app.state.scheduler = scheduler

    yield

    print("Shutting down")
    scheduler.shutdown(wait=False)


def run_update_prices(db: Session) -> list[Price]:
    client = get_market_data_client()
    tickers = ["aapl", "MSFT", "GOOG", "AMZN", "TSLA"]
    prices = []
    for ticker in tickers:
        ticker = ticker.upper()
        price = client.fetch_current_price(ticker)
        price_entry = Price(
            ticker=ticker, price=price, timestamp=get_current_datetime_utc()
        )
        prices.append(price_entry)
    db.add_all(prices)
    db.commit()
    for p in prices:
        db.refresh(p)
    return prices


def scheduled_update_prices() -> None:
    db = SessionLocal()
    try:
        run_update_prices(db)
    finally:
        db.close()
