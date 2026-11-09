
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
import os

# Make DATABASE_URL configurable via environment variable
# Defaults to SQLite for local development
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./studymate.db"
)

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

class Base(DeclarativeBase):
    pass
