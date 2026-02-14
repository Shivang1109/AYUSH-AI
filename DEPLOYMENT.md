# Deployment Guide

## Frontend Deployment Options

### Option 1: Netlify (Recommended - Easiest)

1. **Via Drag & Drop**
   - Go to [netlify.com](https://netlify.com)
   - Sign up/Login
   - Drag the `frontend` folder to the deploy area
   - Done! Your site is live

2. **Via Git**
   - Push your code to GitHub
   - Connect Netlify to your repository
   - Set build settings:
     - Base directory: `frontend`
     - Publish directory: `frontend`
   - Deploy

### Option 2: Vercel

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Deploy**
```bash
cd frontend
vercel
```

3. **Follow prompts**
   - Login to Vercel
   - Confirm settings
   - Your site will be live

### Option 3: GitHub Pages

1. **Push to GitHub**
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Enable GitHub Pages**
   - Go to repository Settings
   - Navigate to Pages section
   - Source: Deploy from branch
   - Branch: `main`
   - Folder: `/frontend` or `/` (root)
   - Save

3. **Access your site**
   - URL: `https://yourusername.github.io/repo-name`

### Option 4: Local Server (Development)

**Python**
```bash
cd frontend
python -m http.server 8080
# Visit: http://localhost:8080
```

**Node.js (http-server)**
```bash
npm install -g http-server
cd frontend
http-server -p 8080
# Visit: http://localhost:8080
```

**PHP**
```bash
cd frontend
php -S localhost:8080
# Visit: http://localhost:8080
```

## Backend (Already Deployed)

Your backend is already deployed on Render at:
- **URL**: https://ayush-ai.onrender.com
- **API Docs**: https://ayush-ai.onrender.com/docs

No additional backend deployment needed!

## Custom Domain Setup

### Netlify
1. Go to Domain settings
2. Add custom domain
3. Update DNS records as instructed

### Vercel
1. Go to Project Settings → Domains
2. Add your domain
3. Configure DNS

### GitHub Pages
1. Add `CNAME` file in frontend folder with your domain
2. Update DNS records to point to GitHub Pages

## Environment Variables

The frontend is configured to use the production API:
- API URL: `https://ayush-ai.onrender.com`

To change the API endpoint, edit `frontend/js/config.js`:
```javascript
const API_CONFIG = {
    BASE_URL: 'https://your-api-url.com',
    // ...
};
```

## Testing Deployment

After deployment, test these features:
1. ✅ Page loads correctly
2. ✅ Language toggle works
3. ✅ Symptom analysis returns results
4. ✅ Results display properly
5. ✅ Responsive on mobile devices

## Troubleshooting

### CORS Errors
If you see CORS errors, ensure your backend allows requests from your frontend domain.

### API Not Responding
- Check if backend is running: https://ayush-ai.onrender.com/health
- Render free tier may sleep after inactivity (first request takes ~30 seconds)

### Styles Not Loading
- Check file paths in HTML
- Ensure CSS file is in correct location
- Clear browser cache

## Performance Tips

1. **Enable Caching**: Most platforms do this automatically
2. **Use CDN**: Netlify and Vercel provide CDN by default
3. **Compress Images**: If you add images later
4. **Minify CSS/JS**: For production builds

## Security Considerations

1. **HTTPS**: All deployment platforms provide free SSL
2. **API Keys**: Never expose API keys in frontend code
3. **Rate Limiting**: Consider adding rate limiting to backend
4. **Input Validation**: Already handled by backend

## Monitoring

### Netlify
- Built-in analytics available
- Check deploy logs for errors

### Vercel
- Analytics dashboard
- Real-time logs

### GitHub Pages
- Use Google Analytics for tracking
- Check Actions tab for deploy status

## Cost

All recommended platforms offer free tiers:
- **Netlify**: 100GB bandwidth/month free
- **Vercel**: Unlimited bandwidth for personal projects
- **GitHub Pages**: Free for public repositories

## Support

If you encounter issues:
1. Check deployment logs
2. Test API endpoint directly
3. Verify file paths
4. Check browser console for errors
