import os
import uuid
 
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.core.auth import get_current_user, get_db
from app.models import User, PDFDocument
from pypdf import PdfReader
from pydantic import BaseModel
from app.services.ai_service import generate_ai_response

class PDFTextResponse(BaseModel):
    document_id: int
    filename: str
    summary: str

router = APIRouter(
    prefix="/api/documents",
    tags=["Documents"]
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload")
async def upload_pdf(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed"
        )

    content = await file.read()

    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="PDF size must be 10 MB or less"
        )

    if not content.startswith(b"%PDF-"):
        raise HTTPException(
            status_code=400,
            detail="Invalid PDF file"
        )

    filename = f"{uuid.uuid4()}.pdf"
    file_path = os.path.join(UPLOAD_DIR, filename)

    with open(file_path, "wb") as pdf_file:
        pdf_file.write(content)

    new_document = PDFDocument(
        user_id=current_user.id,
        filename=file.filename,
        file_path=file_path
    )

    db.add(new_document)
    db.commit()
    db.refresh(new_document)

    return {
        "message": "PDF uploaded successfully!",
        "document": {
            "id": new_document.id,
            "filename": new_document.filename
        }
    }
@router.get("/")
def get_my_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    documents = (
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
                "created_at": doc.created_at
            }
            for doc in documents
        ]
    }
@router.get("/{document_id}/text")
def extract_pdf_text(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    document = (
        db.query(PDFDocument)
        .filter(
            PDFDocument.id == document_id,
            PDFDocument.user_id == current_user.id
        )
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    try:
        reader = PdfReader(document.file_path)

        extracted_text = ""

        for page in reader.pages:
            extracted_text += (page.extract_text() or "") + "\n"

        return {
            "document_id": document.id,
            "filename": document.filename,
            "total_pages": len(reader.pages),
            "text": extracted_text
        }

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Could not read this PDF"
        )

@router.get("/{document_id}/summary")
def generate_pdf_summary(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    document = (
        db.query(PDFDocument)
        .filter(
            PDFDocument.id == document_id,
            PDFDocument.user_id == current_user.id
        )
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    reader = PdfReader(document.file_path)

    text = "\n".join(
        page.extract_text() or ""
        for page in reader.pages
    )

    if not text.strip():
        raise HTTPException(
            status_code=400,
            detail="No readable text found in PDF"
        )

    summary = generate_ai_response(
    "Create a clear study summary using only the following PDF text. "
    "Use headings and bullet points. Do not add information that is not in the text.\n\n"
    + text[:12000]
)
    return {
        "document_id": document.id,
        "filename": document.filename,
        "summary": summary
    }