from fastapi import APIRouter, HTTPException

from app.core.deps import CurrentUser, SessionDep
from app.core.security import create_access_token, verify_password
from app.curd import add_user, get_user_by_email, update_user_password
import app.curd as curd
from app.models.database import User
from app.models.interfaces import (
    UserCreate,
    UserLoginPassword,
    UserLoginCode,
    UserResetPassword,
    UserResponse,
    UserLoginResponse,
)

router = APIRouter(tags=["user"], prefix="/user")


@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, session: SessionDep):
    user_db = add_user(user, session)
    if not user_db:
        raise HTTPException(status_code=400, detail="User already exists")
    return generate_user_response(user_db)


@router.post("/login/code", response_model=UserResponse)
def login_code(user: UserLoginCode, session: SessionDep):
    user_db = get_user_by_email(user.email, session)
    if not user_db:
        raise HTTPException(status_code=400, detail="User not found")
    return generate_user_response(user_db)


@router.post("/login/password", response_model=UserResponse)
def login_password(user: UserLoginPassword, session: SessionDep):
    user_db = get_user_by_email(user.email, session)
    if not user_db:
        raise HTTPException(status_code=400, detail="User not found")
    if not verify_password(user.password, user_db.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid password")
    return generate_user_response(user_db)


@router.post("/reset-password")
def reset_password(user: UserResetPassword, session: SessionDep):
    user_db = get_user_by_email(user.email, session)
    if not user_db:
        raise HTTPException(status_code=400, detail="User not found")
    update_user_password(user_db, user.new_password, session)
    return {"message": "Password updated"}


@router.delete("/delete")
def delete_user(user: CurrentUser, session: SessionDep):
    curd.delete_user(user, session)
    return {"message": "User deleted"}


# --- 辅助函数 ---
def generate_user_response(user: User) -> UserResponse:
    user_response = UserLoginResponse.model_validate(user)
    access_token = create_access_token(user_response.id)
    return UserResponse(user=user_response, access_token=access_token)
