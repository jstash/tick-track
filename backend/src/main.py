from fastapi import Depends, FastAPI
from sqlalchemy.orm import Session

from src.services.market_data import get_client as get_market_data_client
from src.db import Base, engine, get_db
from src.models import Price

from contextlib import asynccontextmanager
from fastapi import FastAPI


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting")
    print("Initializing database tables")
    Base.metadata.create_all(bind=engine)
    print("Done initializing database tables")
    yield
    print("Shutting down")


app = FastAPI(lifespan=lifespan)


@app.get("/")
def home(db: Session = Depends(get_db)):
    client = get_market_data_client()
    price = client.fetch_current_price("AAPL")

    snapshot = Price(ticker="AAPL", price=price)
    db.add(snapshot)
    db.commit()
    db.refresh(snapshot)

    return {
        "ticker": snapshot.ticker,
        "price": snapshot.price,
        "snapshot_id": snapshot.id,
        "create_date": snapshot.create_date,
    }
