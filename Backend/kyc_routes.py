# kyc_routes.py - UPDATED FOR MONGODB
from fastapi import APIRouter, Depends, HTTPException, Header, Query
from bson import ObjectId
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from mongodb import get_kyc_applications_collection, get_users_collection
from dotenv import load_dotenv
from auth import SECRET_KEY, ALGORITHM
from jose import jwt, JWTError

router = APIRouter(prefix="/kyc", tags=["KYC"])
load_dotenv()

# Pydantic models
class Address(BaseModel):
    street: str
    city: str
    state: str
    zipCode: str
    country: str

class PersonalInfo(BaseModel):
    firstName: str
    lastName: str
    dateOfBirth: str
    nationality: str
    phoneNumber: str
    address: Address

class Identification(BaseModel):
    documentType: str
    documentNumber: str
    expiryDate: str

class FinancialInfo(BaseModel):
    sourceOfFunds: str
    estimatedTransactionVolume: str
    purposeOfAccount: str
    employmentStatus: str
    annualIncome: str

class KYCRequest(BaseModel):
    personalInfo: PersonalInfo
    identification: Identification
    financialInfo: FinancialInfo

# JWT Helper
def get_current_user(authorization: str = Header(...)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token format")

    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        return email
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

# Helper function to transform MongoDB document
def transform_kyc_app(app):
    # Handle both SQLite and MongoDB structures
    user_id = app.get("user_id") or app.get("userId")
    
    # Handle submitted_at - it could be string or datetime
    submitted_at = app.get("submitted_at")
    if isinstance(submitted_at, datetime):
        submitted_at = submitted_at.isoformat()
    
    # Handle reviewed_at
    reviewed_at = app.get("reviewed_at")
    if isinstance(reviewed_at, datetime):
        reviewed_at = reviewed_at.isoformat()
    
    return {
        "id": str(app.get("_id", app.get("id"))),
        "userId": str(user_id) if user_id else None,
        "status": app.get("status", "pending"),
        "personalInfo": app.get("personal_info", app.get("personalInfo", {})),
        "identification": app.get("identification", {}),
        "financialInfo": app.get("financial_info", app.get("financialInfo", {})),
        "additionalDocuments": app.get("additional_documents", app.get("additionalDocuments", {})),
        "submittedAt": submitted_at,
        "reviewedAt": reviewed_at,
        "reviewedBy": app.get("reviewed_by", app.get("reviewedBy")),
        "rejectionReason": app.get("rejection_reason", app.get("rejectionReason")),
        "auditTrail": app.get("audit_trail", app.get("auditTrail", []))
    }

@router.post("/submit")
def submit_kyc(request: KYCRequest, user_email: str = Depends(get_current_user)):
    users_collection = get_users_collection()
    kyc_collection = get_kyc_applications_collection()
    
    user = users_collection.find_one({"email": user_email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check for existing pending application
    existing_app = kyc_collection.find_one({
        "user_id": user["_id"],
        "status": {"$in": ["pending", "under_review"]}
    })
    
    if existing_app:
        raise HTTPException(status_code=400, detail="You already have a pending KYC application")

    # Create new KYC application
    kyc_data = {
        "user_id": user["_id"],
        "user_email": user_email,
        "status": "pending",
        "personal_info": request.personalInfo.dict(),
        "identification": request.identification.dict(),
        "financial_info": request.financialInfo.dict(),
        "submitted_at": datetime.utcnow(),
        "audit_trail": [{
            "action": "Application submitted",
            "performedBy": user_email,
            "timestamp": datetime.utcnow().isoformat(),
            "details": "KYC application submitted by user"
        }]
    }
    
    result = kyc_collection.insert_one(kyc_data)
    
    return {"message": "KYC submitted successfully", "id": str(result.inserted_id)}

@router.get("/all")
def get_all_kyc(user_email: str = Depends(get_current_user)):
    users_collection = get_users_collection()
    kyc_collection = get_kyc_applications_collection()
    
    user = users_collection.find_one({"email": user_email})
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    # Get all KYC applications
    apps = list(kyc_collection.find())
    transformed_apps = [transform_kyc_app(app) for app in apps]
    
    return transformed_apps

@router.get("/my-applications")
def get_my_applications(user_email: str = Depends(get_current_user)):
    users_collection = get_users_collection()
    kyc_collection = get_kyc_applications_collection()
    
    user = users_collection.find_one({"email": user_email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    apps = list(kyc_collection.find({"user_id": user["_id"]}))
    transformed_apps = [transform_kyc_app(app) for app in apps]
    
    return transformed_apps

@router.put("/{kyc_id}/status")
def update_status(
    kyc_id: str, 
    status: str = Query(..., description="Status: approved, rejected, or under_review"),
    reason: Optional[str] = Query(None),
    user_email: str = Depends(get_current_user)
):
    users_collection = get_users_collection()
    kyc_collection = get_kyc_applications_collection()
    
    user = users_collection.find_one({"email": user_email})
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    try:
        app_object_id = ObjectId(kyc_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid KYC ID format")

    app = kyc_collection.find_one({"_id": app_object_id})
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    # Update application
    update_data = {
        "status": status,
        "reviewed_at": datetime.utcnow(),
        "reviewed_by": user_email
    }
    
    if status == "rejected" and reason:
        update_data["rejection_reason"] = reason

    # Update audit trail
    current_audit = app.get("audit_trail", [])
    current_audit.append({
        "action": f"Status updated to {status}",
        "performedBy": user_email,
        "timestamp": datetime.utcnow().isoformat(),
        "details": reason if reason else f"Application {status}"
    })
    update_data["audit_trail"] = current_audit

    kyc_collection.update_one(
        {"_id": app_object_id},
        {"$set": update_data}
    )

    updated_app = kyc_collection.find_one({"_id": app_object_id})
    
    return {"message": f"KYC {status} successfully", "application": transform_kyc_app(updated_app)}