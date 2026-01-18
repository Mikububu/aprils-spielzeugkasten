#!/bin/bash

# Get local IP address
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)
else
    # Linux
    LOCAL_IP=$(hostname -I | awk '{print $1}')
fi

if [ -z "$LOCAL_IP" ]; then
    echo "❌ Could not detect local IP address"
    exit 1
fi

echo "🌐 Local Network Setup"
echo "====================="
echo ""
echo "Your local IP: $LOCAL_IP"
echo ""

# Update backend .env if needed
if [ -f "backend/.env" ]; then
    if ! grep -q "ALLOWED_ORIGINS.*$LOCAL_IP" backend/.env; then
        echo "📝 Updating backend/.env with local IP..."
        # Add local IP to ALLOWED_ORIGINS
        if grep -q "^ALLOWED_ORIGINS=" backend/.env; then
            sed -i.bak "s|ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=http://localhost:5173,http://$LOCAL_IP:5173|" backend/.env
            rm -f backend/.env.bak
        fi
    fi
fi

# Update frontend .env if needed
if [ -f ".env" ]; then
    echo "⚠️  Note: Your frontend .env points to: $(grep VITE_API_URL .env | cut -d= -f2)"
    echo "   To use from other devices, it should be: http://$LOCAL_IP:3001"
    echo ""
    read -p "Update .env to use local network IP? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "VITE_API_URL=http://$LOCAL_IP:3001" > .env
        echo "✓ Updated .env"
    fi
fi

echo ""
echo "🚀 Starting servers..."
echo ""
echo "Access from this computer:"
echo "  → http://localhost:5173"
echo ""
echo "Access from other devices on your network:"
echo "  → http://$LOCAL_IP:5173"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Start both servers
trap 'kill %1; kill %2' SIGINT

cd backend && npm run dev &
npm run dev &

wait
