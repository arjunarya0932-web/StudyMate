from io import BytesIO
import os
import uuid

from fastapi import (
    APIRouter, UploadFile, File, Depends,
    HTTPException, Form
)
from pypdf import PdfReader
import json

from app.core.auth import get_current_user, get_db
from app.models import User, PDFDocument
from app.services.ai_service import (
    generate_pdf_summary,
    generate_pdf_answer,
    generate_pdf_topics,
    generate_pdf_questions
)

router = APIRouter(
    prefix="/api/pdf",
    tags=["PDF Assistant"]
)

MAX_FILE_SIZE = 10 * 1024 * 1024
MAX_PAGES = 30
MAX_TEXT_LENGTH = 30000
UPLOAD_DIR = "uploads/pdfs"


async def extract_pdf_text(file: UploadFile):
    """Extract text from an UploadFile by reading its content."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a PDF file."
        )

    content = await file.read()
    return extract_pdf_text_from_bytes(content, file.filename)


def extract_pdf_text_from_bytes(content: bytes, filename: str = "uploaded.pdf"):
    """Extract text from already-read PDF bytes.

    Args:
        content: The raw bytes of the PDF file
        filename: Optional filename for validation error messages

    Returns:
        Tuple of (full_text, page_count)

    Raises:
        HTTPException for validation failures
    """
    if not filename or not filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a PDF file."
        )

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="PDF must be smaller than 10 MB."
        )

    if not content.startswith(b"%PDF-"):
        raise HTTPException(
            status_code=400,
            detail="Invalid PDF file."
        )

    try:
        reader = PdfReader(BytesIO(content))

        if reader.is_encrypted:
            raise HTTPException(
                status_code=400,
                detail="Password-protected PDFs are not supported."
            )

        page_count = len(reader.pages)

        if page_count == 0 or page_count > MAX_PAGES:
            raise HTTPException(
                status_code=400,
                detail="PDF must contain between 1 and 30 pages."
            )

        pages = [
            page.extract_text() or ""
            for page in reader.pages
        ]

        full_text = "\n\n".join(pages).strip()

        if len(full_text.split()) < 20:
            raise HTTPException(
                status_code=400,
                detail="Not enough readable text found in this PDF."
            )

        return full_text[:MAX_TEXT_LENGTH], page_count

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Could not read this PDF. Please try another file."
        )


@router.post("/upload")
async def upload_pdf(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    try:
        # Read file content ONCE
        content = await file.read()

        # Extract text using the bytes (validation happens inside)
        full_text, page_count = extract_pdf_text_from_bytes(content, file.filename)

        summary = generate_pdf_summary(full_text)
        topics = generate_pdf_topics(full_text)
        questions_result = generate_pdf_questions(full_text)

        # Save to database
        unique_name = f"{uuid.uuid4().hex}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, unique_name)

        # Ensure upload directory exists
        os.makedirs(UPLOAD_DIR, exist_ok=True)

        # Save the file using the same content we already read
        with open(file_path, "wb") as f:
            f.write(content)

        pdf_doc = PDFDocument(
            user_id=current_user.id,
            filename=file.filename,
            file_path=file_path,
            summary=summary,
            topics=topics,
            questions=questions_result,
            page_count=page_count
        )
        db.add(pdf_doc)
        db.commit()
        db.refresh(pdf_doc)

        return {
            "message": "PDF processed successfully.",
            "filename": file.filename,
            "page_count": page_count,
            "summary": summary,
            "topics": topics,
            "questions": questions_result,
            "pdf_id": pdf_doc.id
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Could not process this PDF. Please try again."
        )


@router.post("/ask")
async def ask_pdf_question(
    file: UploadFile = File(...),
    question: str = Form(...),
    current_user: User = Depends(get_current_user)
):
    if not question.strip():
        raise HTTPException(
            status_code=400,
            detail="Please enter a question."
        )

    try:
        full_text, _ = await extract_pdf_text(file)

        answer = generate_pdf_answer(
            full_text,
            question.strip()
        )

        return {
            "message": "Question answered successfully.",
            "filename": file.filename,
            "question": question.strip(),
            "answer": answer
        }

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Could not answer this question. Please try again."
        )
    finally:
        await file.close()


@router.get("/")
async def get_pdf_documents(
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    docs = (
        db.query(PDFDocument)
        .filter(PDFDocument.user_id == current_user.id)
        .order_by(PDFDocument.created_at.desc())
        .all()
    )

    return {
        "documents": [
            {
                "id": doc.id,
                "filename": doc.filename,
                "summary": doc.summary,
                "topics": doc.topics,
                "questions": doc.questions,
                "page_count": doc.page_count,
                "created_at": doc.created_at
            }
            for doc in docs
        ]
    }


@router.get("/{pdf_id}")
async def get_pdf_document(
    pdf_id: int,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    doc = (
        db.query(PDFDocument)
        .filter(
            PDFDocument.id == pdf_id,
            PDFDocument.user_id == current_user.id
        )
        .first()
    )

    if not doc:
        raise HTTPException(status_code=404, detail="PDF not found")

    return {
        "id": doc.id,
        "filename": doc.filename,
        "summary": doc.summary,
        "topics": doc.topics,
        "questions": doc.questions,
        "page_count": doc.page_count,
        "created_at": doc.created_at
    }


@router.delete("/{pdf_id}")
async def delete_pdf_document(
    pdf_id: int,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    doc = (
        db.query(PDFDocument)
        .filter(
            PDFDocument.id == pdf_id,
            PDFDocument.user_id == current_user.id
        )
        .first()
    )

    if not doc:
        raise HTTPException(status_code=404, detail="PDF not found")

    # Delete the file from disk if it exists
    if doc.file_path and os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except OSError:
            pass  # File may not exist, continue with deletion

    db.delete(doc)
    db.commit()

    return {"message": "PDF deleted successfully."}