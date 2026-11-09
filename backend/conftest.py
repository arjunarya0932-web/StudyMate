"""
Pytest configuration for StudyMate backend tests.
Uses completely isolated temporary SQLite database per test session.
Never connects to production databases (studymate.db, data/studymate.db).
"""

import os
import tempfile
import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Import app and dependencies
from app.main import app
from app.db.database import Base
from app.core.auth import get_db as auth_get_db
from app.api.users import get_db as users_get_db
from app.models import User
from app.core.rate_limiter import limiter as rate_limiter


# =============================================================================
# SESSION-SCOPED: Temporary Database Engine
# =============================================================================

@pytest.fixture(scope="session")
def test_engine():
    """
    Create a temporary SQLite database file for the entire test session.
    File lives in system temp directory (/tmp on Unix) with unique name.
    Never uses project database paths.
    """
    # Create temp file in system temp directory (not project directory)
    fd, db_path = tempfile.mkstemp(suffix='.db', prefix='studymate_test_')
    os.close(fd)

    DATABASE_URL = f"sqlite:///{db_path}"

    # Create engine bound to temporary database only
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

    # Create all tables in the temporary database
    Base.metadata.create_all(bind=engine)

    yield engine

    # Teardown: dispose engine connections, then delete temp file
    engine.dispose()
    if os.path.exists(db_path):
        try:
            os.unlink(db_path)
        except OSError:
            pass  # Best effort cleanup


@pytest.fixture(scope="session")
def test_session_factory(test_engine):
    """Session factory bound to the temporary test engine."""
    return sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


# =============================================================================
# FUNCTION-SCOPED: Fresh Database Session per Test
# =============================================================================

@pytest.fixture(scope="function")
def test_db(test_session_factory):
    """
    Provide a clean database session for each test function.
    Changes are rolled back after each test for isolation.
    """
    db = test_session_factory()
    try:
        yield db
    finally:
        db.rollback()
        db.close()


# =============================================================================
# FUNCTION-SCOPED: Test Client with Overridden Dependencies
# =============================================================================

@pytest.fixture(scope="function")
def client(test_db):
    """
    FastAPI TestClient with get_db dependencies overridden to use test_db.
    Overrides BOTH get_db dependencies (auth.py and users.py).
    Each test gets isolated database state via the test_db session.
    """
    def override_get_db():
        try:
            yield test_db
        finally:
            pass  # test_db fixture handles rollback/close

    # Save original overrides
    original_overrides = dict(app.dependency_overrides)

    # Override BOTH get_db dependencies to use test database
    app.dependency_overrides[auth_get_db] = override_get_db
    app.dependency_overrides[users_get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    # Restore original dependency overrides
    app.dependency_overrides.clear()
    app.dependency_overrides.update(original_overrides)


# =============================================================================
# FUNCTION-SCOPED: Test User + Auth Headers
# =============================================================================

@pytest.fixture(scope="function")
def test_user(client):
    """
    Create a unique test user via the signup API and return user data.
    User exists only in the temporary test database.
    """
    # Reset rate limiter to avoid interference from other tests
    rate_limiter.reset()

    email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    password = "TestPass123!"
    name = f"Test User {uuid.uuid4().hex[:6]}"

    resp = client.post("/api/users/signup", json={
        "name": name,
        "email": email,
        "password": password
    })
    assert resp.status_code == 200, f"Failed to create test user: {resp.json()}"

    user_data = resp.json()["user"]
    return {
        "id": user_data["id"],
        "name": name,
        "email": email,
        "password": password
    }


@pytest.fixture(scope="function")
def headers(client, test_user):
    """
    Auth headers fixture for protected endpoints.
    Logs in the test user and returns Authorization header.
    Token is generated against the temporary test database.
    """
    resp = client.post("/api/users/login", json={
        "email": test_user["email"],
        "password": test_user["password"]
    })
    assert resp.status_code == 200, f"Failed to login test user: {resp.json()}"

    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}