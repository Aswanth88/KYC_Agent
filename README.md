🚀 KYC Verification System

A full-stack Know Your Customer (KYC) verification system with facial recognition, document processing, and real-time identity verification.

https://img.shields.io/badge/KYC-Verification-blue
https://img.shields.io/badge/Backend-FastAPI-green
https://img.shields.io/badge/Frontend-React-purple
https://img.shields.io/badge/Database-MongoDB-green
📋 Table of Contents

    Features

    Tech Stack

    Project Structure

    Quick Start

    Installation

    Environment Setup

    API Documentation

    Deployment

    Contributing

    License

✨ Features
🔐 Authentication & Security

    JWT-based authentication

    Role-based access control (Admin, User, Auditor)

    Secure password hashing with bcrypt

    CORS protection

📄 Document Processing

    OCR Integration (Tesseract & EasyOCR)

    AI-Powered Extraction (OpenRouter API)

    Automatic lead information extraction from business cards

    KYC-specific data extraction (Aadhaar, PAN, etc.)

    Multi-format document support (Images, PDFs)

👤 Identity Verification

    Facial Recognition with DeepFace

    Liveness Detection with MediaPipe

    Real-time webcam verification

    Document face matching

    Biometric authentication

🏦 KYC Management

    Digital KYC form submission

    Admin dashboard for application review

    Application status tracking

    Audit trail for compliance

    Multi-level verification process

📊 Dashboard & Analytics

    Real-time application statistics

    User management interface

    Verification success metrics

    Administrative oversight

🛠 Tech Stack
Backend

    FastAPI - Modern Python web framework

    MongoDB - NoSQL database with Atlas

    JWT - JSON Web Tokens for authentication

    DeepFace - Facial recognition library

    OpenCV - Computer vision

    Pytesseract - OCR engine

    MediaPipe - Liveness detection

Frontend

    React 18 - UI library

    TypeScript - Type safety

    Vite - Build tool and dev server

    Tailwind CSS - Styling

    Axios - HTTP client

    React Router - Navigation

DevOps & Deployment

    Vercel - Frontend hosting

    Heroku/Railway - Backend hosting

    MongoDB Atlas - Cloud database

    GitHub Actions - CI/CD

📁 Project Structure
text

kyc-project/
├── backend/                 # FastAPI backend
│   ├── kyc_app.py          # Main application
│   ├── auth.py             # Authentication routes
│   ├── kyc_routes.py       # KYC management routes
│   ├── mongodb.py          # Database configuration
│   ├── requirements.txt    # Python dependencies
│   └── Procfile           # Heroku deployment
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom hooks
│   │   ├── pages/          # Route pages
│   │   └── utils/          # Utility functions
│   ├── package.json
│   ├── vite.config.ts
│   └── vercel.json        # Vercel configuration
├── .gitignore             # Git ignore rules
└── README.md              # This file

🚀 Quick Start
Prerequisites

    Python 3.8+

    Node.js 16+

    MongoDB Atlas account

    OpenRouter API account (optional)

1. Clone the Repository
bash

git clone https://github.com/YOUR_USERNAME/kyc-project.git
cd kyc-project

2. Backend Setup
bash

cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

3. Frontend Setup
bash

cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API URL

4. Run the Application
bash

# Terminal 1 - Backend (from backend/)
uvicorn kyc_app:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 - Frontend (from frontend/)
npm run dev

Visit: http://localhost:5173
⚙️ Environment Setup
Backend Environment (.env)
env

MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kyc_database
DATABASE_NAME=kyc_database
SECRET_KEY=your-super-secret-key-here
ALGORITHM=HS256
OPENROUTER_API_KEY=your-openrouter-api-key-optional

Frontend Environment (.env)
env

VITE_API_BASE_URL=http://localhost:8000

📚 API Documentation

Once the backend is running, access the interactive API docs:

    Swagger UI: http://localhost:8000/docs

    ReDoc: http://localhost:8000/redoc

Key Endpoints
Method	Endpoint	Description	Auth Required
POST	/auth/login	User login	No
POST	/auth/register	User registration	No
POST	/verify	Face verification	Yes
POST	/liveness-webcam	Liveness detection	Yes
POST	/ocr	Document OCR	Yes
POST	/extract-leads	Business card processing	Yes
POST	/extract-kyc-data	KYC document processing	Yes
GET	/kyc/all	Get all KYC apps (Admin)	Yes
POST	/kyc/submit	Submit KYC application	Yes
🎯 Demo Accounts
Role	Email	Password	Access
Admin	admin@finance.com	admin123	Full access
User	user@finance.com	user123	Basic features
Auditor	auditor@finance.com	auditor123	Read-only access
🌐 Deployment
Frontend (Vercel)
bash

cd frontend
npm run build
vercel --prod

Backend (Heroku)
bash

cd backend
heroku create your-kyc-backend
git add .
git commit -m "Deploy to Heroku"
git push heroku main

Backend (Railway - Alternative)
bash

cd backend
railway login
railway init
railway up

🐳 Docker Support (Optional)
Backend Dockerfile
dockerfile

FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["uvicorn", "kyc_app:app", "--host", "0.0.0.0", "--port", "8000"]

Frontend Dockerfile
dockerfile

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]

🧪 Testing
Backend Tests
bash

cd backend
pytest tests/

Frontend Tests
bash

cd frontend
npm test

🤝 Contributing

We welcome contributions! Please see our Contributing Guidelines for details.

    Fork the repository

    Create a feature branch (git checkout -b feature/amazing-feature)

    Commit your changes (git commit -m 'Add amazing feature')

    Push to the branch (git push origin feature/amazing-feature)

    Open a Pull Request

📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
🆘 Support

    📧 Email: support@kycapp.com

    🐛 Issues: GitHub Issues

    💬 Discussions: GitHub Discussions

🙏 Acknowledgments

    FastAPI for the excellent web framework

    DeepFace for facial recognition

    MongoDB for database services

    Vercel for frontend hosting

<div align="center">

Built with ❤️ for secure digital identity verification

Report Bug · Request Feature
</div>