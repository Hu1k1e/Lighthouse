import requests

def trigger_webhook(webhook_url: str, update_info: dict):
    payload = {
        "content": f"🚀 **Update Available!**\n**Container:** {update_info['name']}\n**Image:** {update_info['image']}\n**Version:** {update_info['current_version']} ➡️ {update_info['latest_version']}\n\n**Changelog:**\n{update_info['changelog']}"
    }
    try:
        requests.post(webhook_url, json=payload)
        print(f"Trigger fired for {update_info['name']}")
    except Exception as e:
        print(f"Error firing webhook: {e}")
