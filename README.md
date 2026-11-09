# StudyMate — AI-Powered Personal Study Platform

StudyMate is a full-stack study assistant application that provides an all-in-one workspace for AI-powered chat, PDF analysis, note generation, quiz creation, and progress tracking.

---

## Project Overview
StudyMate combines a React frontend with a FastAPI backend and local LLM integration (via Ollama) to deliver a privacy-focused study companion. The application runs locally on your machine, leveraging a local SQLite database for data persistence and a local AI model for intelligent tasks.

## Key Features
- **AI Chat**: Conversational study assistant with message history.
- **PDF Assistant**: Upload PDFs for AI summary, key topics, and Q&A.
- **Notes Generator**: Generate structured study notes with Markdown formatting.
- **Quiz & Exams**: Generate, take, and track MCQ quizzes.
- **Progress Tracking**: Visualize quiz history and performance analytics.
- **User Authentication**: Secure signup/login using JWT tokens and Argon2 password hashing.

## Technologies Used
- **Frontend**: React 19, Vite.
- **Backend**: FastAPI, SQLAlchemy 2.0, Pydantic 2.0, PyJWT, pwdlib (Argon2), Ollama Client.
- **Database**: SQLite (built-in).
- **AI Model**: Local Ollama (qwen2.5:1.5b).

## Setup Instructions (macOS)

### Backend Setup

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```

2. Create a Python virtual environment:
   ```bash
   python3 -m venv .venv
   ```

3. Activate the virtual environment:
   ```bash
   source .venv/bin/activate
   ```

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Configure the environment variable:
   If a `.env` file does not already exist in the `backend/` directory, create one and add a secure `JWT_SECRET_KEY`:
   ```bash
   # Generate a secure random key (run this command, then copy the output)
   openssl rand -base64 48
   ```
   Then manually add it to `.env`:
   ```text
   JWT_SECRET_KEY=your_generated_key_here
   ```

6. Run the server:
   ```bash
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

### Frontend Setup

1. Navigate to the `study-assistant-web/` directory:
   ```bash
   cd study-assistant-web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

*For detailed technical documentation, feature status, and API specifications, refer to [study-assistant-web/README.md](study-assistant-web/README.md).*

## Screenshots
*Visual overview of StudyMate.*

| Page | Screenshot |
|------|------------|
| **Dashboard** | ![Dashboard](study-assistant-web/public/screenshots/dashboard%20copy.png) |
| **AI Chat** | ![AI Chat](study-assistant-web/public/screenshots/ai-chat%20copy.png) |
| **PDF Assistant** | ![PDF Assistant](study-assistant-web/public/screenshots/pdf-assistant%20copy.png) |

## Deployment Status
StudyMate is currently configured for **local-only development and use**. There is no public deployment or live demo available.

---
*Built with React, FastAPI, SQLite, and Ollama.*
