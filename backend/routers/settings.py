from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import NotificationTrigger

router = APIRouter()

class TriggerUpdate(BaseModel):
    platform: str
    webhook_url: str
    enabled: bool

@router.get("/triggers")
def get_triggers(db: Session = Depends(get_db)):
    triggers = db.query(NotificationTrigger).all()
    return {"triggers": [{"id": t.id, "platform": t.platform, "webhook_url": t.webhook_url, "enabled": t.enabled} for t in triggers]}

@router.post("/triggers")
def set_trigger(trigger_data: TriggerUpdate, db: Session = Depends(get_db)):
    existing = db.query(NotificationTrigger).filter(NotificationTrigger.platform == trigger_data.platform).first()
    
    if existing:
        existing.webhook_url = trigger_data.webhook_url
        existing.enabled = trigger_data.enabled
    else:
        new_trigger = NotificationTrigger(
            platform=trigger_data.platform,
            webhook_url=trigger_data.webhook_url,
            enabled=trigger_data.enabled
        )
        db.add(new_trigger)
    
    db.commit()
    return {"status": "success"}
