import docker

def get_local_containers():
    try:
        client = docker.from_env()
        containers = client.containers.list(all=True)
        result = []
        for c in containers:
            image_tag = c.image.tags[0] if c.image.tags else c.image.id
            repo_digests = c.image.attrs.get('RepoDigests', [])
            digest = None
            if repo_digests:
                # E.g. 'nginx@sha256:abcd...'
                digest_parts = repo_digests[0].split('@')
                if len(digest_parts) > 1:
                    digest = digest_parts[1]

            result.append({
                "id": c.short_id,
                "name": c.name,
                "image": image_tag,
                "state": c.status,
                "status": "up-to-date",
                "digest": digest
            })
        return result
    except Exception as e:
        print(f"Error communicating with Docker: {e}")
        return []
