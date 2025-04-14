# Document RAG API

A full-stack application for document processing and querying using Retrieval Augmented Generation (RAG).

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Features](#features)
- [Installation](#installation)
  - [Prerequisites](#prerequisites)
  - [Local Development Setup](#local-development-setup)
  - [Database Setup](#database-setup)
  - [AWS S3 Setup](#aws-s3-setup)
- [Docker Deployment](#docker-deployment)
- [API Documentation](#api-documentation)
- [Code Structure](#code-structure)
- [Implementation Details](#implementation-details)
- [Security Considerations](#security-considerations)
- [Monitoring and Maintenance](#monitoring-and-maintenance)
- [Troubleshooting](#troubleshooting)
- [Code Comments Guide](#code-comments-guide)

## Project Overview

The Document RAG API is a full-stack application that allows users to upload documents, process them through natural language processing, and query them using a RAG architecture. The system leverages modern techniques in document processing, embeddings, and language models to provide accurate answers to user queries based on the content of uploaded documents.

## Architecture

The project follows a client-server architecture with:

1. **Frontend**: React-based SPA built with Vite
2. **Backend**: FastAPI-based Python API
3. **Database**: PostgreSQL for structured data storage
4. **Object Storage**: AWS S3 for document storage
5. **AI Components**: HuggingFace embeddings and LLM integration

```
┌───────────┐     ┌──────────┐     ┌────────────┐     ┌──────────┐
│           │     │          │     │            │     │          │
│  React    │────▶│  FastAPI │────▶│ PostgreSQL │     │ AWS S3   │
│  Frontend │◀────│  Backend │◀────│ Database   │     │ Storage  │
│           │     │          │     │            │     │          │
└───────────┘     └────┬─────┘     └────────────┘     └────┬─────┘
                       │                                   │
                       └─────────────────────────────┬────┘
                                                     │
                                               ┌─────▼──────┐
                                               │            │
                                               │  AI/ML     │
                                               │  Services  │
                                               │            │
                                               └────────────┘
```

## Features

- **Document Upload & Management**: Upload, store, and manage various document types
- **Text Extraction**: Extract text from various file formats
- **Document Processing**: Chunk text and generate embeddings
- **Semantic Search**: Find relevant information in documents
- **RAG-based Querying**: Get AI-generated answers based on document content
- **User Authentication**: Secure API access with JWT authentication

## Installation

### Prerequisites

- Python 3.10+
- Node.js 19+
- PostgreSQL database
- AWS account with S3 access
- Git

### Local Development Setup

#### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd doc-agent
   ```

2. **Create and activate a virtual environment**
   ```bash
   # Windows
   cd backend
   python -m venv venv
   venv\Scripts\activate

   # Linux/macOS
   cd backend
   python -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install fastapi uvicorn sqlalchemy python-dotenv pydantic psycopg2-binary langchain langchain_community numpy scikit-learn unstructured python-multipart huggingface_hub sentence-transformers
   ```

4. **Set up environment variables**
   Create a `.env` file in the `backend/app/api` directory with the following content:
   ```
   PORT=5050
   DATABASE_URL=postgresql://username:password@localhost:5432/docragdb
   JWT_SECRET=your_jwt_secret_key
   JWT_ALGORITHM=HS256
   S3_BUCKET_NAME=your-s3-bucket-name
   AWS_REGION=your-aws-region
   AWS_ACCESS_KEY=your-aws-access-key
   AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
   ```

5. **Run the backend server**
   ```bash
   cd backend/app/api
   python main.py
   ```
   The API should now be running at http://localhost:5050

#### Frontend Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Run the development server**
   ```bash
   npm run dev
   ```
   The frontend should now be running at http://localhost:5173

### Database Setup

1. **Create a PostgreSQL database**
   ```sql
   CREATE DATABASE docragdb;
   CREATE USER username WITH ENCRYPTED PASSWORD 'password';
   GRANT ALL PRIVILEGES ON DATABASE docragdb TO username;
   ```

2. **Database initialization**
   The database tables will be automatically created when you run the backend server for the first time.

### AWS S3 Setup

1. **Create an S3 bucket**
   - Sign in to the AWS Management Console
   - Go to the S3 service
   - Create a new bucket with appropriate settings
   - Note the bucket name for the .env file

2. **Create IAM credentials**
   - Create a new IAM user or use an existing one
   - Attach the `AmazonS3FullAccess` policy (or create a custom policy with more limited permissions)
   - Generate and save the access key and secret key for the .env file

## Docker Deployment

### Quick Start

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

### Dockerfile Structure

The project uses a multi-stage build process:

1. **Stage 1**: Build the React frontend
2. **Stage 2**: Prepare Python dependencies
3. **Stage 3**: Create the final image combining frontend and backend

### Production Deployment

For production deployment, make the following adjustments:

1. **Remove development volumes:**
   In the `docker-compose.yml` file, remove the volume mounts for local development

2. **Use a production-ready database:**
   Update the `DATABASE_URL` to point to a production database instance

3. **Set up a reverse proxy:**
   For HTTPS and domain name support, use Nginx or Traefik as a reverse proxy

## API Documentation

### Base URL

```
http://localhost:5050
```

For production deployments, replace with your domain.

### Authentication

Most endpoints require authentication using JWT tokens. Include the token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

### Key Endpoints

#### User Management
- `POST /user/register`: Create a new user account

#### File Management
- `POST /file/upload/{owner}`: Upload a document file
- `GET /file/get-all/{owner}`: List all files uploaded by a specific user
- `GET /file/parse/{owner}/{fileid}`: Parse a specific file

#### Document Querying
- `POST /query/{owner}/{fileid}`: Query a document with natural language

#### Testing
- `GET /test`: Check if the API is running

### Interactive Documentation

When the API is running, you can access the Swagger documentation at:

```
/docs
```

## Code Structure

### Backend Components

#### 1. Main Application (`main.py`)

The entry point for the FastAPI application that defines API endpoints and middleware.

Key functions:
- Initializes the FastAPI application
- Sets up CORS middleware
- Mounts API routers
- Initializes the database
- Manages error handling with custom exception handlers

#### 2. Database Configuration (`config/database.py`)

Manages database connections and sessions.

#### 3. Data Models

- SQLAlchemy Models: For database interaction
- Pydantic Models: For API validation and serialization

#### 4. Routes

API endpoints organized by functionality:

- `file.py`: File upload, listing, and parsing operations
- `query_router.py`: Document querying functionality
- `user.py`: User account management
- `test.py`: Testing and health check endpoints

#### 5. Services

Core business logic and external service integrations:

- **Document Processing** (`parse.py`): Text extraction and chunking
- **RAG Service** (`rag_service.py`): Retrieval and answer generation
- **S3 Handler** (`s3handler.py`): File storage operations
- **Authentication** (`auth.py`): JWT token management

### Frontend Components

The frontend is built with React using Material UI components.

Key technologies:
- React (v19+)
- Material UI 
- React Router
- Axios for API communication
- Vite for build tooling

## Implementation Details

### Document Processing Workflow

```
┌───────────┐     ┌───────────┐     ┌───────────┐     ┌───────────┐     ┌───────────┐
│           │     │           │     │           │     │           │     │           │
│ File      │────▶│ Extract   │────▶│ Chunk     │────▶│ Generate  │────▶│ Store in  │
│ Upload    │     │ Text      │     │ Text      │     │ Embeddings│     │ Database  │
│           │     │           │     │           │     │           │     │           │
└───────────┘     └───────────┘     └───────────┘     └───────────┘     └───────────┘
```

1. **Document Upload**:
   - User uploads a document via the frontend
   - Metadata is stored in PostgreSQL
   - Raw file is stored in AWS S3

2. **Document Parsing**:
   - Document is retrieved from S3
   - Text extraction using `unstructured` library
   - Text is chunked into smaller segments

3. **Vector Embedding**:
   - Text chunks are embedded using HuggingFace embeddings
   - Embeddings are stored in the database

### Query Workflow

```
┌───────────┐     ┌───────────┐     ┌───────────┐     ┌───────────┐
│           │     │           │     │           │     │           │
│ User      │────▶│ Retrieve  │────▶│ Generate  │────▶│ Return    │
│ Query     │     │ Relevant  │     │ Answer    │     │ Response  │
│           │     │ Chunks    │     │ with LLM  │     │           │
└───────────┘     └───────────┘     └───────────┘     └───────────┘
```

1. **Query Processing**:
   - User submits a natural language query
   - Query is embedded using the same embedding model
   - Vector similarity search finds relevant document chunks

2. **Answer Generation**:
   - Retrieved chunks are used as context
   - Language model generates an answer
   - Answer with source chunks is returned to the user

### Database Schema

#### Users Table
- `id`: Primary key
- `name`: User's full name
- `username`: Unique username (also primary key)
- `email`: User's email address
- `password`: Hashed password

#### Files Table
- `id`: Primary key
- `name`: Original filename
- `content_type`: MIME type
- `s3key`: S3 object key
- `user_id`: Foreign key to users table
- `created_at`: Timestamp

#### ParsedContent Table
- `file_id`: Foreign key to files table (primary key)
- `user_id`: Foreign key to users table
- `raw_text`: Extracted text content
- `chunks`: Text chunks
- `vectors`: Vector embeddings
- `created_at`: Timestamp

## Security Considerations

1. **Authentication**: JWT-based authentication
2. **Authorization**: User-based access control for documents
3. **Environment Variables**: Sensitive configuration stored in .env files
4. **AWS Access**: Restricted S3 bucket permissions
5. **Docker Security**:
   - Never commit `.env` files to version control
   - Use Docker secrets or a secure vault for sensitive values in production
   - Keep Docker and all dependencies updated

## Monitoring and Maintenance

### Logging

The application uses Python's built-in logging module. Logs are output to the console by default.

### Docker Container Management

```bash
# View logs from all services
docker-compose logs

# View logs from a specific service
docker-compose logs doc-agent

# Follow logs in real-time
docker-compose logs -f

# Stop the containers
docker-compose down

# Start the containers
docker-compose up -d

# Restart the containers
docker-compose restart
```

### Backups

Regularly back up the PostgreSQL database and S3 files:

1. **Database backup**
   ```bash
   pg_dump -U username docragdb > backup.sql
   ```

2. **S3 backup**
   Use AWS CLI to sync or copy important files to another location.

## Troubleshooting

### Common Issues

1. **Database connection errors**
   - Check that the PostgreSQL service is running
   - Verify DATABASE_URL in the .env file
   - Ensure firewall rules allow connections

2. **S3 access issues**
   - Verify AWS credentials
   - Check bucket permissions
   - Test with AWS CLI

3. **LLM not working**
   - Ensure Ollama is installed and running
   - Check if the model has been downloaded

4. **Docker container issues**
   - Check logs with `docker-compose logs doc-agent`
   - Verify that all environment variables are correctly set
   - If port 5050 is already in use, modify the port mapping

## Code Comments Guide

When adding comments to the codebase, follow these guidelines for consistency and improved readability:

### General Guidelines

1. **Module-Level Documentation**: Add a header comment to each file explaining its purpose
   ```python
   """
   This module handles document parsing and text extraction.
   It provides functions to extract text from various document formats and chunk it for processing.
   """
   ```

2. **Function Documentation**: Use docstrings for all functions
   ```python
   def parse_document(file_content: bytes, content_type: str) -> str:
       """
       Extract raw text from file bytes.
       
       Args:
           file_content: The binary content of the file
           content_type: MIME type of the file
           
       Returns:
           Extracted text as a string
           
       Raises:
           Exception: If parsing fails
       """
   ```

3. **Implementation Comments**: Explain complex logic or algorithms
   ```python
   # Use cosine similarity to find documents with similar vector embeddings
   similarities = cosine_similarity(query_vector_np, stored_vectors_np)[0]
   ```

4. **TODO Comments**: Mark areas for future improvement
   ```python
   # TODO: Implement caching for frequently accessed documents
   ```

### Backend Code Comments to Add

1. **main.py**:
   - Add documentation for the FastAPI app configuration
   - Add comments explaining middleware and router setup
   - Document exception handlers

2. **config/database.py**:
   - Document the database connection logic
   - Explain session management

3. **models/**:
   - Document table structures and relationships
   - Explain field types and constraints

4. **services/parse.py**:
   - Document the text extraction process
   - Explain chunking algorithm and parameters

5. **services/rag_service.py**:
   - Explain the vector similarity search algorithm
   - Document the prompt template and LLM configuration
   - Add comments explaining the RAG process flow

6. **services/s3handler.py**:
   - Document S3 interaction methods
   - Explain error handling

7. **routes/**:
   - Add comments explaining endpoint parameters
   - Document validation logic
   - Explain response structure

### Frontend Code Comments to Add

1. **API Services**:
   - Document API calls and error handling
   - Explain request transformations

2. **Components**:
   - Document component props and state
   - Explain component lifecycle

3. **Context/State Management**:
   - Document state management patterns
   - Explain data flow between components

4. **UI Elements**:
   - Document reusable UI components
   - Explain styling decisions 