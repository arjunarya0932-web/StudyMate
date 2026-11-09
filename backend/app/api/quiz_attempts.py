
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.core.auth import get_current_user, get_db
from app.models import User, QuizAttempt

router = APIRouter(
    prefix="/api/quiz-attempts",
    tags=["Quiz Attempts"]
)


class QuizAttemptRequest(BaseModel):
    subject: str = Field(min_length=1, max_length=255)
    chapter: str = Field(min_length=1, max_length=255)
    score: int = Field(ge=0)
    total_questions: int = Field(gt=0)

@router.get("/")
def get_quiz_attempts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    attempts = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.user_id == current_user.id)
        .order_by(QuizAttempt.created_at.desc())
        .all()
    )

    return [
        {
            "id": attempt.id,
            "subject": attempt.subject,
            "chapter": attempt.chapter,
            "score": attempt.score,
            "total_questions": attempt.total_questions,
            "percentage": attempt.percentage,
            "created_at": attempt.created_at
        }
        for attempt in attempts
    ]
@router.post("/")
def save_quiz_attempt(
    request: QuizAttemptRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if request.score > request.total_questions:
        raise HTTPException(
            status_code=400,
            detail="Score cannot exceed total questions."
        )

    percentage = round(
        (request.score / request.total_questions) * 100
    )

    attempt = QuizAttempt(
        user_id=current_user.id,
        subject=request.subject,
        chapter=request.chapter,
        score=request.score,
        total_questions=request.total_questions,
        percentage=percentage
    )

    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    return {
        "message": "Quiz score saved successfully!",
        "attempt": {
            "id": attempt.id,
            "subject": attempt.subject,
            "chapter": attempt.chapter,
            "score": attempt.score,
            "total_questions": attempt.total_questions,
            "percentage": attempt.percentage
        }
    }
