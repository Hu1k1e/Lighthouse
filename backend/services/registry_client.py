import requests
import re

def get_latest_tag(image_name: str) -> str:
    """
    Very basic registry scanner for Docker Hub.
    In a real app, you'd handle auth, pagination, GHCR, etc.
    """
    try:
        # e.g., 'linuxserver/plex:latest' -> 'linuxserver/plex'
        image_no_tag = image_name.split(':')[0]
        
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
