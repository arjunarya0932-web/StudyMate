
import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.core.auth import get_current_user, get_db
from app.models import User, Quiz
from app.services.ai_service import generate_ai_response

router = APIRouter(
    prefix="/api/quizzes",
    tags=["Quizzes"]
)


class QuizRequest(BaseModel):
    topic: str = Field(min_length=2, max_length=200)
    question_count: int = Field(default=5, ge=1, le=10)


@router.post("/generate")
def generate_quiz(
    request: QuizRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    prompt = f"""
Create exactly {request.question_count} multiple-choice questions
about {request.topic}.

Return ONLY valid JSON in this exact structure:
{{
    "questions": [
        {{
            "question": "Question text",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correct_answer": "Option A",
            "explanation": "Short explanation"
        }}
    ]
}}

The correct_answer must be exactly one of the four option strings.
Do not return placeholder answers like "Option A".
"""

    # Generate and validate quiz
    try:
        ai_response = generate_ai_response(prompt)

        cleaned_response = ai_response.strip()

        if cleaned_response.startswith("```"):
            cleaned_response = cleaned_response.replace("```json", "", 1)
            cleaned_response = cleaned_response.replace("```", "").strip()

        quiz_data = json.loads(cleaned_response)
        questions = quiz_data["questions"]

        if not isinstance(questions, list):
            raise ValueError("Questions must be a list")

        if len(questions) != request.question_count:
            raise ValueError("Invalid question count")

        for question in questions:
            if not isinstance(question, dict):
                raise ValueError("Invalid question format")

            required_fields = [
                "question",
                "options",
                "correct_answer",
                "explanation"
            ]

            if not all(key in question for key in required_fields):
                raise ValueError("A question is missing required fields")

            options = question["options"]

            if not isinstance(options, list) or len(options) != 4:
                raise ValueError("Each question must have exactly 4 options")

            options = [str(option).strip() for option in options]
            question["options"] = options

            correct = str(question["correct_answer"]).strip()

            if correct in ["A", "Option A"]:
                correct = options[0]
            elif correct in ["B", "Option B"]:
                correct = options[1]
            elif correct in ["C", "Option C"]:
                correct = options[2]
            elif correct in ["D", "Option D"]:
                correct = options[3]

            if correct not in options:
                raise ValueError("Correct answer does not match any option")

            question["correct_answer"] = correct

    except Exception as e:
        print("QUIZ ERROR:", repr(e))
        raise HTTPException(
            status_code=503,
            detail="Could not generate a valid quiz. Please try again."
        )

    # Save quiz in database
    new_quiz = Quiz(
        user_id=current_user.id,
        title=request.topic,
        topic=request.topic,
        questions=json.dumps(questions)
    )

    try:
        db.add(new_quiz)
        db.commit()
        db.refresh(new_quiz)

    except Exception as e:
        db.rollback()
        print("QUIZ DATABASE ERROR:", repr(e))
        raise HTTPException(
            status_code=500,
            detail="Could not save the quiz."
        )

    return {
        "message": "Quiz generated successfully!",
        "quiz": {
            "id": new_quiz.id,
            "title": new_quiz.title,
            "topic": new_quiz.topic,
            "questions": json.loads(new_quiz.questions)
        }
    }
@router.get("/")
def get_my_quizzes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    quizzes = (
        db.query(Quiz)
        .filter(Quiz.user_id == current_user.id)
        .order_by(Quiz.created_at.desc())
        .all()
    )

    return {
        "quizzes": [
            {
                "id": quiz.id,
                "title": quiz.title,
                "topic": quiz.topic,
                "questions": json.loads(quiz.questions),
                "created_at": quiz.created_at
            }
            for quiz in quizzes
        ]
    }
@router.delete("/{quiz_id}")
def delete_quiz(
    quiz_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    quiz = (
        db.query(Quiz)
        .filter(
            Quiz.id == quiz_id,
            Quiz.user_id == current_user.id
        )
        .first()
    )

    if quiz is None:
        raise HTTPException(
            status_code=404,
            detail="Quiz not found"
        )

    db.delete(quiz)
    db.commit()

    return {
        "message": "Quiz deleted successfully!"
    }