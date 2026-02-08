# E-Commerce App with ML Recommendations

This is a full-stack e-commerce application featuring a React frontend, Node.js/Express backend, and a Python/FastAPI machine learning service for product recommendations.

## Project Structure

- **frontend**: React application
- **backend**: Node.js & Express API
- **ml-service**: Python FastAPI service for recommendations

## Prerequisites

- Node.js (v14+ recommended)
- Python (v3.8+ recommended)
- MongoDB

## Setup & Installation

### 1. Backend

 Navigate to the backend directory and install dependencies:

```bash
cd backend
npm install
```

Start the backend server:

```bash
npm run dev
```
The server will start on port 5000 (default).

### 2. Frontend

Navigate to the frontend directory and install dependencies:

```bash
cd frontend
npm install
```

Start the React development server:

```bash
npm start
```
The application will run on port 3000 (default).

### 3. ML Service

Navigate to the ml-service directory:

```bash
cd ml-service
```

Create a virtual environment (optional but recommended):
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate
```

Install dependencies:
```bash
pip install -r requirements.txt
```

Start the service:
```bash
uvicorn main:app --reload --port 8000
```
The ML service will run on port 8000.

## Environment Variables

Ensure you have `.env` files set up in `backend` and `frontend` as needed.
Check `.env.example` if available, or refer to codebase for required variables (e.g., `MONGO_URI`, `PORT`, etc.).

## Features

- Product browsing and searching
- User authentication
- Shopping cart and ordering (simulated)
- **ML Recommendations**: Personalized product recommendations based on user interactions.
