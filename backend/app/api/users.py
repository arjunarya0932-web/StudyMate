
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.db.database import SessionLocal
from app.models import User
from app.schemas.user import UserCreate, UserLogin
from app.core.security import hash_password, verify_password
from app.core.jwt import create_access_token
from app.core.rate_limiter import limiter

router = APIRouter(
    prefix="/api/users",
    tags=["Users"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/signup")
@limiter.limit("5/minute")
def signup(request: Request, user_data: UserCreate, db: Session = Depends(get_db)):

    existing_user = db.query(User).filter(
        User.email == user_data.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    new_user = User(
        name=user_data.name,
        email=user_data.email,
        hashed_password=hash_password(user_data.password)
    )

    db.add(new_user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    db.refresh(new_user)

    return {
        "message": "Account created successfully!",
        "user": {
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email
        }
    }


@router.post("/login")
@limiter.limit("10/minute")
def login(request: Request, user_data: UserLogin, db: Session = Depends(get_db)):

    user = db.query(User).filter(
        User.email == user_data.email
    ).first()

    if not user or not verify_password(
        user_data.password,
        user.hashed_password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    access_token = create_access_token(
        data={"sub": str(user.id)}
    )

    return {
        "message": "Login successful!",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email
        }
    }


@router.get("/")
def get_users():
    return {
        "message": "Users API is working!"
    }

from app.core.auth import get_current_user

@router.get("/me")
def get_my_profile(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email
    }