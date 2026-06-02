from fastapi import FastAPI, Depends, HTTPException, Security
from fastapi.security.api_key import APIKeyHeader
import docker
import os

app = FastAPI(title="Docker Update Checker - Helper")

API_KEY = os.environ.get("HELPER_API_KEY", "default_secret_key")
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

async def get_api_key(api_key_header: str = Security(api_key_header)):
    if api_key_header == API_KEY:
        return api_key_header
    raise HTTPException(status_code=403, detail="Could not validate credentials")

@app.get("/api/containers")
def list_containers(api_key: str = Depends(get_api_key)):
    try:
        client = docker.from_env()
        containers = client.containers.list(all=True)
        result = []
        for c in containers:
            repo_digests = c.image.attrs.get('RepoDigests', [])
            digest = None
            if repo_digests:
                digest_parts = repo_digests[0].split('@')
                if len(digest_parts) > 1:
                    digest = digest_parts[1]
                    
            result.append({
                "id": c.short_id,
                "name": c.name,
                "image": c.image.tags[0] if c.image.tags else c.image.id,
                "state": c.status,
                "digest": digest
            })
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
