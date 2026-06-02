import requests

def _get_repo_name(image_name: str) -> str:
    # Remove registry prefix if present
    img = image_name.split(':')[0]
    if img.startswith('ghcr.io/'):
        return img.replace('ghcr.io/', '')
    
    # Strip docker hub prefixes
    img = img.replace('lscr.io/', '')
    img = img.replace('docker.io/', '')
    
    parts = img.split('/')
    if len(parts) == 1:
        # official image
        return f"docker-library/{parts[0]}"
    elif len(parts) >= 2:
        owner = parts[-2]
        repo = parts[-1]
        if owner == 'linuxserver':
            return f"linuxserver/docker-{repo}"
        return f"{owner}/{repo}"
    return ""

def get_changelog_summary(image_name: str, new_version: str):
    repo = _get_repo_name(image_name)
    if not repo:
        return f"Update {new_version} available. Check repository for details."
        
    try:
        url = f"https://api.github.com/repos/{repo}/releases"
        headers = {"Accept": "application/vnd.github.v3+json"}
        # Setting a short timeout to prevent blocking during scans
        response = requests.get(url, headers=headers, timeout=5)
        
        if response.status_code == 200:
            releases = response.json()
            # Try to find a release that matches the new_version tag
            for release in releases:
                tag = release.get("tag_name", "")
                if tag == new_version or tag == f"v{new_version}" or new_version in tag:
                    body = release.get("body", "")
                    if body:
                        if len(body) > 1000:
                            return body[:1000] + "...\n\n(Truncated for length)"
                        return body
                        
            # If no specific release matches, grab the latest release body as a fallback
            if releases and len(releases) > 0 and releases[0].get("body"):
                body = releases[0].get("body")
                return f"Latest Release Notes (v{releases[0].get('tag_name')}):\n\n{body}"[:1000]
                
    except Exception as e:
        print(f"Error fetching changelog for {repo}: {e}")
        
    return f"Update {new_version} for {image_name} is available. No rich release notes could be automatically extracted from GitHub."
