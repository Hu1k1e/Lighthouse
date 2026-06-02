from sqlalchemy import Column, Integer, String, Boolean, DateTime
from database import Base
import datetime

class Container(Base):
    __tablename__ = "containers"

    id = Column(Integer, primary_key=True, index=True)
    container_id = Column(String, unique=True, index=True)
    name = Column(String, index=True)
    image = Column(String)
    current_version = Column(String)
    latest_version = Column(String, nullable=True)
    update_available = Column(Boolean, default=False)
    last_checked = Column(DateTime, default=datetime.datetime.utcnow)

class UpdateHistory(Base):
    __tablename__ = "update_history"

    id = Column(Integer, primary_key=True, index=True)
    container_id = Column(String, index=True)
    image = Column(String)
    version_tag = Column(String)
    digest = Column(String, nullable=True)
    changelog_summary = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class NotificationTrigger(Base):
    __tablename__ = "notification_triggers"

    id = Column(Integer, primary_key=True, index=True)
    platform = Column(String, index=True) # "discord" or "ntfy"
    webhook_url = Column(String)
    enabled = Column(Boolean, default=True)

class RemoteHost(Base):
    __tablename__ = "remote_hosts"

    id = Column(Integer, primary_key=True, index=True)
    url = Column(String, unique=True, index=True)
    api_key = Column(String)
