# 🚀 QUICK START GUIDE - AYUSH AI

## ⚡ 5-MINUTE SETUP

### Step 1: Database Setup (2 minutes)
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click "SQL Editor" in left sidebar
4. Copy entire contents of `DATABASE_SETUP.sql`
5. Paste and click "Run"
6. Wait for "Success" message

### Step 2: Backend Deployment (1 minute)
Your backend is already on Render at `https://ayush-ai.onrender.com`

**To update:**
1. Push changes to GitHub
2. Render will auto-deploy
3. Or click "Manual Deploy" in Render dashboard

### Step 3: Test Locally (2 minutes)
```bash
# Open frontend
cd frontend
python -m http.server 8080

# Visit: http://localhost:8080
```

### Step 4: Test Features
1. ✅ Login with test account
2. ✅ Click "Dosha Quiz" button in header
3. ✅ Complete quiz and see results
4. ✅ Enter symptom: "I have headache"
5. ✅ See match score and matched symptoms
6. ✅ Test emergency: "I have chest pain"
7. ✅ Check consultation history

---

## 🧪 TESTING CHECKLIST

### Dosha Quiz:
- [ ] Button visible in header
- [ ] Quiz opens in modal
- [ ] Progress bar works
- [ ] All 8 questions display
- [ ] Results show correctly
- [ ] Dosha saves to profile

### Intelligence Pipeline:
- [ ] Emergency detection works
- [ ] Match scores appear
- [ ] Matched symptoms shown
- [ ] Response is fast (<2s)

### UI/UX:
- [ ] Animations smooth
- [ ] Mobile responsive
- [ ] No console errors
- [ ] All buttons work

---

## 🐛 TROUBLESHOOTING

### "Dosha quiz button not working"
- Check browser console for errors
- Verify `dosha-quiz.js` is loaded
- Check if `doshaQuiz` is defined: `console.log(window.doshaQuiz)`

### "Database error when saving dosha"
- Run `DATABASE_SETUP.sql` in Supabase
- Check if profiles table has dosha columns
- Verify user is authenticated

### "Match scores not showing"
- Backend needs to be updated
- Check if remedies table has `symptoms` column
- Verify API response includes `match_score`

### "Emergency detection not working"
- Check if symptom contains emergency keywords
- Look for "chest pain", "severe bleeding", etc.
- Check browser console and network tab

---

## 📱 DEMO SCRIPT (3 MINUTES)

### Minute 1: Introduction
> "AYUSH AI is not a chatbot - it's a production-grade digital wellness platform with a 6-layer intelligence pipeline."

### Minute 2: Core Features
1. **Show Dosha Quiz**
   > "First, users discover their Ayurvedic constitution through our authentic dosha assessment."
   
2. **Show Symptom Analysis**
   > "When they enter symptoms, our system ranks remedies by relevance score and adjusts for their dosha."
   
3. **Show Match Scores**
   > "Notice the match score and which symptoms were matched - complete transparency."

### Minute 3: Advanced Features
1. **Emergency Detection**
   > "Safety first - try 'chest pain' and see immediate emergency alert."
   
2. **Explainability**
   > "Every recommendation explains why it was chosen and how it helps."
   
3. **Performance**
   > "Response time is tracked and logged for every request."

**Closing:**
> "This demonstrates technical sophistication, cultural authenticity, safety consciousness, and scalability - everything judges look for."

---

## 🎯 KEY TALKING POINTS

### Technical:
- "6-layer intelligence pipeline"
- "Ranked matching algorithm with relevance scores"
- "Response time tracking and enhanced logging"
- "Modular, scalable architecture"

### Traditional:
- "Authentic Ayurvedic dosha assessment"
- "Dosha-aware remedy ranking"
- "Cultural integration, not superficial"

### Safety:
- "Backend emergency detection"
- "20+ critical keywords"
- "Immediate alerts, no AI delay"
- "Clear medical disclaimers"

### UX:
- "Beautiful, smooth animations"
- "Professional design"
- "Explainable results"
- "Mobile responsive"

---

## 📊 METRICS TO MENTION

- **6** intelligence layers
- **20+** emergency keywords
- **8** dosha quiz questions
- **Top 3** ranked results
- **<2s** response time
- **100%** explainability

---

## 🔗 IMPORTANT LINKS

- **Backend API**: https://ayush-ai.onrender.com
- **API Docs**: https://ayush-ai.onrender.com/docs
- **Health Check**: https://ayush-ai.onrender.com/api/health
- **Supabase**: https://supabase.com/dashboard

---

## 📞 QUICK COMMANDS

```bash
# Test backend locally
cd backend
uvicorn main:app --reload

# Test frontend locally
cd frontend
python -m http.server 8080

# Check backend health
curl https://ayush-ai.onrender.com/api/health

# Test dosha endpoint
curl -X POST https://ayush-ai.onrender.com/api/dosha/assess \
  -H "Content-Type: application/json" \
  -H "X-User-ID: test-user-id" \
  -d '{"answers": [{"question_id": 1, "answer": "vata"}]}'
```

---

## ✅ PRE-DEMO CHECKLIST

- [ ] Database setup complete
- [ ] Backend deployed and healthy
- [ ] Frontend deployed
- [ ] Dosha quiz tested
- [ ] Emergency detection tested
- [ ] Match scores visible
- [ ] Mobile responsive checked
- [ ] Demo script practiced
- [ ] Talking points memorized
- [ ] Backup plan ready

---

## 🏆 CONFIDENCE BOOSTERS

Remember:
- ✅ Your system has 6 intelligence layers (most have 1)
- ✅ You have authentic dosha integration (most don't)
- ✅ You have emergency detection (safety-first)
- ✅ You have explainability (transparent)
- ✅ You have performance tracking (production-grade)

**You're not showing a demo. You're showing a product.**

---

Good luck! 🚀
