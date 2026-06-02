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
    from models import RemoteHost
    from services.remote_client import get_remote_containers
    
    containers = get_local_containers()
    remote_hosts = db.query(RemoteHost).all()
    for host in remote_hosts:
        rcs = get_remote_containers(host.url, host.api_key)
        for rc in rcs:
            rc["name"] = f"[Remote] {rc['name']}"
            containers.append(rc)
            
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
                new_hist = UpdateHistory(
                    container_id=c["id"],
                    image=image,
                    version_tag=latest_tag or current_version,
                    changelog_summary=changelog,
                    digest=remote_digest
                )
                db.add(new_hist)
                db.commit()
                
                updates_found.append({
                    "container_id": c["id"],
                    "image": image,
                    "latest_version": latest_tag or current_version
                })
                
                # Execute notification triggers
                try:
                    from services.notifications import send_update_notification
                    send_update_notification(db, c["name"], image, current_version, latest_tag or current_version, changelog)
                except Exception as e:
                    print(f"Failed to send notifications: {e}")
            else:
                # Overwrite the stub string with actual fetched release notes if we finally got them
                if "brings performance improvements, bug fixes" in existing.changelog_summary:
                    existing.changelog_summary = changelog
                    db.commit()
            
    return {"status": "success", "updates": updates_found}
