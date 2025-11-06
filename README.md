markdown
# 🚀 KYC Verification System

A full-stack **Know Your Customer (KYC)** verification platform with **facial recognition**, **document OCR**, and **real-time identity validation**.  
The system enables secure onboarding and digital identity verification with role-based access and admin workflows.

[![KYC Verification](https://img.shields.io/badge/KYC-Verification-blue)](#)
[![Backend: FastAPI](https://img.shields.io/badge/Backend-FastAPI-green)](https://fastapi.tiangolo.com/)
[![Frontend: React](https://img.shields.io/badge/Frontend-React-purple)](https://react.dev/)
[![Database: MongoDB](https://img.shields.io/badge/Database-MongoDB-green)](https://www.mongodb.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📋 Table of Contents

- [Overview](#overview)
- [✨ Features](#-features)
- [🛠 Tech Stack](#-tech-stack)
- [📁 Project Structure](#-project-structure)
- [🚀 Quick Start](#-quick-start)
- [⚙️ Environment Setup](#️-environment-setup)
- [📚 API Documentation](#-api-documentation)
- [🌐 Deployment](#-deployment)
- [🐳 Docker Support](#-docker-support)
- [🧪 Testing](#-testing)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [🆘 Support & Acknowledgments](#-support--acknowledgments)

---

## Overview

The **KYC Verification System** simplifies digital identity verification by combining:

- **AI-based document parsing**
- **Facial recognition**
- **Liveness detection**
- **Admin dashboards & audit trails**

It's built for businesses and financial institutions that require **secure onboarding and compliance-ready verification**.

---

## ✨ Features

### 🔐 Authentication & Security

- JWT-based authentication & session management  
- Role-based access (Admin, User, Auditor)  
- Secure password hashing with bcrypt  
- CORS protection & HTTPS ready  

### 📄 Document Processing

- OCR integration using **Tesseract** & **EasyOCR**  
- AI-powered data extraction via **OpenRouter API**  
- Multi-format support (images, PDFs, scanned docs)  
- KYC document parsing (Aadhaar, PAN, business cards)

### 👤 Identity Verification

- Facial recognition with **DeepFace**  
- Real-time webcam verification  
- **MediaPipe**-based liveness detection  
- Document face matching & biometric validation  

### 🏦 KYC Management

- Digital KYC submission workflow  
- Admin dashboard with application review  
- Multi-level verification & approval process  
- Application status tracking & audit trail  

### 📊 Dashboard & Analytics

- Real-time application statistics  
- User management interface  
- Verification success metrics  

---

## 🛠 Tech Stack

**Backend**

- FastAPI (Python)
- MongoDB Atlas
- Uvicorn
- DeepFace, OpenCV, MediaPipe, pytesseract
- JWT, bcrypt

**Frontend**

- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS
- Axios
- React Router DOM

**DevOps**

- Vercel — Frontend hosting  
- Heroku / Railway — Backend hosting  
- MongoDB Atlas — Database  
- GitHub Actions — CI/CD  



## 📁 Project Structure

```
kyc-project/
├── backend/                  # FastAPI backend
│   ├── app/
│   │   ├── main.py           # Entry point
│   │   ├── auth.py           # Auth & role management
│   │   ├── kyc_routes.py     # KYC operations
│   │   ├── mongodb.py        # DB config
│   │   ├── models.py         # Pydantic models
│   │   ├── services/         # OCR & Face recognition logic
│   │   └── utils/            # Helper functions
│   ├── requirements.txt
│   
│   
│
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── utils/
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- Node.js 16+
- MongoDB Atlas account
- (Optional) OpenRouter API key

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/kyc-project.git
cd kyc-project
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate   # (Windows: venv\Scripts\activate)
pip install -r requirements.txt
cp .env.example .env       # then edit your credentials
uvicorn app.main:app --reload
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
cp .env.example .env       # add your backend API URL
npm run dev
```

Visit your app → **[http://localhost:5173](http://localhost:5173)**

---

## ⚙️ Environment Setup

### Backend `.env`

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kyc_database
DATABASE_NAME=kyc_database
SECRET_KEY=your-super-secret-key
ALGORITHM=HS256
OPENROUTER_API_KEY=optional
```

### Frontend `.env`

```env
VITE_API_BASE_URL=http://localhost:8000
```

---

## 📚 API Documentation

Once backend is running:

- Swagger UI → [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc → [http://localhost:8000/redoc](http://localhost:8000/redoc)

| Method | Endpoint          | Description               | 
| ------ | ----------------- | ------------------------- | --
| POST   | /auth/register    | Register a user           | 
| POST   | /auth/login       | Login & JWT               | 
| POST   | /verify           | Face verification         | 
| POST   | /ocr              | OCR & document processing | 
| POST   | /extract-kyc-data | Extract KYC details       | 
| POST   | /kyc/submit       | Submit application        | 
| GET    | /kyc/all          | View all KYC apps (Admin) | 

---

## 🌐 Deployment

### 🔹 Frontend (Vercel)

```bash
cd frontend
npm run build
vercel --prod
```

### 🔹 Backend — Render

This section explains how to deploy the FastAPI backend of the KYC Verification System to Render.

🪄 Prerequisites

A GitHub repository containing both frontend/ and backend/ folders.

The backend must include:

app.py (FastAPI entry point)

requirements.txt

A working virtual environment (for local development)


---

## 🐳 Docker Support

**Backend `Dockerfile`**

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Frontend `Dockerfile`**

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 5173
CMD ["npm", "run", "preview", "--", "--host"]
```

---

## 🧪 Testing

**Backend**

```bash
cd backend
pytest
```

**Frontend**

```bash
cd frontend
npm test
```

---

## 🤝 Contributing

Contributions are welcome 💡

1. Fork the repo
2. Create a new branch: `git checkout -b feature/my-feature`
3. Commit: `git commit -m "Add my feature"`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

Licensed under the **MIT License**.

See the [LICENSE](LICENSE) file for details.

---

## 🆘 Acknowledgments


**Acknowledgments**

- [FastAPI](https://fastapi.tiangolo.com/)
- [DeepFace](https://github.com/serengil/deepface)
- [MongoDB Atlas](https://www.mongodb.com/atlas)
- [Vercel](https://vercel.com/)

---

<div align="center">

### 💙 Built with passion for secure digital identity verification

⭐ **Star** this repo if you find it helpful!

[Report Bug](../../issues) · [Request Feature](../../issues)

</div>
```