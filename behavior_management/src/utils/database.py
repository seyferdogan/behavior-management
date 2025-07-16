from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from ..models.user import Base

# You would typically get this from environment variables
DATABASE_URL = "sqlite:///behavior_management.db"

# Create database engine
engine = create_engine(DATABASE_URL)

# Create all tables
def init_db():
    Base.metadata.create_all(engine)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 