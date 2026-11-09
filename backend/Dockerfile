# syntax=docker/dockerfile:1
FROM python:3.14-slim-bookworm

WORKDIR /app

# Build arguments for UID/GID matching host user
# Defaults: UID=501 (macOS first user), GID=20 (dialout group on Debian/Ubuntu)
# If GID 20 already exists in base image, reuse it; otherwise create it.
ARG HOST_UID=501
ARG HOST_GID=20

# Install system dependencies required by argon2-cffi and other packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user with matching UID/GID
# Reuse existing group with GID 20 if present, otherwise create it.
# If UID 501 already exists in /etc/passwd, fail with clear error.
RUN set -eux; \
    if grep -q "^[^:]*:[^:]*:${HOST_UID}:" /etc/passwd; then \
        echo "ERROR: UID ${HOST_UID} already assigned in /etc/passwd:"; \
        grep "^[^:]*:[^:]*:${HOST_UID}:" /etc/passwd; \
        echo "Cannot create appuser with conflicting UID. Aborting."; \
        exit 1; \
    fi; \
    if grep -q "^[^:]*:[^:]*:${HOST_GID}:" /etc/group; then \
        echo "GID ${HOST_GID} exists, reusing group"; \
        group_name=$(grep "^[^:]*:[^:]*:${HOST_GID}:" /etc/group | cut -d: -f1); \
    else \
        echo "GID ${HOST_GID} not found, creating group appuser"; \
        groupadd -g ${HOST_GID} appuser; \
        group_name="appuser"; \
    fi; \
    useradd -r -u ${HOST_UID} -g ${group_name} appuser

# Install Python dependencies first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app/ ./app/
COPY main.py ./

# Set proper ownership using numeric UID/GID to handle reused group names
RUN chown -R ${HOST_UID}:${HOST_GID} /app

# Switch to non-root user
USER appuser

# Expose the application port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health')" || exit 1

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]