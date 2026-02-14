# Quick Start Guide

Get your AYUSH AI Assistant running in 2 minutes!

## 🚀 Instant Setup

### Step 1: Get the Code
```bash
git clone <your-repo-url>
cd ayush-ai-assistant
```

### Step 2: Open the App
```bash
cd frontend
open index.html
```

That's it! The app is ready to use. 🎉

## 🌐 Using a Local Server (Recommended)

For better development experience:

**Python (Built-in)**
```bash
cd frontend
python -m http.server 8080
```
Then visit: http://localhost:8080

**Node.js**
```bash
npm install -g http-server
cd frontend
http-server -p 8080
```
Then visit: http://localhost:8080

## 📱 How to Use

1. **Choose Language**: Click English or हिंदी
2. **Enter Symptoms**: Type your symptoms in the text area
3. **Analyze**: Click "Analyze Symptoms" button
4. **View Results**: Get personalized AYUSH recommendations

## 🧪 Test It

Try these sample symptoms:

**English:**
- "I have a headache and feeling tired"
- "I have a cold and cough with mild fever"
- "Feeling stressed and anxious"

**Hindi:**
- "मुझे सिरदर्द और थकान है"
- "मुझे सर्दी और खांसी है"

## 🌍 Deploy Online

Want to share your app? Deploy in 1 minute:

**Netlify (Easiest)**
1. Go to [netlify.com](https://netlify.com)
2. Drag the `frontend` folder
3. Done! Get your live URL

See [DEPLOYMENT.md](DEPLOYMENT.md) for more options.

## ⚙️ Configuration

The app is pre-configured to use the production API:
- API: `https://ayush-ai.onrender.com`

To change settings, edit `frontend/js/config.js`

## 🆘 Troubleshooting

**App not loading?**
- Use a local server instead of opening HTML directly
- Check browser console for errors

**API not responding?**
- First request may take 30 seconds (Render free tier)
- Check: https://ayush-ai.onrender.com/health

**Styles broken?**
- Clear browser cache
- Ensure you're in the `frontend` directory

## 📚 Learn More

- [README.md](README.md) - Full documentation
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - API details
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment guide

## 🎯 Next Steps

- Customize the UI colors in `frontend/css/style.css`
- Add more features in `frontend/js/app.js`
- Deploy to production
- Share with friends!

Happy coding! 🌿
