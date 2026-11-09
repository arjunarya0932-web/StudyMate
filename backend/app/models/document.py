from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
import json

from app.db.database import Base


class PDFDocument(Base):
    __tablename__ = "pdf_documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=True)  # Temporary storage path
    summary = Column(Text, nullable=True)
    topics = Column(Text, nullable=True)
    questions = Column(Text, nullable=True)  # JSON string
    page_count = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())