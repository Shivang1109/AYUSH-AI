# AYUSH AI Assistant - API Documentation

Base URL (Production): `https://ayush-ai.onrender.com`

---

## Authentication

Uses Supabase Auth. Include JWT token in headers:
```
Authorization: Bearer <your-jwt-token>
```

---

## Endpoints

### 1. Health Check

**GET** `/health`

Check if API is running.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### 2. Analyze Symptoms

**POST** `/api/analyze`

Analyze symptoms and get AYUSH recommendations.

**Request Body:**
```json
{
  "symptoms": "I have headache and feeling tired",
  "language": "en",
  "user_id": "optional-user-uuid"
}
```

**Parameters:**
- `symptoms` (string, required): Description of symptoms
- `language` (string, optional): "en" or "hi", default "en"
- `user_id` (string, optional): User UUID for saving history

**Response:**
```json
{
  "condition": "Stress and Fatigue",
  "severity": "mild",
  "recommendations": [
    {
      "treatment_type": "Ayurveda",
      "remedy": "Ashwagandha powder",
      "dosage": "1 teaspoon with warm milk",
      "duration": "2 weeks",
      "precautions": [
        "Take before bedtime",
        "Avoid if pregnant"
      ]
    },
    {
      "treatment_type": "Yoga",
      "remedy": "Shavasana (Corpse Pose)",
      "dosage": "10-15 minutes daily",
      "duration": "Daily practice",
      "precautions": [
        "Practice in quiet environment",
        "Use comfortable mat"
      ]
    }
  ],
  "explanation": "Your symptoms suggest stress-related fatigue. Ashwagandha is an adaptogen that helps manage stress, while Shavasana promotes deep relaxation.",
  "safety_warnings": [
    "Consult a qualified AYUSH practitioner before starting treatment",
    "Seek immediate medical attention for severe symptoms",
    "If symptoms persist beyond 2 weeks, consult a doctor"
  ],
  "disclaimer": "This is not medical advice. Consult a healthcare professional.",
  "language": "en"
}
```

**Error Response:**
```json
{
  "detail": "Please provide valid symptoms"
}
```

---

### 3. Get Consultation History

**GET** `/api/history/{user_id}`

Get user's past consultations.

**Parameters:**
- `user_id` (path, required): User UUID
- `limit` (query, optional): Number of records, default 10

**Response:**
```json
{
  "history": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "symptoms": "headache and tired",
      "condition": "Stress and Fatigue",
      "recommendations": {...},
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### 4. Delete Consultation

**DELETE** `/api/history/{consultation_id}`

Delete a consultation record.

**Parameters:**
- `consultation_id` (path, required): Consultation UUID

**Response:**
```json
{
  "message": "Consultation deleted successfully"
}
```

---

## Example Usage

### cURL

```bash
# Analyze symptoms
curl -X POST https://ayush-ai.onrender.com/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "symptoms": "I have a cold and cough",
    "language": "en"
  }'
```

### Python

```python
import requests

response = requests.post(
    "https://ayush-ai.onrender.com/api/analyze",
    json={
        "symptoms": "I have a cold and cough",
        "language": "en"
    }
)

print(response.json())
```

### JavaScript

```javascript
fetch('https://ayush-ai.onrender.com/api/analyze', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    symptoms: 'I have a cold and cough',
    language: 'en'
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

---

## Error Codes

- `200` - Success
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (invalid/missing auth token)
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

Currently no rate limiting. For production, implement:
- 100 requests per minute per user
- 1000 requests per hour per IP

---

## AYUSH Treatment Types

The API provides recommendations from:

1. **Ayurveda**: Herbal remedies, dietary changes
2. **Yoga**: Asanas, pranayama, meditation
3. **Unani**: Herbal medicines, dietary therapy
4. **Siddha**: Herbal preparations, lifestyle modifications
5. **Homeopathy**: Homeopathic remedies

---

## Safety Features

1. **Explainability**: Every recommendation includes reasoning
2. **Safety Warnings**: Mandatory warnings about when to seek professional help
3. **Disclaimers**: Clear statements that this is not medical advice
4. **Severity Assessment**: Helps users understand urgency
5. **Fallback Handling**: Graceful error handling with safety-first responses

---

## Language Support

- **English** (`en`): Full support
- **Hindi** (`hi`): Full support with Devanagari script

Add more languages by extending the prompts in `ai_engine.py`.

---

## Interactive API Docs

Visit https://ayush-ai.onrender.com/docs for interactive Swagger UI documentation.

Visit https://ayush-ai.onrender.com/redoc for ReDoc documentation.
