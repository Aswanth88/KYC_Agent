# mongodb.py
import os
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

class MongoDB:
    def __init__(self):
        self.client = None
        self.db = None
        self.connect()

    def connect(self):
        try:
            self.client = MongoClient(os.getenv("MONGODB_URI"))
            self.db = self.client[os.getenv("DATABASE_NAME", "kyc_database")]
            print("✅ Connected to MongoDB Atlas")
        except Exception as e:
            print(f"❌ MongoDB connection failed: {e}")
            raise

    def get_collection(self, collection_name):
        return self.db[collection_name]

# Global MongoDB instance
mongodb = MongoDB()

# Collections
def get_users_collection():
    return mongodb.get_collection("users")

def get_kyc_applications_collection():
    return mongodb.get_collection("kyc_applications")

def get_verification_sessions_collection():
    return mongodb.get_collection("verification_sessions")