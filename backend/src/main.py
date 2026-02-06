from fastapi import FastAPI
from services.yfinance_client import get_closing_price

app = FastAPI()

@app.get("/")
def home():
    return {"stock_price": get_closing_price("AAPL")}