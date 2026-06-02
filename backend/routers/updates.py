from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import UpdateHistory
from services.docker_client import get_local_containers
from services.registry_client import get_latest_tag, get_remote_digest
from services.changelog_parser import get_changelog_summary
from services.notifications import trigger_webhook

router = APIRouter()

# Mock webhook URL
WEBHOOK_URL = "https://discord.com/api/webhooks/mock_url"

@router.post("/scan")
def scan_for_updates(db: Session = Depends(get_db)):
    containers = get_local_containers()
    updates_found = []
    
    for c in containers:
        image = c["image"] # e.g. "nginx:latest"
        current_version = image.split(":")[1] if ":" in image else "latest"
        local_digest = c.get("digest")
        
        latest_tag = None
        remote_digest = None
        has_update = False
        
        if current_version == "latest" or current_version == "nightly":
            # For moving tags, check digest
            remote_digest = get_remote_digest(image)
            if remote_digest and local_digest and remote_digest != local_digest:
                has_update = True
                latest_tag = "latest"
        else:
            # For semver tags
            latest_tag = get_latest_tag(image)
            if latest_tag and latest_tag != current_version:
                has_update = True
                
        if has_update:
            changelog = get_changelog_summary(image, latest_tag or current_version)
            
            # Check if we already recorded this exact update
            existing = db.query(UpdateHistory).filter(
                UpdateHistory.container_id == c["id"],
                UpdateHistory.version_tag == (latest_tag or current_version),
                UpdateHistory.digest == remote_digest
            ).first()
            
            if not existing:
                # Record to history
                history_entry = UpdateHistory(
                    container_id=c["id"],
                    image=image,
                    version_tag=latest_tag or current_version,
                    digest=remote_digest,
                    changelog_summary=changelog
                )
                db.add(history_entry)
                db.commit()
                
                update_info = {
                    "container_id": c["id"],
                    "name": c["name"],
                    "image": image,
                    "current_version": current_version,
                    "latest_version": latest_tag or "new digest available",
                    "changelog": changelog
                }
                updates_found.append(update_info)
                trigger_webhook(update_info, db)
            
    return {"status": "success", "updates": updates_found}
