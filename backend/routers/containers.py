from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import UpdateHistory
from services.docker_client import get_local_containers
from services.remote_client import get_remote_containers

router = APIRouter()

@router.get("/")
def list_containers(db: Session = Depends(get_db)):
    from models import RemoteHost
    containers = get_local_containers()
    
    remote_hosts = db.query(RemoteHost).all()
    for host in remote_hosts:
        remote_containers = get_remote_containers(host.url, host.api_key)
        for rc in remote_containers:
            rc["name"] = f"[Remote] {rc['name']}"
            containers.append(rc)
            
    # Check DB for pending updates
    for c in containers:
        latest_history = db.query(UpdateHistory).filter(
            UpdateHistory.container_id == c["id"]
        ).order_by(UpdateHistory.timestamp.desc()).first()
        
        if latest_history:
            c["status"] = "update_available"
            if latest_history.version_tag != "latest":
                c["latest"] = latest_history.version_tag
            else:
                c["latest"] = f"latest ({latest_history.digest[:12]})" if latest_history.digest else "new update available"
        else:
            c["status"] = "up-to-date"
            
    return {"containers": containers}

@router.get("/{container_id}/history")
def get_container_history(container_id: str, db: Session = Depends(get_db)):
    history = db.query(UpdateHistory).filter(
        UpdateHistory.container_id == container_id
    ).order_by(UpdateHistory.timestamp.desc()).all()
    
    return {"history": [{"version": h.version_tag, "changelog": h.changelog_summary, "timestamp": h.timestamp, "digest": h.digest} for h in history]}
