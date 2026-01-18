#!/bin/bash

echo "🌐 Starting April's Toybox in Offline/Local Network Mode"
echo "=========================================================="
echo ""

# Detect local IP
if [[ "$OSTYPE" == "darwin"* ]]; then
    LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)
else
    LOCAL_IP=$(hostname -I | awk '{print $1}')
fi

if [ -z "$LOCAL_IP" ]; then
    echo "⚠️  Could not detect local IP, using localhost only"
    LOCAL_IP="localhost"
else
    echo "✓ Detected local IP: $LOCAL_IP"
fi

# Check if backend/.env exists
if [ ! -f "backend/.env" ]; then
    echo "❌ backend/.env not found!"
    echo "   Run ./install.sh first or copy backend/.env.template to backend/.env"
    exit 1
fi

# Update CORS if needed
if [ "$LOCAL_IP" != "localhost" ]; then
    if grep -q "^ALLOWED_ORIGINS=" backend/.env; then
        if ! grep -q "$LOCAL_IP" backend/.env; then
            echo "📝 Adding $LOCAL_IP to CORS allowed origins..."
            sed -i.bak "s|ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://$LOCAL_IP:5173,http://$LOCAL_IP:3000|" backend/.env
            rm -f backend/.env.bak
        fi
    else
        echo "ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://$LOCAL_IP:5173,http://$LOCAL_IP:3000" >> backend/.env
    fi
fi

# Update frontend .env
if [ "$LOCAL_IP" != "localhost" ]; then
    echo "VITE_API_URL=http://$LOCAL_IP:3001" > .env
    echo "✓ Frontend configured to use local network"
else
    echo "VITE_API_URL=http://localhost:3001" > .env
    echo "✓ Frontend configured for localhost"
fi

echo ""
echo "🚀 Starting servers..."
echo ""

if [ "$LOCAL_IP" != "localhost" ]; then
    echo "📱 Access from this computer:"
    echo "   → http://localhost:5173"
    echo "   → http://localhost:3000"
    echo ""
    echo "📱 Access from other devices on your WiFi:"
    echo "   → http://$LOCAL_IP:5173"
    echo "   → http://$LOCAL_IP:3000"
else
    echo "📱 Access from:"
    echo "   → http://localhost:5173"
    echo "   → http://localhost:3000"
fi

echo ""
echo "💡 Tip: Scan this QR code from your phone:"
if command -v qrencode &> /dev/null; then
    qrencode -t ansiutf8 "http://$LOCAL_IP:5173" 2>/dev/null || echo "   (Install qrencode for QR code: brew install qrencode)"
else
    echo "   (Install qrencode for QR code: brew install qrencode)"
fi

echo ""
echo "Press Ctrl+C to stop both servers"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill %1 %2 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend
cd backend
npm run dev &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 2

# Start frontend
cd ..
npm run dev &
FRONTEND_PID=$!

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
