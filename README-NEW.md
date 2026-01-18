# 🎨 April's Spielzeugkasten - Multi-Model Edition

**Independent AI Image & Video Generation Platform**

Generate stunning images and videos using multiple AI providers - Google, Minimax, Runpod, and more!

## ✨ Features

🎯 **Multiple AI Providers** - Google (Imagen 3, Veo 3.1), Minimax, Runpod (uncensored)  
🔓 **Uncensored Option** - Self-host models without content restrictions  
💰 **Cost Optimized** - Choose the cheapest provider for your needs  
🌐 **Offline Mode** - Run completely offline on your local network  
📱 **Multi-Device** - Access from phone, tablet, or any device on WiFi  
🚀 **Production Ready** - Deploy to Fly.io with one command  

---

## 🚀 Quick Start

### 1. Install

```bash
./install.sh
```

### 2. Add API Key

Edit `backend/.env` and add at least one provider:

```env
# Get from https://aistudio.google.com/
GOOGLE_API_KEY=your_key_here
```

### 3. Run

**Localhost only:**
```bash
cd backend && npm run dev  # Terminal 1
npm run dev                # Terminal 2
```

**Local network (access from phone/tablet):**
```bash
./start-offline.sh
```

### 4. Open

- **Computer**: http://localhost:5173
- **Phone/Tablet**: http://YOUR_IP:5173 (shown in terminal)

**That's it!** 🎉

---

## 📚 Documentation

- **[QUICK-START.md](QUICK-START.md)** - Get running in 5 minutes
- **[OFFLINE-ACCESS.md](OFFLINE-ACCESS.md)** - Run offline & access from other devices
- **[README-MULTI-MODEL.md](README-MULTI-MODEL.md)** - Full documentation
- **[PROJECT-SUMMARY.md](PROJECT-SUMMARY.md)** - Complete overview
- **[backend/DEPLOYMENT.md](backend/DEPLOYMENT.md)** - Deploy to production
- **[backend/runpod/README.md](backend/runpod/README.md)** - Uncensored models setup

---

## 🔑 Getting API Keys

### Google (Easiest - Free $0.50 credits)
1. Visit [https://aistudio.google.com/](https://aistudio.google.com/)
2. Click "Get API Key"
3. Copy to `backend/.env` as `GOOGLE_API_KEY`

### Minimax (Cheaper, less censored)
1. Visit [https://www.minimax.chat/](https://www.minimax.chat/)
2. Sign up and get API key
3. Add to `backend/.env`

### Runpod (Uncensored, self-hosted)
1. Visit [https://runpod.io](https://runpod.io)
2. Deploy models (see [backend/runpod/README.md](backend/runpod/README.md))
3. Add credentials to `backend/.env`

---

## 💰 Cost Comparison

| Provider | Image | Video | Censored? |
|----------|-------|-------|-----------|
| **Google** | $0.04 | $0.24 | Configurable ⚙️ |
| **Minimax** | $0.02 | $0.15 | Less strict 🟡 |
| **Runpod** | ~$0.01 | ~$0.10 | **Uncensored** 🔓 |

---

## 🌐 Access Modes

### 💻 Localhost (Default)
```bash
npm run dev
```
✅ Fastest, most secure  
Access: `http://localhost:5173`

### 📱 Local Network (Offline)
```bash
./start-offline.sh
```
✅ No internet needed  
✅ Access from phone/tablet  
Access: `http://YOUR_IP:5173`

### 🌍 Public (ngrok)
```bash
ngrok http 5173
```
✅ Share with anyone  
✅ Temporary public URL

### 🚀 Production (Fly.io)
```bash
cd backend && fly deploy
```
✅ Permanent public access  
✅ Scalable

---

## 🎯 Use Cases

- **Artists** - Uncensored creative freedom
- **Developers** - Multi-model experimentation
- **Businesses** - Cost-optimized generation
- **Hobbyists** - Offline local network use

---

## 🛠️ Tech Stack

- **Frontend**: Vite + TypeScript
- **Backend**: Express + TypeScript
- **AI Models**: Google Imagen/Veo, Minimax, SDXL, AnimateDiff
- **Storage**: Firebase (optional)
- **Deploy**: Fly.io, Runpod

---

## 📊 Architecture

```
Frontend (Browser)
    ↓
Backend API (Express)
    ├── Google Provider (Imagen 3 + Veo 3.1)
    ├── Minimax Provider (Chinese AI)
    └── Runpod Provider (Self-hosted SDXL + AnimateDiff)
```

---

## 🔓 Uncensored Models

Want **fully uncensored** generation?

1. Sign up at [Runpod.io](https://runpod.io)
2. Follow [backend/runpod/README.md](backend/runpod/README.md)
3. Deploy SDXL/AnimateDiff with safety filters disabled
4. Select "Runpod" provider in the app

**No content restrictions. Full creative freedom.**

---

## 🤝 Contributing

Want to add a new AI provider?

1. Create `backend/src/providers/your-provider.ts`
2. Extend `BaseModelProvider`
3. Implement `generateImage()` and `generateVideo()`
4. Register in `backend/src/providers/index.ts`

Easy to add: Replicate, Stability AI, OpenAI, HuggingFace, etc.

---

## 📄 License

MIT

---

## 🙏 Credits

- Google Gemini (Imagen 3, Veo 3.1)
- Minimax AI
- Stability AI (Stable Diffusion)
- Runpod (Serverless GPU)

---

**Made independent from vendor lock-in** 🎉

**No longer dependent on Google AI Studio or any single provider!**
