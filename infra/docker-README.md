# Docker Deployment Instructions

This document provides instructions for deploying the Document RAG API application using Docker and Docker Compose.

## Prerequisites

- Docker Engine (version 20.10 or later)
- Docker Compose (version 2.0 or later)
- Git for cloning the repository

## Quick Start

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd doc-agent
   ```

2. **Create a `.env` file for Docker Compose:**
   ```bash
   cp backend/app/api/.env .env
   ```
   Ensure all the required environment variables are set correctly.

3. **Build and start the containers:**
   ```bash
   docker-compose up -d
   ```

4. **Access the application:**
   - API: `http://localhost:5050/docs`
   - Frontend: `http://localhost:5050`

## Dockerfile Explanation

The project uses a multi-stage build process to optimize the Docker image size and build times:

### Stage 1: Build the React Frontend
```dockerfile
FROM node:19-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build
```

This stage:
- Uses a Node.js Alpine image for minimal size
- Installs frontend dependencies
- Builds the React application

### Stage 2: Prepare Python Dependencies
```dockerfile
FROM python:3.10-slim AS backend-build
WORKDIR /app/backend
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir \
    fastapi \
    uvicorn \
    sqlalchemy \
    # ... other dependencies
```

This stage:
- Uses a slim Python image
- Installs system dependencies required for Python packages
- Installs Python packages

### Stage 3: Final Image
```dockerfile
FROM python:3.10-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist
COPY backend/ /app/backend/
COPY --from=frontend-build /app/frontend/dist /app/backend/app/api/static
ENV PYTHONPATH=/app/backend
ENV PORT=5050
EXPOSE 5050
WORKDIR /app/backend/app/api
CMD ["python", "main.py"]
```

This stage:
- Creates the final image using a slim Python image
- Copies built frontend assets from stage 1
- Copies backend code
- Sets up environment variables
- Exposes port 5050
- Sets the entry point to run the FastAPI application

## Docker Compose Configuration

The `docker-compose.yml` file defines the services needed to run the application:

```yaml
version: '3.8'

services:
  doc-agent:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "5050:5050"
    environment:
      - PORT=5050
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - JWT_ALGORITHM=${JWT_ALGORITHM}
      - S3_BUCKET_NAME=${S3_BUCKET_NAME}
      - AWS_REGION=${AWS_REGION}
      - AWS_ACCESS_KEY=${AWS_ACCESS_KEY}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
    volumes:
      - ./backend:/app/backend
      - ./backend/app/api/.env:/app/backend/app/api/.env
    restart: unless-stopped
```

This configuration:
- Builds the container using the Dockerfile
- Maps port 5050 to the host
- Sets environment variables from the .env file
- Mounts volumes for local development (optional)
- Sets a restart policy

## Environment Variables

The Docker deployment uses the following environment variables, which should be defined in your `.env` file:

- `PORT`: The port to run the application on (default: 5050)
- `DATABASE_URL`: PostgreSQL database connection string
- `JWT_SECRET`: Secret key for JWT token generation
- `JWT_ALGORITHM`: Algorithm for JWT token (default: HS256)
- `S3_BUCKET_NAME`: AWS S3 bucket name for document storage
- `AWS_REGION`: AWS region for S3
- `AWS_ACCESS_KEY`: AWS access key for S3
- `AWS_SECRET_ACCESS_KEY`: AWS secret key for S3

## Production Deployment

For production deployment, make the following adjustments:

1. **Remove development volumes:**
   In the `docker-compose.yml` file, remove the volume mounts for local development:
   ```yaml
   # Remove these lines for production
   volumes:
     - ./backend:/app/backend
     - ./backend/app/api/.env:/app/backend/app/api/.env
   ```

2. **Use a production-ready database:**
   Update the `DATABASE_URL` to point to a production database instance.

3. **Set up a reverse proxy:**
   For HTTPS and domain name support, use Nginx or Traefik as a reverse proxy in front of the application.

   Example `docker-compose.override.yml` with Traefik:
   ```yaml
   version: '3.8'
   
   services:
     doc-agent:
       labels:
         - "traefik.enable=true"
         - "traefik.http.routers.doc-agent.rule=Host(`yourdomain.com`)"
         - "traefik.http.routers.doc-agent.entrypoints=websecure"
         - "traefik.http.routers.doc-agent.tls.certresolver=myresolver"
   
     traefik:
       image: traefik:v2.5
       ports:
         - "80:80"
         - "443:443"
       volumes:
         - /var/run/docker.sock:/var/run/docker.sock
         - ./traefik.yml:/etc/traefik/traefik.yml
         - ./acme.json:/acme.json
       networks:
         - default
   ```

## Monitoring and Maintenance

### Viewing Logs

```bash
# View logs from all services
docker-compose logs

# View logs from a specific service
docker-compose logs doc-agent

# Follow logs in real-time
docker-compose logs -f
```

### Updating the Application

```bash
# Pull the latest code
git pull

# Rebuild and restart containers
docker-compose down
docker-compose build
docker-compose up -d
```

### Container Management

```bash
# Stop the containers
docker-compose down

# Start the containers
docker-compose up -d

# Restart the containers
docker-compose restart
```

## Troubleshooting

### Common Issues

1. **Database connection errors:**
   - Ensure the database is accessible from the Docker container
   - Check the `DATABASE_URL` environment variable

2. **Permission issues:**
   - Make sure the `.env` file has the correct permissions
   - Check AWS credentials and bucket permissions

3. **Port conflicts:**
   - If port 5050 is already in use, modify the port mapping in `docker-compose.yml`

4. **Container not starting:**
   - Check logs with `docker-compose logs doc-agent`
   - Verify that all environment variables are correctly set

### Health Check

The application provides a health check endpoint at `/test` that you can use to verify that the API is running correctly.

## Security Considerations

1. **Environment Variables:**
   - Never commit `.env` files to version control
   - Use Docker secrets or a secure vault for sensitive values in production

2. **Network Security:**
   - Use a reverse proxy to handle HTTPS
   - Restrict access to the Docker host machine

3. **Container Security:**
   - Keep Docker and all dependencies updated
   - Use non-root users in containers where possible
   - Consider using Docker content trust for image verification 