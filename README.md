# AYUSH AI Digital Assistant

An AI-powered health assistant that provides personalized AYUSH (Ayurveda, Yoga, Unani, Siddha, Homeopathy) treatment recommendations based on your symptoms.

## 🌟 Features

✅ **AI-Powered Analysis** - Intelligent symptom analysis using GPT-4  
✅ **AYUSH Recommendations** - Get treatments from all 5 AYUSH systems  
✅ **Bilingual Support** - Available in English and Hindi  
✅ **Safety First** - Includes warnings and medical disclaimers  
✅ **Explainability** - Understand why each treatment is recommended  
✅ **Modern UI** - Clean, responsive design that works on all devices  

## 🚀 Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: FastAPI (Python) - Deployed on Render
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4
- **Deployment**: 
  - Backend: Render (https://ayush-ai.onrender.com)
  - Frontend: Can be deployed on Netlify, Vercel, or GitHub Pages

## 📁 Project Structure

```
ayush-ai-assistant/
├── frontend/
│   ├── index.html          # Main HTML file
│   ├── test.html           # API testing page
│   ├── css/
│   │   └── style.css       # Styling
│   └── js/
│       ├── config.js       # API configuration
│       └── app.js          # Main application logic
├── backend/
│   ├── main.py             # FastAPI backend
│   ├── requirements.txt    # Python dependencies
│   └── runtime.txt         # Python version for deployment
├── API_DOCUMENTATION.md    # API endpoint documentation
├── DEPLOYMENT.md           # Deployment guide
├── QUICKSTART.md           # Quick start guide
└── README.md               # This file
```

## 🛠️ Setup & Installation

### Frontend Setup (Quick Start)

1. **Clone the repository**
```bash
git clone https://github.com/Shivang1109/AYUSH-AI.git
cd AYUSH-AI
```

2. **Open the frontend**
```bash
cd frontend
# Option 1: Open directly in browser
open index.html

# Option 2: Use a local server (recommended)
python -m http.server 8080
# Then visit: http://localhost:8080
```

3. **That's it!** The frontend is already configured to use the deployed backend at `https://ayush-ai.onrender.com`

### Backend Setup (For Development)

The backend is already deployed on Render. If you want to run it locally:

1. **Install dependencies**
```bash
cd backend
pip install -r requirements.txt
```

2. **Set up environment variables**
Create a `.env` file in the backend folder:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_key
ANTHROPIC_API_KEY=your_anthropic_key  # Optional
```

3. **Run the backend**
```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`

4. **Update frontend config** (if using local backend)
Edit `frontend/js/config.js`:
```javascript
const API_CONFIG = {
    BASE_URL: 'http://localhost:8000',
    // ...
};
```

## 🌐 Deployment

### Deploy Frontend to Netlify

1. Create account at [netlify.com](https://netlify.com)
2. Drag and drop the `frontend` folder
3. Your site is live!

### Deploy Frontend to Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `cd frontend && vercel`
3. Follow the prompts

### Deploy Frontend to GitHub Pages

1. Push code to GitHub
2. Go to Settings → Pages
3. Select branch and `/frontend` folder
4. Save and your site will be live

## 📖 Usage

1. **Open the app**: Open `frontend/index.html` in your browser or use a local server
2. **Select Language**: Choose English or Hindi
3. **Describe Symptoms**: Enter your symptoms in detail (minimum 10 characters)
4. **Get Recommendations**: Click "Analyze Symptoms"
5. **Review Results**: See personalized AYUSH treatment recommendations
6. **Follow Safety Guidelines**: Always read the warnings and disclaimers

### Testing the API

Open `frontend/test.html` to test the API connection and see sample responses.

## 🚀 Quick Commands

```bash
# Clone the repository
git clone <your-repo-url>
cd ayush-ai-assistant

# Open in browser (simple)
cd frontend
open index.html

# Or use a local server (recommended)
python -m http.server 8080
# Visit: http://localhost:8080
```

See [QUICKSTART.md](QUICKSTART.md) for detailed instructions.

## 🔒 Important Disclaimers

⚠️ This application is for **educational and informational purposes only**  
⚠️ Not a substitute for professional medical advice  
⚠️ Always consult qualified healthcare practitioners  
⚠️ Seek immediate medical attention for severe symptoms  

## 🎯 AYUSH Systems Covered

- 🌱 **Ayurveda**: Herbal remedies and dietary recommendations
- 🧘 **Yoga**: Asanas, pranayama, and meditation practices
- 🌿 **Unani**: Greco-Arabic traditional medicine
- 💊 **Siddha**: South Indian traditional medicine
- ⚗️ **Homeopathy**: Homeopathic remedies

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

## 📞 Support

For issues or questions, please open an issue on GitHub or contact the maintainers.
