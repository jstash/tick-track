from abc import abstractmethod
import yfinance as yf
import logging

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


class MarketDataClient:
    @abstractmethod
    def fetch_current_price(self, ticker: str) -> float:
        pass


class YFinanceClient(MarketDataClient):
    def fetch_current_price(self, ticker: str) -> float:
        stock = yf.Ticker(ticker.upper())
        price = stock.history(period="1d", interval="1m")["Close"].iloc[-1]
        price = round(price, 2)
        logger.info("Current price for %s, %s", ticker, price)
        return price


def get_client() -> MarketDataClient:
    return YFinanceClient()
