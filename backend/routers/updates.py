from fastapi import APIRouter
from services.docker_client import get_local_containers
from services.registry_client import get_latest_tag
from services.changelog_parser import get_changelog_summary
from services.notifications import trigger_webhook

router = APIRouter()

# Mock webhook URL
WEBHOOK_URL = "https://discord.com/api/webhooks/mock_url"

@router.post("/scan")
def scan_for_updates():
    containers = get_local_containers()
    updates_found = []
    
    for c in containers:
        image = c["image"]
        current_version = image.split(":")[1] if ":" in image else "latest"
        latest_tag = get_latest_tag(image)
        
        if latest_tag and latest_tag != current_version and current_version != "latest":
            changelog = get_changelog_summary(image, latest_tag)
            update_info = {
                "container_id": c["id"],
                "name": c["name"],
                "image": image,
                "current_version": current_version,
                "latest_version": latest_tag,
                "changelog": changelog
            }
            updates_found.append(update_info)
            trigger_webhook(WEBHOOK_URL, update_info)
            
    return {"status": "success", "updates": updates_found}
