from typing import Annotated

from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm


from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy.orm import Session

from src import test_data
from src.auth import execute_register, get_current_active_user, execute_login
from src.dates import get_hours_ago_utc
from src.db import get_db
from src.scheduler import lifespan, run_update_prices
from src.models import Token, User, UserCreate, Price, Watchlist, WatchlistAdd

app = FastAPI(lifespan=lifespan)

auth_scheme = OAuth2PasswordBearer(tokenUrl="token")


@app.post("/token")
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Session = Depends(get_db),
):
    return await execute_login(form_data, db)


@app.get("/users/me/items/")
async def read_items(token: Annotated[str, Depends(auth_scheme)]):
    return {"token": token}


@app.get("/users/me")
async def read_users_me(
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return current_user


@app.get("/")
def home(db: Session = Depends(get_db)):
    ret = {"message": "Tik Track", "users": []}
    test_data.populate(db)
    users = db.query(User).all()
    for u in users:
        ret["users"].append(
            {
                "username": u.username,
                "email": u.email,
                "full_name": u.full_name,
                "disabled": u.disabled,
                "hashed_password": u.hashed_password,
            }
        )
    return ret


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


@app.post("/register", response_model=Token)
def register(user: UserCreate, db: Session = Depends(get_db)):
    return execute_register(user, db)


@app.get("/watchlist")
def get_watchlist(
    current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)
):
    watchlist = db.query(Watchlist).filter(Watchlist.user_id == current_user.id).all()
    return [{"symbol": w.symbol} for w in watchlist]


# Watchlist - Add symbol
@app.post("/watchlist")
def add_to_watchlist(
    item: WatchlistAdd,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    # Check if already in watchlist
    existing = (
        db.query(Watchlist)
        .filter(
            Watchlist.user_id == current_user.id,
            Watchlist.symbol == item.symbol.upper(),
        )
        .first()
    )

    if existing:
        raise HTTPException(status_code=400, detail="Symbol already in watchlist")

    watchlist_item = Watchlist(user_id=current_user.id, symbol=item.symbol.upper())
    db.add(watchlist_item)
    db.commit()
    return {"message": "Added to watchlist", "symbol": item.symbol.upper()}


# Watchlist - Remove symbol
@app.delete("/watchlist/{symbol}")
def remove_from_watchlist(
    symbol: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    watchlist_item = (
        db.query(Watchlist)
        .filter(
            Watchlist.user_id == current_user.id, Watchlist.symbol == symbol.upper()
        )
        .first()
    )

    if not watchlist_item:
        raise HTTPException(status_code=404, detail="Symbol not in watchlist")

    db.delete(watchlist_item)
    db.commit()
    return {"message": "Removed from watchlist"}
