from fastapi import APIRouter
from services.registry_client import get_remote_history
from urllib.parse import unquote

router = APIRouter()

@router.get("/{image_encoded}")
def get_container_releases(image_encoded: str):
    image_name = unquote(image_encoded)
    releases = get_remote_history(image_name)
    return {"releases": releases}
