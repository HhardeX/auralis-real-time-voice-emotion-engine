from fastapi import FastAPI

from app.api.sessions import router as sessions_router


app = FastAPI(
    title="Auralis API",
    description="Real-time voice-to-voice emotion engine API.",
    version="0.1.0",
)


app.include_router(sessions_router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "auralis-api",
    }


@app.get("/")
async def root() -> dict[str, str]:
    return {
        "message": "Auralis API is running",
        "version": "0.1.0",
    }
