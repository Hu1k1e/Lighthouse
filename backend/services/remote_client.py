import requests

def get_remote_containers(host_url: str, api_key: str):
    try:
        headers = {"X-API-Key": api_key}
        response = requests.get(f"{host_url}/api/containers", headers=headers, timeout=10)
        if response.status_code == 200:
            return response.json()
        return []
    except Exception as e:
        print(f"Error fetching remote containers from {host_url}: {e}")
        return []
