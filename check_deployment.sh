#!/bin/bash

echo "🔍 Checking AYUSH AI Backend Deployment Status..."
echo ""

# Check current version
response=$(curl -s https://ayush-ai.onrender.com/)
version=$(echo $response | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
intelligence_layers=$(echo $response | grep -o '"intelligence_layers":[0-9]*' | cut -d':' -f2)

echo "Current Version: $version"
echo "Intelligence Layers: $intelligence_layers"
echo ""

if [ "$version" = "2.0.0" ]; then
    echo "✅ NEW VERSION DEPLOYED!"
    echo "✅ Backend is ready with all new features!"
    echo ""
    echo "New features available:"
    echo "  - 6-layer intelligence pipeline"
    echo "  - Dosha assessment endpoints"
    echo "  - Save remedies endpoints"
    echo "  - Enhanced logging"
    echo ""
    echo "🎉 You can now test the frontend!"
else
    echo "⏳ Still deploying... (showing version $version)"
    echo "⏳ Render is building and deploying the new version"
    echo ""
    echo "This usually takes 2-3 minutes."
    echo "Run this script again in a minute to check status."
fi

echo ""
echo "Backend URL: https://ayush-ai.onrender.com"
echo "API Docs: https://ayush-ai.onrender.com/docs"
