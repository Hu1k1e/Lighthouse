from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import containers, updates

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

@app.get("/api/health")
def health_check():
    return {"status": "ok"}
