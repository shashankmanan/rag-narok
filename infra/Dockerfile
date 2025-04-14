# Multi-stage build for frontend and backend

# Stage 1: Build the React frontend
FROM node:19-alpine AS frontend-build
WORKDIR /app/frontend

# Copy frontend dependencies
COPY frontend/package.json frontend/package-lock.json ./

# Install dependencies
RUN npm ci

# Copy frontend source
COPY frontend/ ./

# Build the frontend
RUN npm run build

# Stage 2: Build the Python backend
FROM python:3.10-slim AS backend-build

# Set working directory
WORKDIR /app/backend

# Install dependencies required for some Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip

# Install Python packages
RUN pip install --no-cache-dir \
    fastapi \
    uvicorn \
    sqlalchemy \
    python-dotenv \
    pydantic \
    psycopg2-binary \
    langchain \
    langchain_community \
    numpy \
    scikit-learn \
    unstructured \
    python-multipart \
    huggingface_hub \
    sentence-transformers

# Stage 3: Final image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install necessary runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Copy built frontend files
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

# Copy backend files
COPY backend/ /app/backend/

# Copy static frontend files to a location served by backend
RUN mkdir -p /app/backend/app/api/static
COPY --from=frontend-build /app/frontend/dist /app/backend/app/api/static

# Set environment variables
ENV PYTHONPATH=/app/backend
ENV PORT=5050

# Expose the port
EXPOSE 5050

# Set the working directory to the backend app location
WORKDIR /app/backend/app/api

# Run the backend server
CMD ["python", "main.py"] 