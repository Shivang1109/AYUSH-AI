# 🧪 TESTING CHECKLIST - AYUSH AI

## ✅ Backend Status
- [x] Backend deployed on Render
- [x] Version 2.0.0 live
- [x] Database connected
- [x] All endpoints working
- [x] Database schema updated

## 🌐 Frontend Testing (http://localhost:8080)

### 1. Authentication
- [ ] Open http://localhost:8080
- [ ] Click "Sign Up" and create test account
- [ ] Verify redirect to main app
- [ ] Check if logged in (see user email in header)

### 2. Dosha Quiz
- [ ] Click purple "Dosha Quiz" button in header
- [ ] Answer all 8 questions
- [ ] Click "Calculate My Dosha"
- [ ] Verify results show (Vata/Pitta/Kapha percentages)
- [ ] Check dosha description displays
- [ ] Close modal

### 3. Symptom Search & Match Scores
- [ ] Enter symptom: "headache and stress"
- [ ] Click "Get Remedy"
- [ ] Verify remedy cards show:
  - Match score (e.g., "Match: 85%")
  - Matched symptoms listed
  - "✨ Personalized for your dosha" badge (if applicable)
  - Remedy details (ingredients, usage, precautions)

### 4. Save Remedies Feature
- [ ] Find a remedy card
- [ ] Click the star (☆) button
- [ ] Verify toast notification: "Remedy saved!"
- [ ] Star should turn filled (★)
- [ ] Click star again to unsave
- [ ] Verify toast: "Remedy removed"
- [ ] Star should turn empty (☆)

### 5. Emergency Detection
- [ ] Enter: "chest pain and difficulty breathing"
- [ ] Verify red emergency alert appears
- [ ] Check message says to seek immediate medical care
- [ ] Verify no AI call was made (instant response)

### 6. Explainability
- [ ] Search any symptom
- [ ] Scroll to bottom of results
- [ ] Verify "How we selected these remedies" section shows
- [ ] Check it explains the matching logic

### 7. UI/UX Polish
- [ ] Check smooth animations on all interactions
- [ ] Verify warm Ayurvedic color palette
- [ ] Test on mobile view (resize browser)
- [ ] Check all buttons work
- [ ] Verify no console errors (F12 → Console)

## 🔍 Backend API Testing

### Test Dosha Assessment
```bash
curl -X POST https://ayush-ai.onrender.com/api/dosha/assess \
  -H "Content-Type: application/json" \
  -H "X-User-ID: test-user-123" \
  -d '{
    "answers": [
      {"question_id": 1, "answer": "A"},
      {"question_id": 2, "answer": "B"},
      {"question_id": 3, "answer": "C"},
      {"question_id": 4, "answer": "A"},
      {"question_id": 5, "answer": "B"},
      {"question_id": 6, "answer": "C"},
      {"question_id": 7, "answer": "A"},
      {"question_id": 8, "answer": "B"}
    ]
  }'
```

### Test Save Remedy
```bash
curl -X POST https://ayush-ai.onrender.com/api/remedies/save \
  -H "Content-Type: application/json" \
  -H "X-User-ID: test-user-123" \
  -d '{
    "remedy_id": "test-remedy-1",
    "remedy_name": "Tulsi Tea for Stress"
  }'
```

### Test Get Saved Remedies
```bash
curl -X GET https://ayush-ai.onrender.com/api/remedies/saved \
  -H "X-User-ID: test-user-123"
```

### Test Emergency Detection
```bash
curl -X POST https://ayush-ai.onrender.com/api/ask \
  -H "Content-Type: application/json" \
  -H "X-User-ID: test-user-123" \
  -d '{
    "symptom": "chest pain and difficulty breathing",
    "language": "en"
  }'
```

## 📊 Expected Results

### Dosha Quiz Response:
```json
{
  "dosha_primary": "Vata",
  "dosha_secondary": "Pitta",
  "percentages": {
    "vata": 45,
    "pitta": 35,
    "kapha": 20
  }
}
```

### Save Remedy Response:
```json
{
  "message": "Remedy saved successfully",
  "remedy_id": "test-remedy-1"
}
```

### Emergency Response:
```json
{
  "type": "emergency",
  "message": "Your symptoms may require immediate medical attention...",
  "matched_keywords": ["chest pain", "difficulty breathing"]
}
```

## 🚀 Deployment Checklist

### Frontend Deployment (Netlify/Vercel)
- [ ] All local tests pass
- [ ] No console errors
- [ ] Deploy frontend folder
- [ ] Update config.js with production API URL
- [ ] Test deployed version
- [ ] Verify HTTPS works
- [ ] Test on mobile device

### Final Verification
- [ ] Backend: https://ayush-ai.onrender.com (v2.0.0)
- [ ] Frontend: [Your Netlify/Vercel URL]
- [ ] Database: Supabase (all tables updated)
- [ ] All features working end-to-end

## 🎬 Demo Preparation
- [ ] Read DEMO_CHEAT_SHEET.md
- [ ] Practice 3-minute demo flow
- [ ] Prepare answers for Q&A
- [ ] Test on demo device
- [ ] Have backup plan ready

## ✅ READY TO DEMO!

Once all checkboxes are checked, you're ready to present! 🏆
