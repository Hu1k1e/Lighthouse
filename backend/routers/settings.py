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

class RemoteHostCreate(BaseModel):
    url: str
    api_key: str

@router.get("/remote-hosts")
def get_remote_hosts(db: Session = Depends(get_db)):
    from models import RemoteHost
    hosts = db.query(RemoteHost).all()
    return {"hosts": [{"id": h.id, "url": h.url} for h in hosts]}

@router.post("/remote-hosts")
def add_remote_host(host_data: RemoteHostCreate, db: Session = Depends(get_db)):
    from models import RemoteHost
    # Check if exists
    existing = db.query(RemoteHost).filter(RemoteHost.url == host_data.url).first()
    if existing:
        existing.api_key = host_data.api_key
    else:
        new_host = RemoteHost(url=host_data.url, api_key=host_data.api_key)
        db.add(new_host)
    
    db.commit()
    return {"status": "success"}

@router.delete("/remote-hosts/{host_id}")
def delete_remote_host(host_id: int, db: Session = Depends(get_db)):
    from models import RemoteHost
    host = db.query(RemoteHost).filter(RemoteHost.id == host_id).first()
    if host:
        db.delete(host)
        db.commit()
    return {"status": "success"}
