
from fastapi import FastAPI
from app.db.database import engine, Base
from app.models import User, ChatMessage, PDFDocument, Note, Quiz, QuizAttempt
from app.api.users import router as users_router
from app.api.chat import router as chat_router
from app.api.documents import router as documents_router
from app.api.notes import router as notes_router
from app.api.quizzes import router as quizzes_router
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from app.api.pdf import router as pdf_router
from app.models import Notice
from app.api.notices import router as notices_router
from app.api.quiz_attempts import router as quiz_attempts_router
import os
from slowapi.errors import RateLimitExceeded
from slowapi.extension import _rate_limit_exceeded_handler
from app.core.rate_limiter import limiter

app = FastAPI(
    title="StudyMate API",
    description="AI-powered personal study platform",
    version="1.0.0"
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Parse CORS origins from environment
cors_origins_str = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174"
)
cors_origins = [origin.strip() for origin in cors_origins_str.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(users_router)
app.include_router(chat_router)
app.include_router(documents_router)
app.include_router(notes_router)
app.include_router(quizzes_router)
app.include_router(pdf_router)
app.include_router(notices_router)
app.include_router(quiz_attempts_router)

Base.metadata.create_all(bind=engine)
# Safely add conversation_id to existing databases
with engine.begin() as connection:
    columns = inspect(connection).get_columns("chat_messages")

    if "conversation_id" not in [column["name"] for column in columns]:
        connection.execute(
            text(
                "ALTER TABLE chat_messages "
                "ADD COLUMN conversation_id VARCHAR(36)"
            )
        )

@app.get("/")
def home():
    return {
        "message": "StudyMate backend is running!",
        "status": "success"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }
