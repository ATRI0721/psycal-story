from fastapi import APIRouter, BackgroundTasks, Body, HTTPException
from app.apis.user import generate_user_response
from app.core.deps import CurrentUser
from app.models.interfaces import AuthEmailVerification, UserResponse

router = APIRouter(tags=["auth"], prefix="/auth")

@router.post("/send-verification/{type}")
def send_verification(type: str, email: str = Body(embed=True)):
    return {"message": "Verification code sent"}

@router.post("/verify-verification")
def verify_verification(email_verification: AuthEmailVerification):
    return {"message": "Email verified", "valid": True}

@router.get("/verify", response_model=UserResponse)
def verify(user: CurrentUser):
    return generate_user_response(user)

@router.get("/refresh-token", response_model=UserResponse)
def refresh_token(user: CurrentUser):
    return generate_user_response(user)