from uuid import uuid4

from fastapi import APIRouter
from pydantic import BaseModel


router = APIRouter(prefix="/api/sessions", tags=["Sessions"])


class SessionResponse(BaseModel):
    session_id: str
    status: str


@router.post("", response_model=SessionResponse)
async def create_session() -> SessionResponse:
    return SessionResponse(
        session_id=str(uuid4()),
        status="created",
    )
