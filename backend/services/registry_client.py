import requests
import re
import docker

def get_remote_digest(image_name: str) -> str:
    """
    Uses the local docker daemon to fetch remote registry digest for an image.
    This automatically handles authentication if the daemon is logged in, and works for GHCR/DockerHub/etc.
    """
    try:
        client = docker.from_env()
        # image_name should be fully qualified, e.g. "nginx:latest"
        registry_data = client.images.get_registry_data(image_name)
        # registry_data.id is the sha256 digest
        return registry_data.id
    except Exception as e:
        print(f"Error fetching remote digest for {image_name}: {e}")
        return None

def get_latest_tag(image_name: str) -> str:
    """
    Very basic registry scanner for Docker Hub.
    In a real app, you'd handle auth, pagination, GHCR, etc.
    """
    try:
        # e.g., 'linuxserver/plex:latest' -> 'linuxserver/plex'
        image_no_tag = image_name.split(':')[0]
        
        # Don't try to query hub.docker.com for ghcr.io images for tags
        if "ghcr.io" in image_no_tag or "lscr.io" in image_no_tag:
            return None

        if "/" not in image_no_tag:
            # Official docker hub image e.g., 'nginx' -> 'library/nginx'
            repo = f"library/{image_no_tag}"
        else:
            repo = image_no_tag

        # Docker hub registry API
        url = f"https://registry.hub.docker.com/v2/repositories/{repo}/tags?page_size=50"
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            tags = [t['name'] for t in data.get('results', [])]
            # Filter out 'latest' or 'nightly' if we want SemVer. 
            for tag in tags:
                if tag != 'latest' and re.match(r'^[vV]?\d+(\.\d+)*.*$', tag):
                    return tag
    except Exception as e:
        print(f"Error checking registry for {image_name}: {e}")
    return None
