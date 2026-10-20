from enum import Enum
from datetime import datetime, timedelta
from typing import List, Optional
from collections import Counter
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean
from sqlalchemy.orm import declarative_base, sessionmaker, Session

# Database Setup
DATABASE_URL = "sqlite:///./graveyard.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Enums & Models
class CauseOfDeath(str, Enum):
    TOO_MANY_TABS = "TOO_MANY_TABS"
    FORGOT_EXISTENCE = "FORGOT_EXISTENCE"
    WILL_READ_LATER = "WILL_READ_LATER"
    IMPULSE_OPEN = "IMPULSE_OPEN"
    OTHER = "OTHER"

class TabModel(Base):
    __tablename__ = "buried_tabs"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    url = Column(String, nullable=False)
    cause_of_death = Column(String, nullable=False)
    created_at = Column(DateTime, nullable=False)
    buried_at = Column(DateTime, default=datetime.utcnow)
    is_resurrected = Column(Boolean, default=False)

Base.metadata.create_all(bind=engine)

# Schemas
class BuryTabRequest(BaseModel):
    title: str
    url: str
    cause_of_death: CauseOfDeath

app = FastAPI(
    title="Tab Graveyard API",
    description="Backend service to bury abandoned browser tabs and calculate mortality statistics."
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows requests from Vite/React frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Endpoints
@app.post("/bury", status_code=201)
def bury_tab(req: BuryTabRequest, db: Session = Depends(get_db)):
    opened_time = datetime.utcnow() - timedelta(hours=1)
    tab = TabModel(
        title=req.title,
        url=req.url,
        cause_of_death=req.cause_of_death.value,
        created_at=opened_time,
        buried_at=datetime.utcnow()
    )
    db.add(tab)
    db.commit()
    db.refresh(tab)
    return {"message": f"Tab '{tab.title}' buried successfully!", "tab_id": tab.id}

@app.get("/graveyard")
def get_graveyard(db: Session = Depends(get_db)):
    return db.query(TabModel).filter(TabModel.is_resurrected == False).all()

@app.get("/graveyard/stats")
def get_stats(db: Session = Depends(get_db)):
    tabs = db.query(TabModel).all()
    if not tabs:
        return {"total_buried_tabs": 0, "average_lifespan_minutes": 0, "most_common_cause_of_death": "None"}

    lifespans = [(t.buried_at - t.created_at).total_seconds() / 60.0 for t in tabs]
    avg_lifespan = sum(lifespans) / len(lifespans)

    causes = [t.cause_of_death for t in tabs]
    most_common = Counter(causes).most_common(1)[0][0]

    return {
        "total_buried_tabs": len(tabs),
        "average_lifespan_minutes": round(avg_lifespan, 2),
        "most_common_cause_of_death": most_common
    }

@app.get("/graveyard/oldest")
def get_oldest_tab(db: Session = Depends(get_db)):
    tabs = db.query(TabModel).filter(TabModel.is_resurrected == False).all()
    if not tabs:
        raise HTTPException(status_code=404, detail="Graveyard is empty")
    oldest = max(tabs, key=lambda t: (t.buried_at - t.created_at).total_seconds())
    return oldest

@app.post("/resurrect/{id}")
def resurrect_tab(id: int, db: Session = Depends(get_db)):
    tab = db.query(TabModel).filter(TabModel.id == id).first()
    if not tab:
        raise HTTPException(status_code=404, detail="Tab not found")
    if tab.is_resurrected:
        raise HTTPException(status_code=400, detail="Tab is already resurrected")

    if datetime.utcnow() - tab.buried_at > timedelta(minutes=10):
        raise HTTPException(status_code=400, detail="Grace period (10 mins) expired! Cannot resurrect.")

    tab.is_resurrected = True
    db.commit()
    return {"message": f"Tab '{tab.title}' has been resurrected!"}