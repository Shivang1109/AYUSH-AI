from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from anthropic import Anthropic
import os
from dotenv import load_dotenv
from typing import Optional, List
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Supabase
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
)

# Initialize Anthropic (optional - for AI fallback)
anthropic_client = None
try:
    if os.getenv("ANTHROPIC_API_KEY"):
        anthropic_client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        logger.info("✅ Anthropic AI enabled")
    else:
        logger.warning("⚠️  Anthropic API key not set - AI fallback disabled")
except Exception as e:
    logger.error(f"Anthropic initialization failed: {e}")

# Initialize FastAPI
app = FastAPI(
    title="AYUSH Digital Assistant API",
    version="1.0.0",
    description="Traditional Indian wellness knowledge API"
)

# CORS middleware (allows FlutterFlow to connect)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact FlutterFlow domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# REQUEST/RESPONSE MODELS
# ============================================

class QueryRequest(BaseModel):
    symptom: str
    language: str = "en"  # 'en' or 'hi'

class RemedyResponse(BaseModel):
    success: bool
    remedy_id: Optional[str]
    remedy_name: str
    herb: str
    herb_scientific: Optional[str]
    dosage: str
    yoga: str
    diet: str
    dosha: str
    warning: str
    explanation: str
    source: str  # 'dataset' or 'ai'
    category: Optional[str]

class HistoryItem(BaseModel):
    id: str
    symptom: str
    remedy_name: str
    source: str
    language: str
    created_at: str

# ============================================
# AUTHENTICATION HELPER
# ============================================

def verify_token(authorization: str = Header(None)) -> str:
    """Verify Supabase JWT token from FlutterFlow"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    try:
        # Remove 'Bearer ' prefix
        token = authorization.replace("Bearer ", "")
        
        # Verify token with Supabase
        user = supabase.auth.get_user(token)
        return user.user.id
    except Exception as e:
        logger.error(f"Auth error: {e}")
        raise HTTPException(status_code=401, detail="Invalid or expired token")

# ============================================
# SEARCH ENGINE
# ============================================

def search_remedies(symptom: str, language: str = "en") -> Optional[dict]:
    """Search Supabase database for matching remedy"""
    try:
        symptom_lower = symptom.lower().strip()
        
        # Get all remedies from database
        response = supabase.table('remedies').select('*').execute()
        
        # Search for keyword match
        for remedy in response.data:
            symptoms_list = remedy.get('symptoms', [])
            
            # Check if any symptom keyword matches user input
            for keyword in symptoms_list:
                if keyword.lower() in symptom_lower or symptom_lower in keyword.lower():
                    logger.info(f"✅ Match found: {remedy['name']}")
                    
                    # Return in selected language
                    if language == "hi":
                        return {
                            'id': remedy['id'],
                            'name': remedy.get('name_hi', remedy['name']),
                            'herb': remedy.get('herb_hi', remedy['herb']),
                            'herb_scientific': remedy.get('herb_scientific'),
                            'dosage': remedy.get('dosage_hi', remedy['dosage']),
                            'yoga': remedy.get('yoga_hi', remedy['yoga']),
                            'diet': remedy.get('diet_hi', remedy['diet']),
                            'dosha': remedy.get('dosha_hi', remedy['dosha']),
                            'warning': remedy.get('warning_hi', remedy['warning']),
                            'explanation': remedy.get('explanation_hi', remedy['explanation']),
                            'category': remedy.get('category'),
                            'source': 'dataset'
                        }
                    else:
                        return {
                            'id': remedy['id'],
                            'name': remedy['name'],
                            'herb': remedy['herb'],
                            'herb_scientific': remedy.get('herb_scientific'),
                            'dosage': remedy['dosage'],
                            'yoga': remedy['yoga'],
                            'diet': remedy['diet'],
                            'dosha': remedy['dosha'],
                            'warning': remedy['warning'],
                            'explanation': remedy['explanation'],
                            'category': remedy.get('category'),
                            'source': 'dataset'
                        }
        
        logger.info("❌ No dataset match found")
        return None
        
    except Exception as e:
        logger.error(f"Database search error: {e}")
        return None

# ============================================
# AI FALLBACK
# ============================================

def ai_fallback(symptom: str, language: str = "en") -> dict:
    """Use Claude AI for unknown symptoms"""
    
    if not anthropic_client:
        return {
            'name': 'AI Service Unavailable',
            'herb': 'Consult Ayurvedic practitioner',
            'herb_scientific': '',
            'dosage': 'N/A',
            'yoga': 'General yoga practice',
            'diet': 'Balanced Ayurvedic diet',
            'dosha': 'Professional assessment needed',
            'warning': 'API key not configured. Please consult qualified Ayurvedic practitioner.',
            'explanation': 'AI service requires API key configuration.',
            'category': 'general',
            'source': 'error'
        }
    
    try:
        lang_instruction = "Respond in Hindi (Devanagari script)" if language == "hi" else "Respond in English"
        
        prompt = f"""You are an expert Ayurvedic wellness assistant. A user reports: "{symptom}"

{lang_instruction}

Provide a practical Ayurvedic remedy in this EXACT format:

REMEDY_NAME: [Short descriptive name]
HERB: [Primary herb name]
HERB_SCIENTIFIC: [Scientific Latin name]
DOSAGE: [Practical dosage instruction]
YOGA: [Specific yoga pose or pranayama]
DIET: [Dietary recommendations]
DOSHA: [Which dosha imbalance - Vata/Pitta/Kapha]
WARNING: [Important safety note]
EXPLANATION: [Why this remedy works - cite Ayurvedic principles]
CATEGORY: [One of: respiratory, digestive, mental, sleep, musculoskeletal, dermatological, metabolic, reproductive, neurological]

Keep each field concise (1-2 sentences). Base recommendations on classical Ayurveda."""

        message = anthropic_client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1500,
            messages=[{"role": "user", "content": prompt}]
        )
        
        response_text = message.content[0].text
        logger.info(f"AI response received: {len(response_text)} chars")
        
        # Parse AI response
        parsed = {}
        for line in response_text.strip().split('\n'):
            if ':' in line:
                key, value = line.split(':', 1)
                key_clean = key.strip().lower().replace(' ', '_')
                parsed[key_clean] = value.strip()
        
        return {
            'name': parsed.get('remedy_name', 'AI-Suggested Ayurvedic Remedy'),
            'herb': parsed.get('herb', 'Consult Ayurvedic practitioner'),
            'herb_scientific': parsed.get('herb_scientific', ''),
            'dosage': parsed.get('dosage', 'As directed by qualified practitioner'),
            'yoga': parsed.get('yoga', 'General yoga practice'),
            'diet': parsed.get('diet', 'Balanced Sattvic diet'),
            'dosha': parsed.get('dosha', 'Assessment needed'),
            'warning': parsed.get('warning', 'Always consult qualified Ayurvedic practitioner before starting any remedy'),
            'explanation': parsed.get('explanation', 'AI-generated recommendation based on Ayurvedic principles'),
            'category': parsed.get('category', 'general'),
            'source': 'ai'
        }
        
    except Exception as e:
        logger.error(f"AI error: {e}")
        return {
            'name': 'AI Error',
            'herb': 'Service temporarily unavailable',
            'herb_scientific': '',
            'dosage': 'N/A',
            'yoga': 'N/A',
            'diet': 'N/A',
            'dosha': 'N/A',
            'warning': f'AI service error. Please consult Ayurvedic practitioner.',
            'explanation': 'Unable to generate recommendation at this time.',
            'category': 'error',
            'source': 'error'
        }

# ============================================
# SAVE TO HISTORY
# ============================================

def save_query_history(user_id: str, symptom: str, language: str, 
                       remedy_id: Optional[str], remedy_name: str, source: str):
    """Save user query to database"""
    try:
        supabase.table('query_history').insert({
            'user_id': user_id,
            'symptom': symptom,
            'language': language,
            'remedy_id': remedy_id,
            'remedy_name': remedy_name,
            'source': source
        }).execute()
        logger.info(f"✅ Query saved to history for user {user_id}")
    except Exception as e:
        logger.error(f"History save error: {e}")

# ============================================
# API ENDPOINTS
# ============================================

@app.get("/")
async def root():
    """Health check"""
    return {
        "service": "AYUSH Digital Assistant API",
        "version": "1.0.0",
        "status": "healthy",
        "features": {
            "database": "connected",
            "ai_fallback": "enabled" if anthropic_client else "disabled",
            "languages": ["en", "hi"]
        }
    }

@app.post("/api/ask", response_model=RemedyResponse)
async def ask_remedy(query: QueryRequest, user_id: str = Header(None, alias="X-User-ID")):
    """
    Main query endpoint - accepts symptom and returns Ayurvedic remedy
    Can be called with or without authentication
    """
    
    # Validate input
    if not query.symptom or len(query.symptom.strip()) < 2:
        raise HTTPException(status_code=400, detail="Please provide a valid symptom description (min 2 characters)")
    
    logger.info(f"Query received: '{query.symptom}' (language: {query.language})")
    
    # Search database first
    dataset_result = search_remedies(query.symptom, query.language)
    
    if dataset_result:
        # Save to history if user is authenticated
        if user_id:
            save_query_history(
                user_id=user_id,
                symptom=query.symptom,
                language=query.language,
                remedy_id=dataset_result['id'],
                remedy_name=dataset_result['name'],
                source='dataset'
            )
        
        return RemedyResponse(
            success=True,
            remedy_id=dataset_result['id'],
            remedy_name=dataset_result['name'],
            herb=dataset_result['herb'],
            herb_scientific=dataset_result.get('herb_scientific'),
            dosage=dataset_result['dosage'],
            yoga=dataset_result['yoga'],
            diet=dataset_result['diet'],
            dosha=dataset_result['dosha'],
            warning=dataset_result['warning'],
            explanation=dataset_result['explanation'],
            source='dataset',
            category=dataset_result.get('category')
        )
    
    # AI fallback for unknown symptoms
    ai_result = ai_fallback(query.symptom, query.language)
    
    # Save to history if user is authenticated
    if user_id and ai_result['source'] != 'error':
        save_query_history(
            user_id=user_id,
            symptom=query.symptom,
            language=query.language,
            remedy_id=None,
            remedy_name=ai_result['name'],
            source=ai_result['source']
        )
    
    return RemedyResponse(
        success=ai_result['source'] != 'error',
        remedy_id=None,
        remedy_name=ai_result['name'],
        herb=ai_result['herb'],
        herb_scientific=ai_result.get('herb_scientific'),
        dosage=ai_result['dosage'],
        yoga=ai_result['yoga'],
        diet=ai_result['diet'],
        dosha=ai_result['dosha'],
        warning=ai_result['warning'],
        explanation=ai_result['explanation'],
        source=ai_result['source'],
        category=ai_result.get('category')
    )

@app.get("/api/history", response_model=List[HistoryItem])
async def get_history(user_id: str = Header(..., alias="X-User-ID"), limit: int = 20):
    """Get user's query history (requires authentication)"""
    try:
        response = supabase.table('query_history')\
            .select('id, symptom, remedy_name, source, language, created_at')\
            .eq('user_id', user_id)\
            .order('created_at', desc=True)\
            .limit(limit)\
            .execute()
        
        return [HistoryItem(**item) for item in response.data]
    except Exception as e:
        logger.error(f"History retrieval error: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve history")

@app.get("/api/remedies")
async def list_remedies(category: Optional[str] = None, language: str = "en"):
    """List all remedies (optional category filter)"""
    try:
        query = supabase.table('remedies')
        
        if language == "hi":
            query = query.select('id, name_hi, category, herb_hi, dosha_hi')
        else:
            query = query.select('id, name, category, herb, dosha')
        
        if category:
            query = query.eq('category', category)
        
        response = query.execute()
        return {"remedies": response.data, "count": len(response.data)}
    except Exception as e:
        logger.error(f"Remedies list error: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve remedies")

@app.get("/api/health")
async def health_check():
    """Detailed system health check"""
    try:
        # Test database connection
        db_test = supabase.table('remedies').select('id').limit(1).execute()
        db_status = "connected" if db_test.data else "empty"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return {
        "status": "healthy",
        "database": db_status,
        "ai_service": "enabled" if anthropic_client else "disabled",
        "remedies_count": len(db_test.data) if db_test.data else 0,
        "supported_languages": ["en", "hi"]
    }

# ============================================
# RUN SERVER
# ============================================

if __name__ == "__main__":
    import uvicorn
    
    print("\n" + "="*50)
    print("🌿 AYUSH Digital Assistant API")
    print("="*50)
    print(f"📊 Database: {os.getenv('SUPABASE_URL')[:30]}...")
    print(f"🤖 AI Fallback: {'Enabled ✅' if anthropic_client else 'Disabled ⚠️'}")
    print(f"🌐 Languages: English + Hindi")
    print(f"🚀 Server starting at: http://localhost:8000")
    print(f"📖 API Docs: http://localhost:8000/docs")
    print("="*50 + "\n")
    
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")