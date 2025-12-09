FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Upgrade pip and configure for better reliability
RUN pip install --upgrade pip setuptools wheel

# Set environment variables for pip to handle network issues
ENV PIP_DEFAULT_TIMEOUT=300
ENV PIP_RETRIES=5

# Install Python dependencies
# Install base packages first, then large ML packages separately for better error handling
RUN pip install --no-cache-dir \
        fastapi>=0.104.1 \
        uvicorn[standard]>=0.24.0 \
        pydantic>=2.5.0 \
        pydantic-settings>=2.1.0 \
        python-dotenv>=1.0.0 \
        python-multipart>=0.0.6 \
        python-json-logger>=2.0.7 \
        httpx>=0.25.2 \
        asyncpg>=0.29.0 \
        sqlalchemy>=2.0.23 \
        redis>=5.0.1 \
        hiredis>=2.2.3

# Install large ML packages separately with retry logic
RUN pip install --no-cache-dir pandas>=2.1.3 numpy>=1.26.2 || \
    (sleep 5 && pip install --no-cache-dir pandas>=2.1.3 numpy>=1.26.2)

RUN pip install --no-cache-dir scikit-learn>=1.5.0 || \
    (sleep 10 && pip install --no-cache-dir scikit-learn>=1.5.0)

# Copy application code
COPY app/ ./app/

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

