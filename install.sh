#!/bin/bash

echo "🚀 Installing April's Toybox Multi-Model Edition"
echo "================================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ first."
    exit 1
fi

echo "✓ Node.js $(node --version) detected"
echo ""

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "⚠️  Frontend install had issues, but continuing..."
fi
echo ""

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "⚠️  Backend install had issues, but continuing..."
fi
cd ..
echo ""

# Create environment files if they don't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating frontend .env file..."
    echo "VITE_API_URL=http://localhost:3001" > .env
    echo "✓ Created .env"
fi

if [ ! -f "backend/.env" ]; then
    echo "📝 Creating backend .env template..."
    cat > backend/.env << 'EOF'
PORT=3001
NODE_ENV=development

# Add at least one provider API key below:

# Google Gemini (get from https://aistudio.google.com/)
GOOGLE_API_KEY=

# Minimax (get from https://www.minimax.chat/)
MINIMAX_API_KEY=
MINIMAX_GROUP_ID=

# Runpod (get from https://runpod.io)
RUNPOD_API_KEY=
RUNPOD_IMAGE_ENDPOINT=
RUNPOD_VIDEO_ENDPOINT=

ALLOWED_ORIGINS=http://localhost:5173
EOF
    echo "✓ Created backend/.env"
    echo ""
    echo "⚠️  IMPORTANT: Edit backend/.env and add at least one API key!"
fi

echo ""
echo "✅ Installation complete!"
echo ""
echo "Next steps:"
echo "1. Edit backend/.env and add your API key(s)"
echo "2. Run backend:  cd backend && npm run dev"
echo "3. Run frontend: npm run dev (in a new terminal)"
echo "4. Open http://localhost:5173"
echo ""
echo "📚 See QUICK-START.md for detailed instructions"
echo ""
