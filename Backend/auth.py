# auth.py - UPDATED FOR MONGODB
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
from mongodb import get_users_collection

load_dotenv()

router = APIRouter(prefix="/auth", tags=["auth"])

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class RegisterRequest(BaseModel):
    email: str
    password: str
    firstName: str
    lastName: str

class LoginRequest(BaseModel):
    email: str
    password: str

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

@router.post("/register")
async def register(request: RegisterRequest):
    users_collection = get_users_collection()
    
    # Check if user already exists
    existing_user = users_collection.find_one({"email": request.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")

    # Hash password
    hashed_password = pwd_context.hash(request.password)
    
    # Create user document
    user_data = {
        "username": request.email,
        "email": request.email,
        "hashed_password": hashed_password,
        "first_name": request.firstName,
        "last_name": request.lastName,
        "role": "user",
        "verified": False,
        "verified_at": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = users_collection.insert_one(user_data)
    
    return {"message": "User registered successfully", "user_id": str(result.inserted_id)}

@router.post("/login")
async def login(request: LoginRequest):
    users_collection = get_users_collection()
    
    user = users_collection.find_one({"email": request.email})
    if not user or not pwd_context.verify(request.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Create token
    token_data = {
        "sub": user["email"],
        "role": user["role"],
        "email": user["email"],
        "firstName": user["first_name"],
        "lastName": user["last_name"]
    }
    token = create_access_token(token_data)

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user["role"],
        "user": {
            "email": user["email"],
            "firstName": user["first_name"],
            "lastName": user["last_name"],
            "role": user["role"],
            "username": user["username"]
        }
    }

# Create demo users function for MongoDB
def create_demo_users():
    users_collection = get_users_collection()
    
    demo_users = [
        {
            "username": "admin@finance.com",
            "email": "admin@finance.com", 
            "hashed_password": pwd_context.hash("admin123"),
            "role": "admin",
            "first_name": "Admin",
            "last_name": "User",
            "verified": True,
            "created_at": datetime.utcnow()
        },
        {
            "username": "user@finance.com", 
            "email": "user@finance.com",
            "hashed_password": pwd_context.hash("user123"),
            "role": "user",
            "first_name": "Demo",
            "last_name": "User",
            "verified": False,
            "created_at": datetime.utcnow()
        },
        {
            "username": "auditor@finance.com",
            "email": "auditor@finance.com",
            "hashed_password": pwd_context.hash("auditor123"), 
            "role": "auditor",
            "first_name": "Auditor",
            "last_name": "User",
            "verified": True,
            "created_at": datetime.utcnow()
        }
    ]
    
    for user_data in demo_users:
        existing_user = users_collection.find_one({"email": user_data["email"]})
        if not existing_user:
            users_collection.insert_one(user_data)
    
    print("✅ Demo users created in MongoDB")