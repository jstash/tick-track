from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase


DATABASE_URL = "sqlite:///./ticktrack.db"


class Base(DeclarativeBase):
    # Doesn't do anything right now.  Using this later for DRY db entities. Setting it up now so I don't have to change the imports later.
    pass


engine = create_engine(
    DATABASE_URL,
    connect_args={
        "check_same_thread": False
    },  # needed for SQLite with uvicorn's threading
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
