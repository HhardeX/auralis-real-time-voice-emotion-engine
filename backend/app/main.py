from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.sessions import router as sessions_router
from app.api.transcription import router as transcription_router

app = FastAPI(
    title="Auralis API",
    description="Real-time voice-to-voice emotion engine API.",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sessions_router)
app.include_router(transcription_router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "auralis-api"}


@app.get("/")
async def root() -> dict[str, str]:
    return {
        "message": "Auralis API is running",
        "version": "0.2.0",
    }
