
from fastapi import FastAPI


app = FastAPI(
    title="StudyMate API",
    description="AI-powered personal study platform",
    version="1.0.0"
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
