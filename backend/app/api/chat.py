from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.auth import get_current_user, get_db
from app.models import User, ChatMessage
from app.services.ai_service import generate_ai_response


router = APIRouter(
    prefix="/api/chat",
    tags=["Chat"]
)


@router.post("/message")
def send_message(
    message: str,
    conversation_id: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    message = message.strip()

    if not message:
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty."
        )

    if conversation_id:
        existing = (
            db.query(ChatMessage)
            .filter(
                ChatMessage.user_id == current_user.id,
                ChatMessage.conversation_id == conversation_id
            )
            .first()
        )

        if not existing:
            raise HTTPException(
                status_code=404,
                detail="Conversation not found."
            )
    else:
        conversation_id = str(uuid4())

    previous_messages = (
        db.query(ChatMessage)
        .filter(
            ChatMessage.user_id == current_user.id,
            ChatMessage.conversation_id == conversation_id
        )
        .order_by(ChatMessage.created_at.desc())
        .limit(10)
        .all()
    )

    history = [
        {
            "role": item.role,
            "content": item.content
        }
        for item in reversed(previous_messages)
    ]

    new_message = ChatMessage(
        user_id=current_user.id,
        conversation_id=conversation_id,
        role="user",
        content=message
    )

    db.add(new_message)
    db.commit()
    db.refresh(new_message)

    try:
        ai_reply = generate_ai_response(message, history)
    except Exception:
        raise HTTPException(
            status_code=503,
            detail="Local AI is unavailable. Please check that Ollama is running."
        )

    assistant_message = ChatMessage(
        user_id=current_user.id,
        conversation_id=conversation_id,
        role="assistant",
        content=ai_reply
    )

    db.add(assistant_message)
    db.commit()
    db.refresh(assistant_message)

    return {
        "conversation_id": conversation_id,
        "user_message": {
            "id": new_message.id,
            "role": new_message.role,
            "content": new_message.content
        },
        "assistant_message": {
            "id": assistant_message.id,
            "role": assistant_message.role,
            "content": assistant_message.content
        }
    }


@router.get("/conversations")
def get_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == current_user.id)
        .order_by(ChatMessage.created_at.desc())
        .all()
    )

    grouped = {}

    for msg in messages:
        # All older messages without an ID stay together
        key = msg.conversation_id or "legacy"

        if key not in grouped:
            grouped[key] = {
                "conversation_id": key,
                "title": "Previous conversation" if key == "legacy" else msg.content[:45],
                "updated_at": msg.created_at
            }

        if msg.role == "user":
            grouped[key]["title"] = msg.content[:45]

    return {
        "conversations": list(grouped.values())
    }


@router.get("/history")
def get_chat_history(
    conversation_id: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(ChatMessage).filter(
        ChatMessage.user_id == current_user.id
    )

    if conversation_id == "legacy":
        query = query.filter(ChatMessage.conversation_id.is_(None))
    elif conversation_id:
        query = query.filter(
            ChatMessage.conversation_id == conversation_id
        )

    messages = query.order_by(ChatMessage.created_at.asc()).all()

    return {
        "messages": [
            {
                "id": msg.id,
                "role": msg.role,
                "content": msg.content,
                "created_at": msg.created_at
            }
            for msg in messages
        ]
    }


@router.delete("/conversations/{conversation_id}")
def delete_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(ChatMessage).filter(
        ChatMessage.user_id == current_user.id
    )

    if conversation_id == "legacy":
        query = query.filter(ChatMessage.conversation_id.is_(None))
    else:
        query = query.filter(
            ChatMessage.conversation_id == conversation_id
        )

    deleted = query.delete(synchronize_session=False)
    db.commit()

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found."
        )

    return {
        "message": "Conversation deleted successfully."
    }