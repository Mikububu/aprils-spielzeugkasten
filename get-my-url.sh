#!/bin/bash

echo ""
echo "🔍 Finding your local IP address..."
echo ""

# Detect local IP
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)
else
    # Linux
    LOCAL_IP=$(hostname -I | awk '{print $1}')
fi

if [ -z "$LOCAL_IP" ]; then
    echo "❌ Could not detect IP address"
    echo ""
    echo "Try running this command manually:"
    echo "  ipconfig getifaddr en0"
    echo ""
    exit 1
fi

echo "✅ Your local IP: $LOCAL_IP"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 COPY THIS ADDRESS FOR CHROME:"
echo ""
echo "   http://$LOCAL_IP:5173"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "This is your real address (not localhost)."
echo "Use this in Chrome on ANY computer on your network."
echo ""

# Update .env files
echo "📝 Configuring backend and frontend..."
echo ""

# Update backend .env
if [ -f "backend/.env" ]; then
    # Add local IP to CORS
    if grep -q "^ALLOWED_ORIGINS=" backend/.env; then
        sed -i.bak "s|ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://$LOCAL_IP:5173,http://$LOCAL_IP:3000|" backend/.env
        rm -f backend/.env.bak
    else
        echo "ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://$LOCAL_IP:5173,http://$LOCAL_IP:3000" >> backend/.env
    fi
    echo "✓ Backend configured"
fi

# Update frontend .env
echo "VITE_API_URL=http://$LOCAL_IP:3001" > .env
echo "✓ Frontend configured"

echo ""
echo "✅ Configuration complete!"
echo ""
echo "Now run these two commands:"
echo ""
echo "Terminal 1:"
echo "  cd backend && npm run dev"
echo ""
echo "Terminal 2:"
echo "  npm run dev"
echo ""
echo "Then open Chrome and go to:"
echo "  http://$LOCAL_IP:5173"
echo ""
