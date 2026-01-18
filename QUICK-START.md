# 🚀 Quick Start Guide

## Step 1: Install Backend Dependencies

```bash
cd backend
npm install
cd ..
```

## Step 2: Set Up Environment Variables

Create `backend/.env` with your API keys:

```bash
cp backend/.env.template backend/.env
```

Then edit `backend/.env` and add at least one provider:

```env
PORT=3001
NODE_ENV=development

# Option 1: Google (Easiest to get started)
GOOGLE_API_KEY=your_google_api_key_from_ai_google_dev

# Option 2: Minimax (Less censored, cheaper)
MINIMAX_API_KEY=your_minimax_key
MINIMAX_GROUP_ID=your_minimax_group

# Option 3: Runpod (Fully uncensored, requires setup)
RUNPOD_API_KEY=your_runpod_key
RUNPOD_IMAGE_ENDPOINT=https://api.runpod.ai/v2/xxx
RUNPOD_VIDEO_ENDPOINT=https://api.runpod.ai/v2/xxx

ALLOWED_ORIGINS=http://localhost:5173
```

## Step 3: Create Frontend Environment

Create `.env` in the root directory:

```bash
VITE_API_URL=http://localhost:3001
```

## Step 4: Run the Application

### Option A: Localhost Only (Default)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

Visit: **http://localhost:5173**

### Option B: Local Network / Offline Mode (Access from Phone/Tablet)

**One command to start everything:**
```bash
./start-offline.sh
```

This will:
- Auto-detect your local IP
- Configure CORS settings
- Start both servers
- Show URLs for all devices

**Access from:**
- Your computer: `http://localhost:5173`
- Phone/Tablet (same WiFi): `http://YOUR_IP:5173`

**No internet required!** Just WiFi to connect devices.

See [OFFLINE-ACCESS.md](OFFLINE-ACCESS.md) for more options.

---

## 🔑 Getting Your First API Key (Google)

1. Go to [https://aistudio.google.com/](https://aistudio.google.com/)
2. Click "Get API Key"
3. Create a new API key
4. Copy it to `backend/.env` as `GOOGLE_API_KEY`
5. Restart the backend

That's it! You now have image and video generation working.

---

## 🆓 Free Tier Limits

- **Google**: $0.50 free credits (12 images or 2 videos)
- **Minimax**: Varies by region
- **Runpod**: Pay-as-you-go (cheapest, ~$0.01/image)

---

## ☁️ Deploy to Production

Once you're ready to deploy:

1. **Backend to Fly.io**: See `/backend/DEPLOYMENT.md`
2. **Frontend to Vercel/Netlify**: Standard Vite deployment
3. **Runpod Endpoints**: See `/backend/runpod/README.md`

---

## 🔥 Adding Uncensored Models (Advanced)

To run fully uncensored models:

1. Sign up at [Runpod.io](https://runpod.io)
2. Follow `/backend/runpod/README.md` to deploy SDXL
3. Add Runpod credentials to `backend/.env`
4. Select "RUNPOD" provider in the app

---

## 🆘 Troubleshooting

**Backend won't start:**
```bash
cd backend
npm install
npm run dev
```

**Frontend can't connect:**
- Check backend is running on port 3001
- Verify `.env` has `VITE_API_URL=http://localhost:3001`

**No providers available:**
- Check `backend/.env` has at least one API key
- Check backend terminal for errors

---

## 📚 Next Steps

- [Full Documentation](README-MULTI-MODEL.md)
- [API Reference](backend/README.md)
- [Deployment Guide](backend/DEPLOYMENT.md)
- [Runpod Setup](backend/runpod/README.md)

Enjoy creating! 🎨
