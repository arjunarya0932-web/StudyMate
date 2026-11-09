from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.core.auth import get_current_user, get_db
from app.models import User, Note
from app.services.ai_service import generate_ai_response

router = APIRouter(
    prefix="/api/notes",
    tags=["Notes"]
)


class NoteRequest(BaseModel):
    topic: str = Field(min_length=2, max_length=200)


@router.post("/generate")
def generate_notes(
    request: NoteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    prompt = (
        f"Create clear, well-structured study notes on: {request.topic}. "
        "Use headings, bullet points, important definitions and examples. "
        "Keep the notes accurate and student-friendly."
    )

    try:
        notes_content = generate_ai_response(prompt)
    except Exception:
        raise HTTPException(
            status_code=503,
            detail="Local AI is unavailable. Please check that Ollama is running."
        )

    new_note = Note(
        user_id=current_user.id,
        title=request.topic,
        content=notes_content
    )

    db.add(new_note)
    db.commit()
    db.refresh(new_note)

    return {
        "message": "Study notes generated successfully!",
        "note": {
            "id": new_note.id,
            "title": new_note.title,
            "content": new_note.content
        }
    }

@router.get("/")
def get_my_notes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notes = (
        db.query(Note)
        .filter(Note.user_id == current_user.id)
        .order_by(Note.created_at.desc())
        .all()
    )

    return {
        "notes": [
            {
                "id": note.id,
                "title": note.title,
                "content": note.content,
                "created_at": note.created_at
            }
            for note in notes
        ]
    }


class ManualNoteRequest(BaseModel):
    content: str = Field(..., min_length=1)
    title: str | None = Field(None, max_length=255)


def _generate_title(content: str) -> str:
    """Generate a sensible title from note content."""
    # Try to extract first meaningful line
    lines = [line.strip() for line in content.split('\n') if line.strip()]
    for line in lines:
        # Skip lines that look like continuation or markdown artifacts
        if len(line) > 10 and not line.startswith(('#', '-', '*', '•')):
            title = line[:100]
            return title if len(title) > 5 else "Untitled Note"
    # Fallback to first 100 chars of first substantial line
    for line in lines:
        if len(line) > 20:
            return line[:100]
    return content[:100] if len(content) > 100 else content


@router.post("/")
def create_note(
    request: ManualNoteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    title = request.title or _generate_title(request.content)

    new_note = Note(
        user_id=current_user.id,
        title=title,
        content=request.content
    )

    db.add(new_note)
    db.commit()
    db.refresh(new_note)

    return {
        "message": "Note saved successfully!",
        "note": {
            "id": new_note.id,
            "title": new_note.title,
            "content": new_note.content,
            "created_at": new_note.created_at
        }
    }


class UpdateNoteRequest(BaseModel):
    content: str | None = Field(None, min_length=1)
    title: str | None = Field(None, max_length=255)


@router.put("/{note_id}")
def update_note(
    note_id: int,
    request: UpdateNoteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    note = (
        db.query(Note)
        .filter(
            Note.id == note_id,
            Note.user_id == current_user.id
        )
        .first()
    )

    if note is None:
        raise HTTPException(
            status_code=404,
            detail="Note not found"
        )

    if request.title is not None:
        note.title = request.title
    if request.content is not None:
        note.content = request.content
        # Regenerate title from content if not explicitly set
        if request.title is None:
            note.title = _generate_title(request.content)

    db.commit()
    db.refresh(note)

    return {
        "message": "Note updated successfully!",
        "note": {
            "id": note.id,
            "title": note.title,
            "content": note.content,
            "created_at": note.created_at
        }
    }


@router.delete("/{note_id}")
def delete_note(
    note_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    note = (
        db.query(Note)
        .filter(
            Note.id == note_id,
            Note.user_id == current_user.id
        )
        .first()
    )

    if note is None:
        raise HTTPException(
            status_code=404,
            detail="Note not found"
        )

    db.delete(note)
    db.commit()

    return {
        "message": "Note deleted successfully!"
    }