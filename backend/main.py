from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import containers, updates, settings, releases
import models
from database import engine

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Docker Update Checker")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(containers.router, prefix="/api/containers", tags=["containers"])
app.include_router(updates.router, prefix="/api/updates", tags=["updates"])
app.include_router(settings.router, prefix="/api/settings", tags=["settings"])
app.include_router(releases.router, prefix="/api/releases", tags=["releases"])

@app.get("/api/health")
def health_check():
    return {"status": "ok"}
