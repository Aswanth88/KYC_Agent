# kyc_app.py
import datetime
import io
import tempfile
import re
import os
import time
import json
import base64
from typing import Optional, List, Dict
from pathlib import Path
from dataclasses import dataclass
from concurrent.futures import ThreadPoolExecutor, TimeoutError, as_completed

# Third-party imports
import pytesseract
import cv2
import numpy as np
import requests
from PIL import Image as PILImage
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, Header
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from jose import jwt, JWTError
from deepface import DeepFace
from dotenv import load_dotenv

# Local imports
from mongodb import get_users_collection, get_kyc_applications_collection
from auth import SECRET_KEY, ALGORITHM, router as auth_router, create_demo_users
from kyc_routes import router as kyc_router

# Load environment variables
load_dotenv()

# Optional imports with fallbacks
try:
    import easyocr
    _EASYOCR_AVAILABLE = True
except ImportError:
    _EASYOCR_AVAILABLE = False

try:
    import mediapipe as mp
    _MEDIAPIPE_AVAILABLE = True
except ImportError:
    _MEDIAPIPE_AVAILABLE = False


# =============================================================================
# DATA CLASSES
# =============================================================================

@dataclass
class Lead:
    """Data class to represent extracted lead information"""
    name: Optional[str] = None
    company: Optional[str] = None
    title: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    industry: Optional[str] = None
    website: Optional[str] = None
    social_media: Optional[Dict[str, str]] = None
    additional_info: Optional[str] = None


# =============================================================================
# DOCUMENT PROCESSOR CLASS
# =============================================================================

class DocumentImageProcessor:
    """Integrated Document Image Processor for KYC application"""
    
    def __init__(self, openrouter_api_key: str = None, 
                 model_name: str = "mistralai/mistral-small-3.2-24b-instruct:free", 
                 api_timeout: int = 30, max_documents_for_api: int = 5):
        """
        Initialize the processor with optional OpenRouter API key
        """
        # Debug environment variables
        print("🔍 Checking environment variables...")
        print(f"OPENROUTER_API_KEY exists: {'OPENROUTER_API_KEY' in os.environ}")
        if 'OPENROUTER_API_KEY' in os.environ:
            key = os.getenv("OPENROUTER_API_KEY")
            print(f"OPENROUTER_API_KEY length: {len(key) if key else 0}")
            print(f"OPENROUTER_API_KEY starts with: {key[:10] if key else 'None'}")
        
        self.api_key = openrouter_api_key or os.getenv("OPENROUTER_API_KEY")
        self.model_name = model_name
        self.base_url = "https://openrouter.ai/api/v1/chat/completions"
        self.api_timeout = api_timeout
        self.max_documents_for_api = max_documents_for_api
        
        self._setup_regex_patterns()
        
        print(f"📄 DocumentImageProcessor initialized with API: {self.api_key is not None}")
        if self.api_key:
            print(f"✅ OpenRouter API key loaded successfully")
            print(f"🔑 API Key starts with: {self.api_key[:10]}...")
        else:
            print("❌ No OpenRouter API key found, will use OCR only")
            print("💡 Check if .env file is in the correct location and format")
    
    def _setup_regex_patterns(self):
        """Setup regex patterns for extracting lead information"""
        self.email_pattern = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
        self.phone_pattern = re.compile(r'(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})')
        self.website_pattern = re.compile(r'https?://(?:[-\w.])+(?:\.[a-zA-Z]{2,})+(?:/(?:[\w/_.])*)?(?:\?(?:[\w&=%.])*)?(?:#(?:[\w.])*)?')
        self.linkedin_pattern = re.compile(r'(?:linkedin\.com/in/|@)([a-zA-Z0-9-]+)')
        self.twitter_pattern = re.compile(r'(?:twitter\.com/|@)([a-zA-Z0-9_]+)')
        self.name_pattern = re.compile(r'\b[A-Z][a-z]+\s+[A-Z][a-z]+\b')
        
        self.title_keywords = [
            'CEO', 'CTO', 'CFO', 'COO', 'President', 'Vice President', 'VP',
            'Director', 'Manager', 'Engineer', 'Developer', 'Analyst', 'Consultant',
            'Specialist', 'Coordinator', 'Assistant', 'Executive', 'Lead', 'Senior',
            'Principal', 'Head of', 'Chief'
        ]
        
        self.company_indicators = [
            'Inc', 'LLC', 'Corp', 'Corporation', 'Company', 'Ltd', 'Limited',
            'Technologies', 'Solutions', 'Services', 'Group', 'Associates'
        ]
    
    # =========================================================================
    # BASIC OCR METHODS
    # =========================================================================
    
    def extract_text_with_tesseract(self, image_path: str) -> str:
        """Extract text from image using Tesseract OCR"""
        try:
            text = pytesseract.image_to_string(PILImage.open(image_path))
            return text
        except Exception as e:
            print(f"Error extracting text with Tesseract: {str(e)}")
            return ""
    
    def extract_leads_with_regex(self, text: str) -> List[Lead]:
        """Extract lead information from text using regex patterns"""
        leads = []
        
        emails = self.email_pattern.findall(text)
        phones = self.phone_pattern.findall(text)
        websites = self.website_pattern.findall(text)
        names = self.name_pattern.findall(text)
        linkedin_handles = self.linkedin_pattern.findall(text)
        twitter_handles = self.twitter_pattern.findall(text)
        
        lines = text.split('\n')
        
        for i, line in enumerate(lines):
            line = line.strip()
            if not line:
                continue
                
            line_emails = self.email_pattern.findall(line)
            line_phones = self.phone_pattern.findall(line)
            line_names = self.name_pattern.findall(line)
            
            if line_emails or line_phones or line_names:
                lead = Lead()
                context_lines = []
                
                for j in range(max(0, i-2), min(len(lines), i+3)):
                    context_lines.append(lines[j].strip())
                
                context_text = ' '.join(context_lines)
                
                # Extract basic information
                if line_emails:
                    lead.email = line_emails[0]
                if line_phones:
                    lead.phone = f"({line_phones[0][0]}) {line_phones[0][1]}-{line_phones[0][2]}"
                if line_names:
                    lead.name = line_names[0]
                elif names:
                    for name in names:
                        if name in context_text:
                            lead.name = name
                            break
                
                # Extract title
                for title in self.title_keywords:
                    if title.lower() in context_text.lower():
                        lead.title = title
                        break
                
                # Extract company
                for indicator in self.company_indicators:
                    pattern = rf'\b\w+\s+{indicator}\b'
                    company_match = re.search(pattern, context_text, re.IGNORECASE)
                    if company_match:
                        lead.company = company_match.group()
                        break
                
                # Extract website
                website_matches = self.website_pattern.findall(context_text)
                if website_matches:
                    lead.website = website_matches[0]
                
                # Extract social media
                social_media = {}
                for handle in linkedin_handles:
                    if handle in context_text:
                        social_media['linkedin'] = handle
                        break
                for handle in twitter_handles:
                    if handle in context_text:
                        social_media['twitter'] = handle
                        break
                
                if social_media:
                    lead.social_media = social_media
                
                lead.additional_info = context_text[:200] + "..." if len(context_text) > 200 else context_text
                
                if lead.email or lead.phone or lead.name:
                    leads.append(lead)
        
        # Fallback: create basic leads from extracted data
        if not leads:
            max_items = max(len(emails), len(phones), len(names))
            for i in range(max_items):
                lead = Lead()
                if i < len(emails):
                    lead.email = emails[i]
                if i < len(phones):
                    lead.phone = f"({phones[i][0]}) {phones[i][1]}-{phones[i][2]}"
                if i < len(names):
                    lead.name = names[i]
                
                if lead.email or lead.phone or lead.name:
                    leads.append(lead)
        
        return leads
    
    # =========================================================================
    # IMAGE PROCESSING METHODS
    # =========================================================================
    
    def encode_image(self, image_path: str) -> str:
        """Encode image to base64 string"""
        try:
            with open(image_path, "rb") as image_file:
                return base64.b64encode(image_file.read()).decode('utf-8')
        except Exception as e:
            raise Exception(f"Error encoding image: {str(e)}")
    
    def compress_image(self, image_path: str, max_size: int = 1024) -> str:
        """Compress image while maintaining aspect ratio"""
        try:
            with PILImage.open(image_path) as img:
                if img.mode in ('RGBA', 'LA'):
                    img = img.convert('RGB')
                
                width, height = img.size
                if width > max_size or height > max_size:
                    if width > height:
                        new_width = max_size
                        new_height = int((height * max_size) / width)
                    else:
                        new_height = max_size
                        new_width = int((width * max_size) / height)
                    
                    img = img.resize((new_width, new_height), PILImage.Resampling.LANCZOS)
                
                buffer = io.BytesIO()
                img.save(buffer, format='JPEG', quality=85)
                return base64.b64encode(buffer.getvalue()).decode('utf-8')
        except Exception as e:
            raise Exception(f"Error compressing image: {str(e)}")
    
    # =========================================================================
    # OPENROUTER API METHODS
    # =========================================================================
    
    def extract_text_from_image(self, image_path: str) -> str:
        """Extract text from image using OpenRouter API"""
        try:
            base64_image = self.compress_image(image_path)
            
            prompt = """
            Please extract all text content from this image. Focus on:
            - Names of people and organizations
            - Contact information (emails, phone numbers, addresses)
            - Job titles and positions
            - Company names and industries
            - Website URLs and social media handles
            - Any other relevant business information
            
            Please provide the extracted text in a structured format.
            """
            
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://your-app.com",
                "X-Title": "Lead Extraction App"
            }
            
            data = {
                "model": self.model_name,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                        ]
                    }
                ]
            }
            
            response = requests.post(self.base_url, headers=headers, json=data, timeout=self.api_timeout)
            response.raise_for_status()
            
            result = response.json()
            
            if 'choices' not in result or not result['choices']:
                raise Exception("No choices returned from API")
            
            return result['choices'][0]['message']['content']
            
        except requests.exceptions.Timeout:
            raise TimeoutError(f"API request timed out after {self.api_timeout} seconds")
        except Exception as e:
            raise Exception(f"Error extracting text from image: {str(e)}")
    
    def generate_leads_from_text(self, text: str) -> List[Lead]:
        """Generate lead information from extracted text using OpenRouter API"""
        try:
            prompt = f"""
            Based on the following text, extract and structure lead information. 
            Please identify all potential leads (people/companies) and return them in JSON format.
            
            For each lead, extract:
            - name (person or company name)
            - company (if it's a person, their company)
            - title (job title/position)
            - email (email address)
            - phone (phone number)
            - address (physical address)
            - industry (business industry)
            - website (website URL)
            - social_media (social media handles as key-value pairs)
            - additional_info (any other relevant information)
            
            Text to analyze:
            {text}
            
            Please return the response as a JSON array of lead objects.
            """
            
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://your-app.com",
                "X-Title": "Lead Extraction App"
            }
            
            data = {
                "model": self.model_name,
                "messages": [{"role": "user", "content": prompt}]
            }
            
            response = requests.post(self.base_url, headers=headers, json=data, timeout=self.api_timeout)
            response.raise_for_status()
            
            result = response.json()
            
            if 'choices' not in result or not result['choices']:
                raise Exception("No choices returned from API")
            
            content = result['choices'][0]['message']['content']
            
            # Extract JSON from response
            try:
                start = content.find('[')
                end = content.rfind(']') + 1
                if start != -1 and end != 0:
                    json_str = content[start:end]
                    leads_data = json.loads(json_str)
                else:
                    leads_data = json.loads(content)
                
                leads = []
                for lead_data in leads_data:
                    lead = Lead(
                        name=lead_data.get('name'),
                        company=lead_data.get('company'),
                        title=lead_data.get('title'),
                        email=lead_data.get('email'),
                        phone=lead_data.get('phone'),
                        address=lead_data.get('address'),
                        industry=lead_data.get('industry'),
                        website=lead_data.get('website'),
                        social_media=lead_data.get('social_media'),
                        additional_info=lead_data.get('additional_info')
                    )
                    leads.append(lead)
                
                return leads
                
            except json.JSONDecodeError:
                print(f"Warning: Could not parse JSON from response: {content}")
                return []
                
        except requests.exceptions.Timeout:
            raise TimeoutError(f"API request timed out after {self.api_timeout} seconds")
        except Exception as e:
            raise Exception(f"Error generating leads from text: {str(e)}")
    
    # =========================================================================
    # KYC-SPECIFIC EXTRACTION METHODS
    # =========================================================================
    
    def extract_kyc_specific_data(self, text: str) -> Dict:
        """Extract KYC-specific information from text"""
        kyc_data = {
            'name': [],
            'gender': None,
            'date_of_birth': None,
            'mobile_number': None,
            'aadhaar_number': None,
            'address': None,
            'pan_number': None
        }
        
        # Enhanced patterns for Indian documents
        aadhaar_pattern = re.compile(r'\b\d{4}\s?\d{4}\s?\d{4}\b')
        pan_pattern = re.compile(r'[A-Z]{5}[0-9]{4}[A-Z]')
        mobile_pattern = re.compile(r'(\+91[\-\s]?)?[789]\d{9}')
        dob_pattern = re.compile(r'(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})|(\d{2,4}[-/]\d{1,2}[-/]\d{1,2})')
        
        # Extract Aadhaar
        aadhaar_matches = aadhaar_pattern.findall(text)
        if aadhaar_matches:
            kyc_data['aadhaar_number'] = aadhaar_matches[0].replace(' ', '')
        
        # Extract PAN
        pan_matches = pan_pattern.findall(text)
        if pan_matches:
            kyc_data['pan_number'] = pan_matches[0]
        
        # Extract Mobile
        mobile_matches = mobile_pattern.findall(text)
        if mobile_matches:
            kyc_data['mobile_number'] = mobile_matches[0] if isinstance(mobile_matches[0], str) else mobile_matches[0][0]
        
        # Extract DOB
        dob_matches = dob_pattern.findall(text)
        if dob_matches:
            for match in dob_matches:
                dob_str = next((m for m in match if m), None)
                if dob_str:
                    kyc_data['date_of_birth'] = dob_str
                    break
        
        # Enhanced name extraction for Indian names
        name_pattern = re.compile(r'(?:Name|Full Name|नाम)[\s:\-]*([A-Za-z\s]{3,50})', re.IGNORECASE)
        name_matches = name_pattern.findall(text)
        if name_matches:
            full_name = name_matches[0].strip()
            name_parts = full_name.split()
            kyc_data['name'] = name_parts
        
        # Address extraction
        address_pattern = re.compile(r'(?:Address|पता)[\s:\-]*([A-Za-z0-9\s,\-\\.]{10,100})', re.IGNORECASE)
        address_matches = address_pattern.findall(text)
        if address_matches:
            kyc_data['address'] = address_matches[0].strip()
        
        return kyc_data
    
    def process_image_for_kyc(self, image_path: str) -> Dict:
        """Process image specifically for KYC form data extraction using OpenRouter"""
        print(f"Processing KYC image with OpenRouter API: {image_path}")
        
        try:
            base64_image = self.compress_image(image_path)
            
            prompt = """
            Extract ALL personal identification information from this Indian document image. 
            Return ONLY a JSON object with the following structure. Do not include any other text or explanations.
            
            Required JSON format:
            {
                "name": ["FirstName", "LastName"],
                "gender": "Male/Female/Other",
                "date_of_birth": "DD/MM/YYYY",
                "mobile_number": "10-digit number",
                "aadhaar_number": "12-digit number", 
                "pan_number": "10-character PAN",
                "address": "Complete address here"
            }
            
            Extract from the image:
            - Full name (split into first and last name if possible)
            - Gender
            - Date of birth
            - Mobile number
            - Aadhaar number
            - PAN number
            - Complete address
            
            If any field is not found, set it to null.
            IMPORTANT: Return ONLY valid JSON, no other text.
            """
            
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://your-app.com",
                "X-Title": "KYC Extraction App"
            }
            
            data = {
                "model": self.model_name,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                        ]
                    }
                ]
            }
            
            response = requests.post(self.base_url, headers=headers, json=data, timeout=self.api_timeout)
            response.raise_for_status()
            
            result = response.json()
            
            if 'choices' not in result or not result['choices']:
                raise Exception("No choices returned from API")
            
            content = result['choices'][0]['message']['content']
            print(f"📄 Raw API Response: {content}")
            
            # Extract JSON from response - more robust parsing
            try:
                # Clean the content - remove markdown code blocks if present
                cleaned_content = content.strip()
                if cleaned_content.startswith('```json'):
                    cleaned_content = cleaned_content[7:]
                if cleaned_content.startswith('```'):
                    cleaned_content = cleaned_content[3:]
                if cleaned_content.endswith('```'):
                    cleaned_content = cleaned_content[:-3]
                cleaned_content = cleaned_content.strip()
                
                # Parse JSON
                kyc_data = json.loads(cleaned_content)
                print(f"✅ Parsed KYC Data: {kyc_data}")
                return kyc_data
                
            except json.JSONDecodeError as e:
                print(f"❌ JSON parsing failed: {e}")
                print(f"📄 Content that failed to parse: {content}")
                # Fallback to manual extraction from text
                return self._extract_kyc_from_text(content)
                
        except Exception as e:
            print(f"❌ API KYC extraction failed: {e}, falling back to OCR")
            extracted_text = self.extract_text_with_tesseract(image_path)
            return self.extract_kyc_specific_data(extracted_text)
    
    def _extract_kyc_from_text(self, text: str) -> Dict:
        """Extract KYC data from unstructured text response"""
        print("🔄 Falling back to manual text extraction")
        
        kyc_data = {
            'name': [],
            'gender': None,
            'date_of_birth': None,
            'mobile_number': None,
            'aadhaar_number': None,
            'address': None,
            'pan_number': None
        }
        
        # Extract name
        name_patterns = [
            r'"name":\s*\["([^"]+)",\s*"([^"]+)"\]',
            r'"name":\s*\["([^"]+)"\]',
            r'Name[:\-\s]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)',
            r'"name":\s*"([^"]+)"'
        ]
        
        for pattern in name_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                if len(match.groups()) >= 2:
                    kyc_data['name'] = [match.group(1), match.group(2)]
                else:
                    full_name = match.group(1).split()
                    kyc_data['name'] = full_name if len(full_name) > 1 else [full_name[0], ""]
                break
        
        # Extract date of birth
        dob_patterns = [
            r'"date_of_birth":\s*"([^"]+)"',
            r'Date of Birth[:\-\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{4})',
            r'DOB[:\-\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{4})'
        ]
        
        for pattern in dob_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                kyc_data['date_of_birth'] = match.group(1)
                break
        
        # Extract gender
        gender_patterns = [
            r'"gender":\s*"([^"]+)"',
            r'Gender[:\-\s]*([MF][ale]*|Male|Female)',
        ]
        
        for pattern in gender_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                kyc_data['gender'] = match.group(1)
                break
        
        print(f"🔍 Manually extracted KYC data: {kyc_data}")
        return kyc_data
    
    # =========================================================================
    # MAIN PROCESSING METHODS
    # =========================================================================
    
    def process_image_with_api(self, image_path: str) -> List[Lead]:
        """Process image using API (OpenRouter)"""
        print(f"Processing image with OpenRouter API: {image_path}")
        
        extracted_text = self.extract_text_from_image(image_path)
        print(f"Extracted text: {extracted_text[:200]}...")
        
        leads = self.generate_leads_from_text(extracted_text)
        print(f"Generated {len(leads)} leads")
        
        return leads
    
    def process_image_with_ocr(self, image_path: str) -> List[Lead]:
        """Process image using Tesseract OCR and regex"""
        print(f"Processing image with OCR: {image_path}")
        
        extracted_text = self.extract_text_with_tesseract(image_path)
        print(f"Extracted text length: {len(extracted_text)}")
        
        leads = self.extract_leads_with_regex(extracted_text)
        print(f"Generated {len(leads)} leads")
        
        return leads


# =============================================================================
# FASTAPI APP SETUP
# =============================================================================

app = FastAPI(title="KYC")

# CORS setup
origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Or specify: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers=["*"],  # Or specify needed headers
    expose_headers=["*"],  # Expose any custom headers if needed
)

# Include routers
app.include_router(auth_router)
app.include_router(kyc_router)

# Initialize DocumentImageProcessor
document_processor = DocumentImageProcessor()


# =============================================================================
# AUTHENTICATION
# =============================================================================

def get_current_user(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing token")
    
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return username
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

def read_image_bytes_to_rgb_array(content: bytes) -> np.ndarray:
    if not content:
        raise ValueError("Empty image bytes")
    arr = np.frombuffer(content, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image bytes")
    return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

def load_image_from_uploadfile(upload: UploadFile) -> np.ndarray:
    content = upload.file.read()
    if not content:
        raise HTTPException(status_code=400, detail=f"Empty file: {upload.filename}")
    try:
        return read_image_bytes_to_rgb_array(content)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image: {upload.filename} - {str(e)}")

def perform_ocr_on_image(img_gray, language="en"):
    text = ""
    if _EASYOCR_AVAILABLE:
        reader = easyocr.Reader([language], gpu=False)
        img_rgb = cv2.cvtColor(img_gray, cv2.COLOR_GRAY2RGB)
        result = reader.readtext(img_rgb, detail=0)
        text = "\n".join(result)
    elif _PYTESSERACT_AVAILABLE:
        text = pytesseract.image_to_string(img_gray, lang=language)
    else:
        print("No OCR engine available, using DocumentImageProcessor")
        tmp_path = tempfile.mktemp(suffix=".jpg")
        try:
            cv2.imwrite(tmp_path, img_gray)
            leads = document_processor.process_image_with_ocr(tmp_path)
            lead_texts = []
            for lead in leads:
                lead_info = [
                    f"Name: {lead.name or 'N/A'}",
                    f"Company: {lead.company or 'N/A'}",
                    f"Title: {lead.title or 'N/A'}",
                    f"Email: {lead.email or 'N/A'}",
                    f"Phone: {lead.phone or 'N/A'}",
                    f"Website: {lead.website or 'N/A'}",
                    f"Additional Info: {lead.additional_info or 'N/A'}"
                ]
                lead_texts.append("\n".join(lead_info))
            text = "\n\n".join(lead_texts)
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
    return text

def extract_name_from_text(text: str):
    m = re.search(r"(?:Name|Full Name)[:\-\s]*\n?\s*([A-Z][A-Za-z\s,.\-']{2,80})", text)
    return m.group(1).strip() if m else None

def extract_dob_from_text(text: str):
    m = re.search(r"(\d{1,2}[\/\-\.\s]\d{1,2}[\/\-\.\s]\d{2,4})", text)
    return m.group(1) if m else None

def extract_id_number_from_text(text: str):
    m = re.search(r"([A-Z0-9\-]{6,20})", text)
    return m.group(1) if m else None

def extract_program_from_text(text: str):
    m = re.search(r"(?:Program|Course)[:\-\s]*\n?\s*([A-Za-z0-9\s\-&]+)", text)
    return m.group(1).strip() if m else None

def extract_custom_id_from_text(text: str):
    m = re.search(r"(?:ID|Enrollment No|Student ID)[:\-\s]*([A-Z0-9\-]{4,20})", text)
    return m.group(1).strip() if m else None


# =============================================================================
# API ENDPOINTS
# =============================================================================

# Store session landmarks for liveness detection
LIVE_SESSIONS = {}

@app.post("/verify")
async def verify(
    selfie: UploadFile = File(..., description="Selfie image file"),
    idphoto: UploadFile = File(..., description="ID face image or full ID card"),
    model: str = Form("ArcFace"),
    detector: str = Form("retinaface"),
    threshold: Optional[float] = Form(None),
    require_liveness: bool = Form(False),
    current_user: str = Depends(get_current_user) 
):
    """Performs DeepFace.verify between selfie and idphoto"""
    try:
        img1 = load_image_from_uploadfile(selfie)
        img2 = load_image_from_uploadfile(idphoto)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    try:
        result = DeepFace.verify(
            img1_path=img1,
            img2_path=img2,
            model_name=model,
            detector_backend=detector,
            enforce_detection=True
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DeepFace error: {e}")

    distance = float(result.get("distance", 999.0))
    default_threshold = float(result.get("threshold", 0.4))
    use_threshold = threshold if threshold is not None else default_threshold
    verified = distance <= use_threshold

    # Update user verification status in MongoDB
    if verified:
        try:
            users_collection = get_users_collection()
            kyc_collection = get_kyc_applications_collection()
            
            # Update user verification status
            users_collection.update_one(
                {"email": current_user},
                {
                    "$set": {
                        "verified": True,
                        "verified_at": datetime.datetime.utcnow()
                    }
                }
            )
            
            # Find or create KYC application
            user = users_collection.find_one({"email": current_user})
            if user:
                existing_kyc = kyc_collection.find_one({"user_id": user["_id"]})
                
                if existing_kyc:
                    # Update existing KYC
                    kyc_collection.update_one(
                        {"_id": existing_kyc["_id"]},
                        {
                            "$set": {
                                "status": "approved",
                                "reviewed_at": datetime.datetime.utcnow(),
                                "reviewed_by": "system"
                            },
                            "$push": {
                                "audit_trail": {
                                    "action": "Face verification completed",
                                    "timestamp": datetime.datetime.utcnow().isoformat(),
                                    "performed_by": "system"
                                }
                            }
                        }
                    )
                else:
                    # Create new KYC application
                    kyc_data = {
                        "user_id": user["_id"],
                        "user_email": current_user,
                        "status": "approved",
                        "personal_info": {"face_verified": True},
                        "identification": {"verified": True},
                        "financial_info": {},
                        "submitted_at": datetime.datetime.utcnow(),
                        "reviewed_at": datetime.datetime.utcnow(),
                        "reviewed_by": "system",
                        "audit_trail": [{
                            "action": "Face verification completed",
                            "timestamp": datetime.datetime.utcnow().isoformat(),
                            "performed_by": "system"
                        }]
                    }
                    kyc_collection.insert_one(kyc_data)
                
                print(f"✅ User {current_user} marked as verified in MongoDB")
                
        except Exception as e:
            print(f"❌ Error updating user verification status: {e}")

    return {
        "verified": verified,
        "distance": distance,
        "threshold_used": use_threshold,
        "model": model,
        "detector": detector,
        "deepface_raw": result
    }


@app.post("/liveness-webcam")
async def liveness_webcam(user_id: str = Form(...), frame: UploadFile = File(...)):
    """Real-time webcam liveness detection"""
    if not _MEDIAPIPE_AVAILABLE:
        return {"live": False, "reason": "MediaPipe not installed"}

    img = load_image_from_uploadfile(frame)
    mp_face = mp.solutions.face_mesh
    face_mesh = mp_face.FaceMesh(static_image_mode=False, max_num_faces=1,
                                 refine_landmarks=False, min_detection_confidence=0.5)
    results = face_mesh.process(img)
    face_mesh.close()

    if not results.multi_face_landmarks:
        return {"live": False, "reason": "No face detected"}

    landmarks = np.array([[p.x, p.y] for p in results.multi_face_landmarks[0].landmark])

    if user_id not in LIVE_SESSIONS:
        LIVE_SESSIONS[user_id] = []
    LIVE_SESSIONS[user_id].append(landmarks)

    frames_landmarks = LIVE_SESSIONS[user_id]
    if len(frames_landmarks) < 6:
        return {"live": False, "reason": "collecting_frames", "frames_collected": len(frames_landmarks)}

    displacements = []
    for i in range(1, len(frames_landmarks)):
        prev, cur = frames_landmarks[i - 1], frames_landmarks[i]
        if prev.shape != cur.shape:
            continue
        d = np.linalg.norm(cur - prev, axis=1)
        displacements.append(float(np.mean(d)))

    avg_disp = float(np.mean(displacements))
    threshold = 0.02
    is_live = avg_disp >= threshold

    if is_live:
        LIVE_SESSIONS.pop(user_id, None)

    return {"live": is_live, "average_displacement": avg_disp, "threshold": threshold, "frames_analyzed": len(frames_landmarks)}

@app.post("/ocr")
async def ocr_document(
    doc: UploadFile = File(..., description="ID document image (jpg/png/pdf)"),
    language: str = Form("en"),
    use_fallback: bool = Form(True)
):
    """OCR endpoint with DocumentImageProcessor fallback"""
    tmp_path = tempfile.mktemp(suffix=os.path.splitext(doc.filename)[1])
    with open(tmp_path, "wb") as f:
        f.write(await doc.read())

    texts = []
    try:
        img = cv2.imread(tmp_path)
        if img is None:
            raise HTTPException(status_code=400, detail="Could not read uploaded image")
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        try:
            extracted_text = perform_ocr_on_image(gray, language=language)
            texts.append(extracted_text)
        except Exception as primary_ocr_error:
            print(f"Primary OCR failed: {primary_ocr_error}")
            
            if use_fallback:
                print("Using DocumentImageProcessor fallback...")
                try:
                    leads = document_processor.process_image_with_ocr(tmp_path)
                    lead_texts = []
                    for lead in leads:
                        if lead.name or lead.email or lead.phone:
                            lead_info = [
                                f"Name: {lead.name or 'N/A'}",
                                f"Company: {lead.company or 'N/A'}",
                                f"Title: {lead.title or 'N/A'}",
                                f"Email: {lead.email or 'N/A'}",
                                f"Phone: {lead.phone or 'N/A'}",
                                f"Website: {lead.website or 'N/A'}",
                                f"Additional Info: {lead.additional_info or 'N/A'}"
                            ]
                            lead_texts.append("\n".join(lead_info))
                    
                    extracted_text = "\n\n".join(lead_texts)
                    texts.append(extracted_text)
                    print(f"Fallback OCR extracted {len(leads)} leads")
                except Exception as fallback_error:
                    print(f"Fallback OCR also failed: {fallback_error}")
                    raise HTTPException(status_code=500, detail="Both primary and fallback OCR failed")
            else:
                raise

    finally:
        os.remove(tmp_path)

    full_text = "\n".join(texts)
    return {
        "raw_text": full_text,
        "extracted": {
            "dob": extract_dob_from_text(full_text),
            "id_number": extract_id_number_from_text(full_text),
            "program": extract_program_from_text(full_text),
            "custom_id": extract_custom_id_from_text(full_text)
        }
    }

@app.post("/extract-leads")
async def extract_leads_from_document(
    document: UploadFile = File(..., description="Business card or document image"),
    use_api: bool = Form(False, description="Use API if available (requires OpenRouter key)"),
    current_user: str = Depends(get_current_user)
):
    """Extract lead information from business cards or documents"""
    tmp_path = tempfile.mktemp(suffix=os.path.splitext(document.filename)[1])
    with open(tmp_path, "wb") as f:
        f.write(await document.read())

    try:
        leads = []
        processing_method = "OCR"
        
        if use_api and document_processor.api_key:
            try:
                leads = document_processor.process_image_with_api(tmp_path)
                processing_method = "API"
                print(f"✅ Successfully processed with OpenRouter API, found {len(leads)} leads")
            except Exception as api_error:
                print(f"API processing failed: {api_error}, falling back to OCR")
                leads = document_processor.process_image_with_ocr(tmp_path)
        else:
            leads = document_processor.process_image_with_ocr(tmp_path)

        leads_data = []
        for lead in leads:
            lead_data = {
                'name': lead.name,
                'company': lead.company,
                'title': lead.title,
                'email': lead.email,
                'phone': lead.phone,
                'address': lead.address,
                'industry': lead.industry,
                'website': lead.website,
                'social_media': lead.social_media or {},
                'additional_info': lead.additional_info
            }
            lead_data = {k: v for k, v in lead_data.items() if v is not None}
            leads_data.append(lead_data)

        return {
            "success": True,
            "leads_found": len(leads),
            "leads": leads_data,
            "processing_method": processing_method,
            "message": f"Successfully extracted {len(leads)} lead(s) from document using {processing_method}"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

@app.post("/extract-kyc-data")
async def extract_kyc_data_from_document(
    document: UploadFile = File(..., description="KYC document image"),
    use_api: bool = Form(True, description="Use OpenRouter API for better extraction"),
    current_user: str = Depends(get_current_user)
):
    """Extract KYC-specific information from documents"""
    tmp_path = tempfile.mktemp(suffix=os.path.splitext(document.filename)[1])
    with open(tmp_path, "wb") as f:
        f.write(await document.read())

    try:
        kyc_data = {}
        
        if use_api and document_processor.api_key:
            try:
                kyc_data = document_processor.process_image_for_kyc(tmp_path)
                processing_method = "OpenRouter API"
                print(f"✅ Successfully processed KYC data with OpenRouter API")
            except Exception as api_error:
                print(f"API KYC processing failed: {api_error}, falling back to OCR")
                extracted_text = document_processor.extract_text_with_tesseract(tmp_path)
                kyc_data = document_processor.extract_kyc_specific_data(extracted_text)
                processing_method = "OCR Fallback"
        else:
            extracted_text = document_processor.extract_text_with_tesseract(tmp_path)
            kyc_data = document_processor.extract_kyc_specific_data(extracted_text)
            processing_method = "OCR"

        return {
            "success": True,
            "kyc_data": kyc_data,
            "processing_method": processing_method,
            "message": f"Successfully extracted KYC data using {processing_method}"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing KYC document: {str(e)}")
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


# =============================================================================
# HEALTH CHECKS AND STARTUP
# =============================================================================

@app.on_event("startup")
async def startup_event():
    print("🚀 Starting KYC Verification API with MongoDB...")
    # Remove the SQLite demo user creation
    # create_demo_users() is now handled in auth.py for MongoDB
    print("✅ MongoDB Atlas connected")

@app.get("/")
async def root():
    return {
        "status": "ok", 
        "message": "KYC Verification API is running",
        "version": "1.0.0",
        "services": ["auth", "kyc", "verify", "liveness-frames", "ocr", "extract-leads", "extract-kyc-data"],
        "openrouter_available": document_processor.api_key is not None
    }

@app.get("/debug-env")
async def debug_env():
    """Debug endpoint to check environment variables"""
    env_vars = {
        "OPENROUTER_API_KEY_exists": "OPENROUTER_API_KEY" in os.environ,
        "OPENROUTER_API_KEY_length": len(os.getenv("OPENROUTER_API_KEY", "")),
        "OPENROUTER_API_KEY_preview": os.getenv("OPENROUTER_API_KEY", "")[:10] + "..." if os.getenv("OPENROUTER_API_KEY") else "None",
        "current_working_directory": os.getcwd(),
        "files_in_directory": os.listdir("."),
    }
    return env_vars

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("kyc_app:app", host="0.0.0.0", port=8000, reload=True)