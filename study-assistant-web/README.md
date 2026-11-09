# StudyMate — AI-Powered Personal Study Platform

StudyMate is a full-stack study assistant application that helps students learn smarter and achieve more. Built with React, FastAPI, and local AI (Ollama), it provides an all-in-one workspace for AI chat, PDF analysis, note generation, quiz creation, and progress tracking.

---

## Project Overview

StudyMate combines a modern React frontend with a FastAPI backend and local LLM integration to deliver a privacy-focused, offline-capable study companion. No cloud API keys required — everything runs locally on your machine.

### Purpose

- **Learn faster**: Get instant explanations, summaries, and study materials
- **Stay organized**: Manage notes, quizzes, and study progress in one place
- **Track improvement**: Subject-wise performance analytics and quiz history
- **Own your data**: Local SQLite database, local AI model — no external dependencies

---

## Key Features

| Feature | Status | Description |
|---------|--------|-------------|
| **AI Chat** | ✅ Complete | Conversational study assistant with message history and multiple conversations |
| **PDF Assistant** | ✅ Complete | Upload PDFs (≤10 MB, ≤30 pages) for AI summary, key topics, important questions, and Q&A |
| **Notes Generator** | ✅ Complete | Generate structured study notes on any topic with Markdown formatting |
| **Notice Generator** | ⚠️ Partial | Generate college notices; saved notices not yet loaded/displayed in UI |
| **Quiz & Exams** | ✅ Complete | Generate MCQ quizzes on any topic (5–10 questions), take quizzes, view scores |
| **Study Library** | ⚠️ Partial | Static chapter-wise study material for 14 CS subjects (no dynamic content yet) |
| **Progress Tracking** | ✅ Complete | Quiz history, average/best scores, subject-wise performance bars |
| **User Authentication** | ✅ Complete | Signup/login with JWT tokens, Argon2 password hashing |
| **Quiz Score Saving** | ✅ Complete | Quiz Generator scores saved to database, visible on Progress page |

> **Note**: Settings page, dark mode, 2FA, email verification, and collaborative features are not yet implemented.

---

## Technologies Used

| Layer | Technology | Version |
|-------|------------|---------|
| **Frontend** | React | 19.3.1 |
| | Vite | 8.3.4 |
| | React Markdown | 10.1.0 |
| | ESLint | 10.13.0 |
| **Backend** | FastAPI | 0.162.0 |
| | Uvicorn | 0.54.0 |
| | SQLAlchemy | 2.1.6 |
| | Pydantic | 2.14.2 |
| | PyJWT | 2.15.1 |
| | pwdlib (Argon2) | 0.3.1 |
| | Ollama Python Client | 0.6.3 |
| | PyPDF (pypdf) | 6.21.4 |
| | python-dotenv | Latest |
| **Database** | SQLite | Built-in |
| **AI Model** | Ollama (qwen2.5:1.5b) | Local |
| **Language** | Python | 3.11+ |
| **Package Manager** | npm / pip | Latest |

---

## Project Folder Structure

```
AI-Study-Assistant/
├── backend/
│   ├── app/
│   │   ├── api/                    # API route handlers
│   │   │   ├── chat.py             # AI Chat endpoints
│   │   │   ├── documents.py        # Document management
│   │   │   ├── notes.py            # Notes Generator endpoints
│   │   │   ├── notices.py          # Notice Generator endpoints
│   │   │   ├── pdf.py              # PDF Assistant endpoints
│   │   │   ├── quiz_attempts.py    # Quiz score persistence
│   │   │   ├── quizzes.py          # Quiz Generator endpoints
│   │   │   └── users.py            # Authentication endpoints
│   │   ├── core/
│   │   │   ├── auth.py             # JWT dependency, get_current_user
│   │   │   ├── jwt.py              # Token creation/validation
│   │   │   └── security.py         # Argon2 password hashing
│   │   ├── db/
│   │   │   ├── database.py         # SQLAlchemy engine, session
│   │   │   └── __init__.py
│   │   ├── models/                 # SQLAlchemy ORM models
│   │   │   ├── user.py
│   │   │   ├── chat.py
│   │   │   ├── document.py
│   │   │   ├── note.py
│   │   │   ├── notice.py
│   │   │   ├── quiz.py
│   │   │   ├── quiz_attempt.py
│   │   │   └── __init__.py
│   │   ├── schemas/
│   │   │   └── user.py             # Pydantic request/response models
│   │   ├── services/
│   │   │   └── ai_service.py       # Ollama integration (chat, PDF, quiz)
│   │   ├── main.py                 # FastAPI app, CORS, router registration
│   │   └── __init__.py
│   ├── .env                        # JWT_SECRET_KEY (not committed)
│   ├── .venv/                      # Python virtual environment
│   ├── studymate.db                # SQLite database
│   ├── main.py                     # Entry point (optional)
│   └── uploads/                    # Temporary file storage
│
├── study-assistant-web/            # React frontend
│   ├── public/
│   ├── src/
│   │   ├── assets/                 # Images (hero.png, study-buddy.png)
│   │   ├── data/
│   │   │   └── knowledgeBase.js    # Local FAQ knowledge base
│   │   ├── App.jsx                 # Main application component
│   │   ├── App.css                 # All styles (2,925 lines)
│   │   ├── index.css               # Global styles
│   │   └── main.jsx                # React entry point
│   ├── .gitignore
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.js
│   ├── eslint.config.js
│   ├── index.html
│   └── README.md                   # This file
│
├── model-lab/                      # Experimental ML models (not used in production)
└── model-lab-backup/
```

---

## Installation & Setup (macOS)

### Prerequisites

- **Node.js** 18+ and **npm** 9+
- **Python** 3.11+ and **pip**
- **Ollama** (for local AI): `brew install ollama` then `ollama pull qwen2.5:1.5b`
- **Git**

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd AI-Study-Assistant
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install fastapi uvicorn sqlalchemy pydantic pyjwt pwdlib ollama pypdf python-dotenv

# Create .env file with JWT secret
echo "JWT_SECRET_KEY=$(openssl rand -base64 48)" > .env

# Start Ollama (in a separate terminal)
ollama serve

# Pull the model (first time only)
ollama pull qwen2.5:1.5b

# Run backend server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend will be available at: **http://127.0.0.1:8000**  
API docs at: **http://127.0.0.1:8000/docs**

### 3. Frontend Setup

```bash
cd study-assistant-web

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at: **http://localhost:5173**

---

## Running the Application

### Development Mode

**Terminal 1 — Backend:**
```bash
cd backend
source .venv/bin/activate
ollama serve &
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd study-assistant-web
npm run dev
```

**Terminal 3 — Ollama (if not running as service):**
```bash
ollama serve
```

### Production Build (Frontend)

```bash
cd study-assistant-web
npm run build
npm run preview
```

---

## API Overview

Base URL: `http://127.0.0.1:8000`  
All endpoints (except `/`, `/health`, `/api/users/signup`, `/api/users/login`) require `Authorization: Bearer <token>` header.

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users/signup` | Create account (name, email, password) |
| POST | `/api/users/login` | Login, returns JWT access token |
| GET | `/api/users/me` | Get current user profile |

### AI Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat/message` | Send message, get AI response |
| GET | `/api/chat/conversations` | List all conversations |
| GET | `/api/chat/history` | Get messages for a conversation |
| DELETE | `/api/chat/conversations/{id}` | Delete a conversation |

### PDF Assistant
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/pdf/upload` | Upload PDF, get summary/topics/questions |
| POST | `/api/pdf/ask` | Ask question about uploaded PDF |

### Notes Generator
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/notes/generate` | Generate notes on a topic |
| GET | `/api/notes/` | List saved notes |
| DELETE | `/api/notes/{id}` | Delete a note |

### Notice Generator
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/notices/generate` | Generate college notice |
| GET | `/api/notices/` | List saved notices (API exists, UI not connected) |
| DELETE | `/api/notices/{id}` | Delete a notice |

### Quiz & Exams
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/quizzes/generate` | Generate MCQ quiz on a topic |
| GET | `/api/quizzes/` | List saved quizzes |
| DELETE | `/api/quizzes/{id}` | Delete a quiz |

### Quiz Attempts (Progress)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/quiz-attempts/` | Save quiz score |
| GET | `/api/quiz-attempts/` | Get quiz history for Progress page |

---

## Database Overview

**Engine**: SQLite (`backend/studymate.db`)  
**ORM**: SQLAlchemy 2.x with declarative models

### Tables

| Table | Description | Key Columns |
|-------|-------------|-------------|
| `users` | Registered users | `id`, `name`, `email`, `hashed_password`, `created_at` |
| `chat_messages` | AI chat history | `id`, `user_id`, `conversation_id`, `role`, `content`, `created_at` |
| `pdf_documents` | Uploaded PDF metadata | `id`, `user_id`, `file_path`, `filename`, `created_at` |
| `notes` | Generated study notes | `id`, `user_id`, `title`, `content`, `created_at` |
| `notices` | Generated college notices | `id`, `user_id`, `title`, `content`, `created_at` |
| `quizzes` | Generated quizzes | `id`, `user_id`, `title`, `topic`, `questions` (JSON), `created_at` |
| `quiz_attempts` | Quiz scores for Progress | `id`, `user_id`, `subject`, `chapter`, `score`, `total_questions`, `percentage`, `created_at` |

### Relationships

- All tables have `user_id` FK → `users.id` (user isolation)
- `chat_messages` has optional `conversation_id` for grouping

### Migrations

Schema is auto-created on startup via `Base.metadata.create_all(bind=engine)`. For production, use Alembic.

---

## Screenshots

*Add screenshots here after running the application.*

| Page | Screenshot |
|------|------------|
| **Login / Signup** | ![Login](public/screenshots/login.png) |
| **Dashboard** | ![Dashboard](public/screenshots/dashboard.png) |
| **AI Chat** | ![AI Chat](public/screenshots/ai-chat.png) |
| **PDF Assistant** | ![PDF Assistant](public/screenshots/pdf-assistant.png) |
| **Notes Generator** | ![Notes Generator](public/screenshots/notes-generator.png) |
| **Quiz & Exams** | ![Quiz](public/screenshots/quiz.png) |
| **Study Library** | ![Study Library](public/screenshots/study-library.png) |
| **Progress Page** | ![Progress](public/screenshots/progress.png) |
| **Notice Generator** | ![Notice Generator](public/screenshots/notice-generator.png) |

> **Tip**: Run the app, take screenshots, save to `study-assistant-web/public/screenshots/`, then uncomment the image lines above.

---

## Future Improvements

### High Priority
- [ ] **Settings page** — Theme toggle (light/dark), language, account management
- [ ] **Password reset flow** — Email-based reset with token expiry
- [ ] **Email verification** — Verify email on signup before allowing login
- [ ] **PDF persistence** — Save uploaded PDFs to database for cross-session access
- [ ] **Notice list UI** — Display saved notices on Notice Generator page

### Medium Priority
- [ ] **Dark mode** — Full dark theme support across all pages
- [ ] **Admin roles** — Role-based access control for future multi-user features
- [ ] **Real-time chat** — WebSocket support for live AI responses
- [ ] **Export notes/quizzes** — PDF/Markdown export for offline study
- [ ] **Quiz analytics** — Time spent, question-level analytics, weak areas

### Low Priority / Nice to Have
- [ ] **Collaborative features** — Shared notes, group quizzes, study groups
- [ ] **Voice input** — Web Speech API for hands-free chat
- [ ] **Mobile PWA** — Installable progressive web app
- [ ] **Docker deployment** — Containerized backend + frontend
- [ ] **CI/CD pipeline** — GitHub Actions for testing and deployment
- [ ] **Unit & integration tests** — pytest for backend, Vitest/React Testing Library for frontend

---

## License

This project is for educational and portfolio purposes.

---

## Author

**Arjun Arya** — [GitHub](https://github.com/arjunarya0932) | [Email](mailto:arjunarya0932@gmail.com)

---

*Built with React, FastAPI, SQLite, and Ollama — all running locally on your machine.*