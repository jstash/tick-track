from fastapi import FastAPI
from services.market_data import get_client as get_market_data_client

app = FastAPI()

@app.get("/")
def home():
    client = get_market_data_client()
    return {"stock_price": client.fetch_current_price("AAPL")}