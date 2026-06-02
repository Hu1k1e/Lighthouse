from fastapi import APIRouter
from services.docker_client import get_local_containers
from services.remote_client import get_remote_containers

router = APIRouter()

# Mock remote hosts
REMOTE_HOSTS = [
    {"url": "http://helper:8000", "api_key": "default_secret_key"}
]

@router.get("/")
def list_containers():
    containers = get_local_containers()
    
    for host in REMOTE_HOSTS:
        remote_containers = get_remote_containers(host["url"], host["api_key"])
        for rc in remote_containers:
            rc["name"] = f"[Remote] {rc['name']}"
            containers.append(rc)
            
    return {"containers": containers}
