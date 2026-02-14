from fastapi import FastAPI, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from anthropic import Anthropic
import os
from dotenv import load_dotenv
from typing import Optional, List, Dict
import logging
import re
import time
from collections import Counter

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
# RESPONSE TIME TRACKING MIDDLEWARE
# ============================================

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Track response time for all requests"""
    start_time = time.time()
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000  # Convert to milliseconds
    response.headers["X-Process-Time"] = f"{process_time:.2f}ms"
    return response

# ============================================
# EMERGENCY KEYWORDS & DOSHA DATA
# ============================================

EMERGENCY_KEYWORDS = [
    'chest pain', 'severe bleeding', 'fainting', 'fainted',
    'difficulty breathing', 'can\'t breathe', 'cannot breathe',
    'unconscious', 'seizure', 'convulsion',
    'severe headache', 'worst headache', 'stroke',
    'heart attack', 'cardiac', 'suicide', 'suicidal',
    'severe burn', 'poisoning', 'poison', 'overdose',
    'broken bone', 'fracture', 'severe injury',
    'high persistent fever', 'fever above 104', 'very high fever',
    'severe abdominal pain', 'severe stomach pain',
    'coughing blood', 'vomiting blood', 'blood in stool'
]

DOSHA_CHARACTERISTICS = {
    'vata': {
        'keywords': ['dry', 'cold', 'irregular', 'variable', 'anxiety', 'constipation', 'insomnia'],
        'remedies_boost': ['warming', 'grounding', 'nourishing']
    },
    'pitta': {
        'keywords': ['hot', 'burning', 'inflammation', 'acidity', 'anger', 'rash'],
        'remedies_boost': ['cooling', 'calming', 'soothing']
    },
    'kapha': {
        'keywords': ['heavy', 'sluggish', 'congestion', 'mucus', 'weight gain', 'lethargy'],
        'remedies_boost': ['stimulating', 'light', 'warming']
    }
}

# ============================================
# LAYER 0: INPUT NORMALIZATION
# ============================================

def normalize_input(symptom: str) -> Dict:
    """
    Normalize user input for better matching
    Returns: {original, normalized, keywords}
    """
    original = symptom.strip()
    
    # Convert to lowercase
    normalized = original.lower()
    
    # Remove punctuation but keep spaces
    normalized = re.sub(r'[^\w\s]', ' ', normalized)
    
    # Remove extra spaces
    normalized = ' '.join(normalized.split())
    
    # Extract keywords (words longer than 2 characters)
    keywords = [word for word in normalized.split() if len(word) > 2]
    
    # Remove common stop words
    stop_words = {'the', 'and', 'have', 'with', 'for', 'from', 'that', 'this', 'are', 'was', 'been'}
    keywords = [word for word in keywords if word not in stop_words]
    
    logger.info(f"📝 Normalized: '{original}' → '{normalized}' → {keywords}")
    
    return {
        'original': original,
        'normalized': normalized,
        'keywords': keywords
    }

# ============================================
# LAYER 1: EMERGENCY DETECTION
# ============================================

def check_emergency(symptom: str) -> Optional[Dict]:
    """
    Check if symptom indicates medical emergency
    Returns emergency response or None
    """
    symptom_lower = symptom.lower()
    
    for keyword in EMERGENCY_KEYWORDS:
        if keyword in symptom_lower:
            logger.warning(f"🚨 EMERGENCY DETECTED: '{keyword}' in symptom")
            return {
                'type': 'emergency',
                'severity': 'critical',
                'message': 'Seek Immediate Medical Attention',
                'action': 'Visit the nearest hospital or call emergency services immediately. This symptom requires urgent professional medical care.',
                'detected_keyword': keyword,
                'disclaimer': 'This is an automated alert. Always prioritize professional medical evaluation for serious symptoms.'
            }
    
    return None

# ============================================
# LAYER 2: RANKED SYMPTOM MATCHING
# ============================================

def calculate_match_score(symptom_keywords: List[str], remedy_symptoms: List[str]) -> Dict:
    """
    Calculate relevance score between user symptoms and remedy
    Returns: {score, matched_symptoms, total_possible}
    """
    matched = []
    
    for keyword in symptom_keywords:
        for remedy_symptom in remedy_symptoms:
            if keyword in remedy_symptom.lower() or remedy_symptom.lower() in keyword:
                matched.append(remedy_symptom)
                break
    
    # Calculate score (0-100)
    if len(remedy_symptoms) > 0:
        score = (len(matched) / len(remedy_symptoms)) * 100
    else:
        score = 0
    
    return {
        'score': round(score, 2),
        'matched_symptoms': list(set(matched)),
        'match_count': len(matched),
        'total_possible': len(remedy_symptoms)
    }

def rank_remedies(keywords: List[str], remedies: List[dict]) -> List[dict]:
    """
    Rank all remedies by relevance to symptoms
    Returns top matches with scores
    """
    ranked = []
    
    for remedy in remedies:
        symptoms_list = remedy.get('symptoms', [])
        match_result = calculate_match_score(keywords, symptoms_list)
        
        if match_result['score'] > 0:
            remedy_with_score = remedy.copy()
            remedy_with_score['match_score'] = match_result['score']
            remedy_with_score['matched_symptoms'] = match_result['matched_symptoms']
            remedy_with_score['match_count'] = match_result['match_count']
            ranked.append(remedy_with_score)
    
    # Sort by score (highest first)
    ranked.sort(key=lambda x: x['match_score'], reverse=True)
    
    logger.info(f"🎯 Ranked {len(ranked)} remedies, top score: {ranked[0]['match_score'] if ranked else 0}")
    
    return ranked[:3]  # Return top 3

# ============================================
# LAYER 3: DOSHA-AWARE ADJUSTMENT
# ============================================

def get_user_dosha(user_id: str) -> Optional[Dict]:
    """
    Retrieve user's dosha profile from Supabase
    Returns: {primary, secondary, assessment_date}
    """
    try:
        response = supabase.table('profiles')\
            .select('dosha_primary, dosha_secondary, dosha_assessment_date')\
            .eq('id', user_id)\
            .single()\
            .execute()
        
        if response.data and response.data.get('dosha_primary'):
            return {
                'primary': response.data['dosha_primary'],
                'secondary': response.data.get('dosha_secondary'),
                'assessment_date': response.data.get('dosha_assessment_date')
            }
    except Exception as e:
        logger.warning(f"Could not retrieve dosha for user {user_id}: {e}")
    
    return None

def adjust_by_dosha(user_id: Optional[str], remedies: List[dict], keywords: List[str]) -> List[dict]:
    """
    Adjust remedy ranking based on user's dosha
    Boost remedies that balance the user's dominant dosha
    """
    if not user_id:
        logger.info("⚖️  No user_id provided, skipping dosha adjustment")
        return remedies
    
    dosha_profile = get_user_dosha(user_id)
    
    if not dosha_profile:
        logger.info("⚖️  No dosha profile found, skipping adjustment")
        return remedies
    
    primary_dosha = dosha_profile['primary'].lower()
    logger.info(f"⚖️  Adjusting for {primary_dosha} dosha")
    
    # Boost remedies that balance the primary dosha
    for remedy in remedies:
        dosha_field = remedy.get('dosha', '').lower()
        
        # Check if remedy balances the user's dosha
        if primary_dosha in dosha_field or f'balances {primary_dosha}' in dosha_field:
            remedy['match_score'] = remedy.get('match_score', 0) * 1.2  # 20% boost
            remedy['dosha_adjusted'] = True
            logger.info(f"  ✨ Boosted '{remedy['name']}' for {primary_dosha} balance")
    
    # Re-sort after adjustment
    remedies.sort(key=lambda x: x.get('match_score', 0), reverse=True)
    
    return remedies

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
    match_score: Optional[float] = None
    matched_symptoms: Optional[List[str]] = None
    dosha_adjusted: Optional[bool] = False

class EmergencyResponse(BaseModel):
    type: str = "emergency"
    severity: str
    message: str
    action: str
    detected_keyword: str
    disclaimer: str

class DoshaQuizAnswer(BaseModel):
    question_id: int
    answer: str  # 'vata', 'pitta', or 'kapha'

class DoshaQuizRequest(BaseModel):
    answers: List[DoshaQuizAnswer]

class DoshaAssessmentResponse(BaseModel):
    primary: str
    secondary: Optional[str]
    primary_percentage: float
    secondary_percentage: Optional[float]
    description: str
    recommendations: List[str]
    characteristics: List[str]

class HistoryItem(BaseModel):
    id: str
    symptom: str
    remedy_name: str
    source: str
    language: str
    created_at: str
    match_score: Optional[float] = None
    dosha_used: Optional[str] = None

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
# ENHANCED SEARCH ENGINE WITH RANKING
# ============================================

def search_remedies_ranked(keywords: List[str], language: str = "en") -> List[dict]:
    """
    Search and rank remedies by relevance
    Returns: List of ranked remedies with scores
    """
    try:
        # Get all remedies from database
        response = supabase.table('remedies').select('*').execute()
        
        if not response.data:
            logger.warning("No remedies found in database")
            return []
        
        # Rank remedies by keyword match
        ranked_remedies = rank_remedies(keywords, response.data)
        
        if not ranked_remedies:
            logger.info("❌ No matches found in ranking")
            return []
        
        # Format remedies for response
        formatted_remedies = []
        for remedy in ranked_remedies:
            if language == "hi":
                formatted = {
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
                    'source': 'dataset',
                    'match_score': remedy['match_score'],
                    'matched_symptoms': remedy['matched_symptoms']
                }
            else:
                formatted = {
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
                    'source': 'dataset',
                    'match_score': remedy['match_score'],
                    'matched_symptoms': remedy['matched_symptoms']
                }
            formatted_remedies.append(formatted)
        
        logger.info(f"✅ Found {len(formatted_remedies)} ranked matches")
        return formatted_remedies
        
    except Exception as e:
        logger.error(f"Database search error: {e}")
        return []

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
# ENHANCED HISTORY LOGGING
# ============================================

def save_query_history(
    user_id: str, 
    symptom: str, 
    language: str,
    remedy_id: Optional[str], 
    remedy_name: str, 
    source: str,
    matched_keywords: Optional[List[str]] = None,
    dosha_used: Optional[str] = None,
    ranking_score: Optional[float] = None,
    ai_refinement_used: bool = False,
    response_time_ms: Optional[float] = None
):
    """Save comprehensive query data to history"""
    try:
        supabase.table('query_history').insert({
            'user_id': user_id,
            'symptom': symptom,
            'language': language,
            'remedy_id': remedy_id,
            'remedy_name': remedy_name,
            'source': source,
            'matched_keywords': matched_keywords,
            'dosha_used': dosha_used,
            'ranking_score': ranking_score,
            'ai_refinement_used': ai_refinement_used,
            'response_time_ms': response_time_ms
        }).execute()
        logger.info(f"✅ Enhanced query saved to history for user {user_id}")
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
        "version": "2.0.0",
        "status": "healthy",
        "features": {
            "database": "connected",
            "ai_fallback": "enabled" if anthropic_client else "disabled",
            "languages": ["en", "hi"],
            "intelligence_layers": 6,
            "dosha_assessment": "enabled",
            "emergency_detection": "enabled",
            "ranked_matching": "enabled"
        }
    }

# ============================================
# DOSHA ASSESSMENT ENDPOINT
# ============================================

@app.post("/api/dosha/assess", response_model=DoshaAssessmentResponse)
async def assess_dosha(
    quiz_data: DoshaQuizRequest,
    user_id: str = Header(..., alias="X-User-ID")
):
    """
    Calculate user's dosha from quiz answers
    Store in profile and return results
    """
    try:
        # Count dosha scores
        dosha_counts = Counter()
        for answer in quiz_data.answers:
            dosha_counts[answer.answer.lower()] += 1
        
        total_answers = len(quiz_data.answers)
        
        # Calculate percentages
        dosha_percentages = {
            dosha: (count / total_answers) * 100
            for dosha, count in dosha_counts.items()
        }
        
        # Get primary and secondary doshas
        sorted_doshas = sorted(dosha_percentages.items(), key=lambda x: x[1], reverse=True)
        primary_dosha = sorted_doshas[0][0].capitalize()
        primary_percentage = sorted_doshas[0][1]
        
        secondary_dosha = sorted_doshas[1][0].capitalize() if len(sorted_doshas) > 1 else None
        secondary_percentage = sorted_doshas[1][1] if len(sorted_doshas) > 1 else None
        
        # Dosha descriptions
        descriptions = {
            'Vata': 'Vata dosha represents air and space elements. You tend to be creative, energetic, and quick-thinking, but may experience anxiety, dry skin, and irregular digestion when imbalanced.',
            'Pitta': 'Pitta dosha represents fire and water elements. You tend to be intelligent, focused, and warm, but may experience inflammation, acidity, and irritability when imbalanced.',
            'Kapha': 'Kapha dosha represents earth and water elements. You tend to be calm, stable, and nurturing, but may experience sluggishness, weight gain, and congestion when imbalanced.'
        }
        
        # Recommendations by dosha
        recommendations_map = {
            'Vata': [
                'Favor warm, cooked, and nourishing foods',
                'Maintain regular daily routines',
                'Practice grounding yoga poses and meditation',
                'Use warming spices like ginger and cinnamon',
                'Get adequate rest and avoid overstimulation'
            ],
            'Pitta': [
                'Favor cool, refreshing foods and avoid spicy foods',
                'Practice cooling pranayama and meditation',
                'Avoid excessive heat and sun exposure',
                'Use cooling herbs like coriander and fennel',
                'Maintain work-life balance and avoid overworking'
            ],
            'Kapha': [
                'Favor light, warm, and stimulating foods',
                'Engage in regular vigorous exercise',
                'Use warming spices like black pepper and turmeric',
                'Avoid heavy, oily, and cold foods',
                'Maintain an active lifestyle and avoid oversleeping'
            ]
        }
        
        characteristics_map = {
            'Vata': [
                'Light, thin body frame',
                'Variable energy and appetite',
                'Quick mind, creative',
                'Tendency toward dry skin',
                'Light, interrupted sleep'
            ],
            'Pitta': [
                'Medium build, good muscle tone',
                'Strong appetite and digestion',
                'Sharp intellect, focused',
                'Warm body temperature',
                'Moderate, sound sleep'
            ],
            'Kapha': [
                'Solid, heavier build',
                'Steady energy and appetite',
                'Calm, patient nature',
                'Smooth, moist skin',
                'Deep, long sleep'
            ]
        }
        
        # Save to user profile
        try:
            supabase.table('profiles').update({
                'dosha_primary': primary_dosha,
                'dosha_secondary': secondary_dosha,
                'dosha_assessment_date': 'now()',
                'dosha_quiz_answers': [answer.dict() for answer in quiz_data.answers]
            }).eq('id', user_id).execute()
            
            logger.info(f"✅ Dosha assessment saved: {primary_dosha} for user {user_id}")
        except Exception as e:
            logger.error(f"Failed to save dosha to profile: {e}")
        
        return DoshaAssessmentResponse(
            primary=primary_dosha,
            secondary=secondary_dosha,
            primary_percentage=round(primary_percentage, 1),
            secondary_percentage=round(secondary_percentage, 1) if secondary_percentage else None,
            description=descriptions[primary_dosha],
            recommendations=recommendations_map[primary_dosha],
            characteristics=characteristics_map[primary_dosha]
        )
        
    except Exception as e:
        logger.error(f"Dosha assessment error: {e}")
        raise HTTPException(status_code=500, detail="Failed to assess dosha")

@app.get("/api/dosha/profile")
async def get_dosha_profile(user_id: str = Header(..., alias="X-User-ID")):
    """Get user's current dosha profile"""
    dosha_profile = get_user_dosha(user_id)
    
    if not dosha_profile:
        raise HTTPException(status_code=404, detail="No dosha assessment found. Please take the quiz first.")
    
    return dosha_profile

@app.post("/api/ask")
async def ask_remedy(query: QueryRequest, user_id: str = Header(None, alias="X-User-ID")):
    """
    Main query endpoint with 6-layer intelligence pipeline
    1. Input Normalization
    2. Emergency Detection
    3. Ranked Symptom Matching
    4. Dosha-Aware Adjustment
    5. AI Refinement (if needed)
    6. Enhanced Logging
    """
    start_time = time.time()
    
    # Validate input
    if not query.symptom or len(query.symptom.strip()) < 2:
        raise HTTPException(status_code=400, detail="Please provide a valid symptom description (min 2 characters)")
    
    logger.info(f"🔍 Query received: '{query.symptom}' (language: {query.language})")
    
    # LAYER 0: Input Normalization
    normalized = normalize_input(query.symptom)
    keywords = normalized['keywords']
    
    # LAYER 1: Emergency Detection
    emergency = check_emergency(normalized['normalized'])
    if emergency:
        logger.warning(f"🚨 Emergency detected, returning immediate response")
        return EmergencyResponse(**emergency)
    
    # LAYER 2: Ranked Symptom Matching
    ranked_remedies = search_remedies_ranked(keywords, query.language)
    
    if not ranked_remedies:
        logger.info("No database matches, using AI fallback")
        ai_result = ai_fallback(query.symptom, query.language)
        
        # Calculate response time
        response_time_ms = (time.time() - start_time) * 1000
        
        # Save to history if user is authenticated
        if user_id and ai_result['source'] != 'error':
            save_query_history(
                user_id=user_id,
                symptom=query.symptom,
                language=query.language,
                remedy_id=None,
                remedy_name=ai_result['name'],
                source=ai_result['source'],
                matched_keywords=keywords,
                dosha_used=None,
                ranking_score=None,
                ai_refinement_used=True,
                response_time_ms=response_time_ms
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
            category=ai_result.get('category'),
            match_score=None,
            matched_symptoms=None
        )
    
    # LAYER 3: Dosha-Aware Adjustment
    dosha_profile = None
    if user_id:
        ranked_remedies = adjust_by_dosha(user_id, ranked_remedies, keywords)
        dosha_profile = get_user_dosha(user_id)
    
    # Get top remedy
    top_remedy = ranked_remedies[0]
    
    # Calculate response time
    response_time_ms = (time.time() - start_time) * 1000
    
    # LAYER 6: Enhanced Logging
    if user_id:
        save_query_history(
            user_id=user_id,
            symptom=query.symptom,
            language=query.language,
            remedy_id=top_remedy['id'],
            remedy_name=top_remedy['name'],
            source='dataset',
            matched_keywords=keywords,
            dosha_used=dosha_profile['primary'] if dosha_profile else None,
            ranking_score=top_remedy['match_score'],
            ai_refinement_used=False,
            response_time_ms=response_time_ms
        )
    
    logger.info(f"✅ Returning remedy: {top_remedy['name']} (score: {top_remedy['match_score']})")
    
    return RemedyResponse(
        success=True,
        remedy_id=top_remedy['id'],
        remedy_name=top_remedy['name'],
        herb=top_remedy['herb'],
        herb_scientific=top_remedy.get('herb_scientific'),
        dosage=top_remedy['dosage'],
        yoga=top_remedy['yoga'],
        diet=top_remedy['diet'],
        dosha=top_remedy['dosha'],
        warning=top_remedy['warning'],
        explanation=top_remedy['explanation'],
        source='dataset',
        category=top_remedy.get('category'),
        match_score=top_remedy['match_score'],
        matched_symptoms=top_remedy['matched_symptoms'],
        dosha_adjusted=top_remedy.get('dosha_adjusted', False)
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
# SAVED REMEDIES ENDPOINTS
# ============================================

class SaveRemedyRequest(BaseModel):
    remedy_id: str
    remedy_name: str
    notes: Optional[str] = None

@app.post("/api/remedies/save")
async def save_remedy(
    request: SaveRemedyRequest,
    user_id: str = Header(..., alias="X-User-ID")
):
    """Save a remedy to user's collection"""
    try:
        # Check if already saved
        existing = supabase.table('saved_remedies')\
            .select('id')\
            .eq('user_id', user_id)\
            .eq('remedy_id', request.remedy_id)\
            .execute()
        
        if existing.data:
            return {
                "success": False,
                "message": "Remedy already saved",
                "already_saved": True
            }
        
        # Save remedy
        result = supabase.table('saved_remedies').insert({
            'user_id': user_id,
            'remedy_id': request.remedy_id,
            'remedy_name': request.remedy_name,
            'notes': request.notes
        }).execute()
        
        logger.info(f"✅ Remedy saved: {request.remedy_name} for user {user_id}")
        
        return {
            "success": True,
            "message": "Remedy saved successfully",
            "saved_id": result.data[0]['id'] if result.data else None
        }
        
    except Exception as e:
        logger.error(f"Save remedy error: {e}")
        raise HTTPException(status_code=500, detail="Failed to save remedy")

@app.get("/api/remedies/saved")
async def get_saved_remedies(user_id: str = Header(..., alias="X-User-ID")):
    """Get user's saved remedies"""
    try:
        # Get saved remedies with full remedy details
        saved = supabase.table('saved_remedies')\
            .select('*, remedies(*)')\
            .eq('user_id', user_id)\
            .order('saved_at', desc=True)\
            .execute()
        
        return {
            "success": True,
            "count": len(saved.data),
            "remedies": saved.data
        }
        
    except Exception as e:
        logger.error(f"Get saved remedies error: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve saved remedies")

@app.delete("/api/remedies/saved/{remedy_id}")
async def unsave_remedy(
    remedy_id: str,
    user_id: str = Header(..., alias="X-User-ID")
):
    """Remove remedy from saved collection"""
    try:
        result = supabase.table('saved_remedies')\
            .delete()\
            .eq('user_id', user_id)\
            .eq('remedy_id', remedy_id)\
            .execute()
        
        logger.info(f"✅ Remedy unsaved: {remedy_id} for user {user_id}")
        
        return {
            "success": True,
            "message": "Remedy removed from saved collection"
        }
        
    except Exception as e:
        logger.error(f"Unsave remedy error: {e}")
        raise HTTPException(status_code=500, detail="Failed to remove remedy")

@app.get("/api/remedies/is-saved/{remedy_id}")
async def check_if_saved(
    remedy_id: str,
    user_id: str = Header(..., alias="X-User-ID")
):
    """Check if a remedy is saved by user"""
    try:
        result = supabase.table('saved_remedies')\
            .select('id')\
            .eq('user_id', user_id)\
            .eq('remedy_id', remedy_id)\
            .execute()
        
        return {
            "is_saved": len(result.data) > 0
        }
        
    except Exception as e:
        logger.error(f"Check saved error: {e}")
        return {"is_saved": False}

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