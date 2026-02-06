import yfinance as yf

def get_closing_price(ticker: str) -> float:
    stock = yf.Ticker(ticker)
    price = stock.history(period="1d")["Close"].iloc[0]
    return price # e.g {"stock_price":273.5450134277344}
