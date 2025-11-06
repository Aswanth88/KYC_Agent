# db.py - UPDATED VERSION
from sqlalchemy import Column, Integer, Boolean, String, JSON, DateTime, ForeignKey, Text, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

DATABASE_URL = "sqlite:///./kyc_users.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="user")  # Changed from "auditor" to "user"
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    verified = Column(Boolean, default=False) 
    verified_at = Column(DateTime, nullable=True)

    kyc_applications = relationship("KYCApplication", back_populates="user")

class KYCApplication(Base):
    __tablename__ = "kyc_applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    status = Column(String, default="pending")
    personal_info = Column(JSON)
    identification = Column(JSON)
    financial_info = Column(JSON)
    additional_documents = Column(JSON, nullable=True)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)
    reviewed_by = Column(String, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    audit_trail = Column(JSON, nullable=True)

    user = relationship("User", back_populates="kyc_applications")

# Create tables
Base.metadata.create_all(bind=engine)

# Create demo users
def create_demo_users():
    db = SessionLocal()
    try:
        from auth import pwd_context
        
        demo_users = [
            {
                "username": "admin@finance.com",
                "email": "admin@finance.com", 
                "hashed_password": pwd_context.hash("admin123"),
                "role": "admin",
                "first_name": "Admin",
                "last_name": "User"
            },
            {
                "username": "user@finance.com", 
                "email": "user@finance.com",
                "hashed_password": pwd_context.hash("user123"),
                "role": "user",
                "first_name": "Demo",
                "last_name": "User"
            },
            {
                "username": "auditor@finance.com",
                "email": "auditor@finance.com",
                "hashed_password": pwd_context.hash("auditor123"), 
                "role": "auditor",
                "first_name": "Auditor",
                "last_name": "User"
            }
        ]
        
        for user_data in demo_users:
            existing_user = db.query(User).filter(User.email == user_data["email"]).first()
            if not existing_user:
                user = User(**user_data)
                db.add(user)
        
        db.commit()
        print("✅ Demo users created successfully")
    except Exception as e:
        print(f"❌ Error creating demo users: {e}")
        db.rollback()
    finally:
        db.close()

# Create demo users when module loads
create_demo_users()