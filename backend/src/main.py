from contextlib import asynccontextmanager

from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import Depends, FastAPI
from sqlalchemy.orm import Session

from src.db import Base, engine, get_db, SessionLocal
from src.models import Price
from src.services.market_data import get_client as get_market_data_client
from src.utils.dates import get_current_datetime_utc, get_hours_ago_utc


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


app = FastAPI(lifespan=lifespan)


@app.get("/")
def home():
    return {"message": "Tik Track"}


@app.get("/update-prices")
def update_prices(db: Session = Depends(get_db)):
    try:
        prices = run_update_prices(db)
        return {"prices": prices}
    except Exception as e:
        return {"err": str(e)}


@app.get("/prices")
def get_prices(tickers: str, db: Session = Depends(get_db)):
    prices = []
    missing = []
    for ticker in tickers.upper().split(","):
        price = (
            db.query(Price)
            .filter(Price.ticker == ticker)
            .order_by(Price.timestamp.desc())
            .first()
        )
        if price is not None:
            prices.append(price)
        else:
            missing.append(ticker)
    return {
        "prices": prices,
        "missing": missing,
    }


@app.get("/prices/{ticker}")
def get_price(ticker: str, db: Session = Depends(get_db)):
    return get_prices(ticker, db)


@app.get("/price/{ticker}/history")
def get_prices_history(ticker: str, hours: int = 24, db: Session = Depends(get_db)):
    ticker = ticker.upper()
    from_date = get_hours_ago_utc(hours)
    prices = (
        db.query(Price)
        .filter(Price.ticker == ticker)
        .filter(Price.timestamp >= from_date)
        .all()
    )
    return {"prices": prices}
