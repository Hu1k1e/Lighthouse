import requests
from sqlalchemy.orm import Session
from models import NotificationTrigger

def trigger_webhook(update_info: dict, db: Session):
    triggers = db.query(NotificationTrigger).filter(NotificationTrigger.enabled == True).all()
    
    for trigger in triggers:
        try:
            if trigger.platform == "discord":
                payload = {
                    "content": f"🚀 **Update Available!**\n**Container:** {update_info['name']}\n**Image:** {update_info['image']}\n**Version:** {update_info['current_version']} ➡️ {update_info['latest_version']}\n\n**Changelog:**\n{update_info['changelog']}"
                }
                requests.post(trigger.webhook_url, json=payload, timeout=5)
            elif trigger.platform == "ntfy":
                headers = {"Title": f"Update Available for {update_info['name']}"}
                data = f"Version: {update_info['current_version']} -> {update_info['latest_version']}\n\n{update_info['changelog']}"
                requests.post(trigger.webhook_url, data=data.encode('utf-8'), headers=headers, timeout=5)
            
            print(f"Trigger fired for {update_info['name']} on {trigger.platform}")
        except Exception as e:
            print(f"Error firing {trigger.platform} webhook: {e}")
