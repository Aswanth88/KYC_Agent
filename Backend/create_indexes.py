# create_indexes.py
from mongodb import get_users_collection, get_kyc_applications_collection

def create_database_indexes():
    users_collection = get_users_collection()
    kyc_collection = get_kyc_applications_collection()
    
    # Create indexes for better performance
    users_collection.create_index("email", unique=True)
    users_collection.create_index("username", unique=True)
    kyc_collection.create_index("user_id")
    kyc_collection.create_index("status")
    kyc_collection.create_index("submitted_at")
    
    print("✅ Database indexes created")

if __name__ == "__main__":
    create_database_indexes()