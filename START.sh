#!/bin/bash

echo "🚀 Starting April's Toybox"
echo "=========================="
echo ""

# Check if backend/.env exists
if [ ! -f "backend/.env" ]; then
    echo "⚠️  WARNING: backend/.env not found!"
    echo ""
    echo "Creating backend/.env with template..."
    cat > backend/.env << 'EOF'
PORT=3001
NODE_ENV=development

# IMPORTANT: Add your Google API key here
# Get it from: https://aistudio.google.com/
GOOGLE_API_KEY=

# Optional providers
MINIMAX_API_KEY=
MINIMAX_GROUP_ID=
RUNPOD_API_KEY=
RUNPOD_IMAGE_ENDPOINT=
RUNPOD_VIDEO_ENDPOINT=

ALLOWED_ORIGINS=http://localhost:5173,http://172.20.10.4:5173
EOF
    echo "✓ Created backend/.env"
    echo ""
    echo "❌ YOU MUST ADD YOUR API KEY TO backend/.env BEFORE CONTINUING!"
    echo ""
    echo "Edit backend/.env and add your GOOGLE_API_KEY"
    echo "Get one from: https://aistudio.google.com/"
    echo ""
    exit 1
fi

# Check if API key is set
if ! grep -q "GOOGLE_API_KEY=.\+" backend/.env; then
    echo "❌ ERROR: No API key found in backend/.env"
    echo ""
    echo "Please edit backend/.env and add your GOOGLE_API_KEY"
    echo "Get one from: https://aistudio.google.com/"
    echo ""
    exit 1
fi

# Detect IP
if [[ "$OSTYPE" == "darwin"* ]]; then
    LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)
else
    LOCAL_IP=$(hostname -I | awk '{print $1}')
fi

if [ -z "$LOCAL_IP" ]; then
    LOCAL_IP="localhost"
fi

echo "✅ Configuration looks good!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 YOUR CHROME ADDRESS:"
echo ""
echo "   http://$LOCAL_IP:5173"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔄 Starting servers..."
echo ""
echo "   Backend on: http://$LOCAL_IP:3001"
echo "   Frontend on: http://$LOCAL_IP:5173"
echo ""
echo "⏳ Please wait 10-20 seconds for servers to start..."
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend
echo "Starting backend..."
cd backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend
echo "Waiting for backend to start..."
sleep 5

# Check if backend started
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo ""
    echo "❌ Backend failed to start!"
    echo ""
    echo "Check backend.log for errors:"
    tail -20 backend.log
    exit 1
fi

# Start frontend
echo "Starting frontend..."
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend
echo "Waiting for frontend to start..."
sleep 8

# Check if frontend started
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo ""
    echo "❌ Frontend failed to start!"
    echo ""
    echo "Check frontend.log for errors:"
    tail -20 frontend.log
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ SERVERS ARE RUNNING!"
echo ""
echo "🌐 Open Chrome and go to:"
echo ""
echo "   http://$LOCAL_IP:5173"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Logs are saved to:"
echo "   - backend.log"
echo "   - frontend.log"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Keep running
wait $BACKEND_PID $FRONTEND_PID
