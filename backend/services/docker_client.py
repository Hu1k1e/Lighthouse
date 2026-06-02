import docker

def get_local_containers():
    try:
        client = docker.from_env()
        containers = client.containers.list(all=True)
        result = []
        for c in containers:
            result.append({
                "id": c.short_id,
                "name": c.name,
                "image": c.image.tags[0] if c.image.tags else c.image.id,
                "state": c.status,
                "status": "up-to-date" # Placeholder until we implement update checking
            })
        return result
    except Exception as e:
        print(f"Error communicating with Docker: {e}")
        return []
