import os
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from livekit import api
from typing import Optional

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Environment variables
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY", "devkey")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET", "secret")
LIVEKIT_URL = os.getenv("LIVEKIT_API_URL", "http://livekit:7880")

class TokenRequest(BaseModel):
    room_name: str
    participant_name: str
    passcode: Optional[str] = None

class AccessCheckResponse(BaseModel):
    hasAccess: bool
    role: str

from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print(f"VALIDATION ERROR Body: {exc.body}")
    print(f"VALIDATION ERRORS: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": str(exc.body)},
    )

@app.get("/")
async def root():
    return {"message": "LiveKit Conference Backend"}

@app.post("/api/token")
async def get_token(req: TokenRequest):
    """
    Generate a LiveKit access token for a participant.
    """
    if not req.room_name or not req.participant_name:
        raise HTTPException(status_code=400, detail="Missing room_name or participant_name")

    # In a real app, you would verify the passcode or user session here.
    
    grant = api.VideoGrants(
        room_join=True,
        room=req.room_name,
    )
    
    token = (
        api.AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
        .with_identity(req.participant_name)
        .with_name(req.participant_name)
        .with_grants(grant)
        .with_ttl("24h")
    )
    
    return {"token": token.to_jwt()}

@app.get("/api/call/{call_id}/access")
async def check_access(call_id: str):
    """
    Check if the user has access to the call.
    """
    # Mock logic: Start with 'demo' calls are allowed.
    if call_id.startswith("demo"):
        return AccessCheckResponse(hasAccess=True, role="ORGANIZER")
    
    # Allow all for now in this dev version
    return AccessCheckResponse(hasAccess=True, role="PARTICIPANT")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
