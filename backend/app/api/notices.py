from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.core.auth import get_current_user, get_db
from app.models import User, Notice
from app.services.ai_service import generate_ai_response

router = APIRouter(prefix="/api/notices", tags=["Notices"])


class NoticeRequest(BaseModel):
    topic: str = Field(min_length=2, max_length=200)
    details: str = Field(min_length=2, max_length=1000)


@router.post("/generate")
def generate_notice(
    request: NoticeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    prompt = f"""
    Write a formal college notice.

    Topic: {request.topic}
    Details: {request.details}

    Include:
    - A clear heading
    - Formal announcement
    - Important details
    - Date or deadline if provided
    - A polite closing

    Do not invent dates or facts.
    """

    try:
        content = generate_ai_response(prompt)
    except Exception:
        raise HTTPException(
            status_code=503,
            detail="Local AI is unavailable. Please check Ollama."
        )

    notice = Notice(
        user_id=current_user.id,
        title=request.topic,
        content=content
    )

    db.add(notice)
    db.commit()
    db.refresh(notice)

    return {
        "message": "Notice generated successfully!",
        "notice": {
            "id": notice.id,
            "title": notice.title,
            "content": notice.content
        }
    }


@router.get("/")
def get_notices(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notices = (
        db.query(Notice)
        .filter(Notice.user_id == current_user.id)
        .order_by(Notice.created_at.desc())
        .all()
    )

    return {
        "notices": [
            {
                "id": n.id,
                "title": n.title,
                "content": n.content,
                "created_at": n.created_at
            }
            for n in notices
        ]
    }


@router.delete("/{notice_id}")
def delete_notice(
    notice_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notice = (
        db.query(Notice)
        .filter(
            Notice.id == notice_id,
            Notice.user_id == current_user.id
        )
        .first()
    )

    if notice is None:
        raise HTTPException(status_code=404, detail="Notice not found")

    db.delete(notice)
    db.commit()

    return {"message": "Notice deleted successfully!"}