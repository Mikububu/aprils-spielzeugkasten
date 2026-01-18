# 🎯 START HERE - April's Spielzeugkasten

Welcome! This is your **independent, multi-model AI generation platform**.

---

## ⚡ Quick Start (3 Steps)

### 1️⃣ Install
```bash
./install.sh
```

### 2️⃣ Add API Key
Edit `backend/.env` and add one API key:
```env
GOOGLE_API_KEY=your_key_from_aistudio_google_com
```

### 3️⃣ Run
```bash
./start-offline.sh
```

**Done!** Open the URL shown in your terminal.

---

## 🌐 How to Run It

### 🏠 Localhost Only (Same Computer)
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2  
npm run dev
```
Access: **http://localhost:5173**

### 📱 Offline / Local Network (Access from Phone/Tablet)
```bash
./start-offline.sh
```
Access from:
- **Your computer**: http://localhost:5173
- **Phone/Tablet**: http://YOUR_IP:5173 (shown in terminal)

**✅ No internet needed - just WiFi!**

---

## 🔑 Where to Get API Keys

You need **at least one**:

| Provider | Cost | Censored? | Get Key |
|----------|------|-----------|---------|
| **Google** | $0.04/img | Configurable | [aistudio.google.com](https://aistudio.google.com/) |
| **Minimax** | $0.02/img | Less strict | [minimax.chat](https://www.minimax.chat/) |
| **Runpod** | $0.01/img | Uncensored | [runpod.io](https://runpod.io) + setup |

**Recommendation**: Start with Google (easiest, free credits).

---

## 📱 Access from Phone/Tablet

1. Run: `./start-offline.sh`
2. Look for the URL in terminal (e.g., `http://192.168.1.100:5173`)
3. Open that URL on your phone
4. Make sure phone is on **same WiFi**

**No internet needed!** Works completely offline.

---

## 🔓 Want Uncensored Models?

Follow these steps:

1. Read: [backend/runpod/README.md](backend/runpod/README.md)
2. Sign up at [Runpod.io](https://runpod.io)
3. Deploy SDXL/AnimateDiff containers
4. Add credentials to `backend/.env`
5. Select "Runpod" in the app

**No content restrictions.**

---

## 📚 Full Documentation

- **[OFFLINE-ACCESS.md](OFFLINE-ACCESS.md)** - All ways to run offline
- **[QUICK-START.md](QUICK-START.md)** - Detailed setup guide
- **[README-MULTI-MODEL.md](README-MULTI-MODEL.md)** - Full features
- **[PROJECT-SUMMARY.md](PROJECT-SUMMARY.md)** - What was built
- **[backend/DEPLOYMENT.md](backend/DEPLOYMENT.md)** - Deploy to production

---

## 🆘 Troubleshooting

### "No providers available"
- Check `backend/.env` has at least one API key
- Restart backend: `cd backend && npm run dev`

### "Can't access from phone"
- Make sure phone is on **same WiFi**
- Check firewall isn't blocking ports 3001 and 5173
- Try: `http://YOUR_IP:3001/health` in phone browser

### "Backend won't start"
```bash
cd backend
npm install
npm run dev
```

### "Frontend can't connect"
- Check backend is running (should see "Ready to generate!")
- Verify `.env` has correct `VITE_API_URL`

---

## 💡 Pro Tips

**1. QR Code for Mobile**
```bash
brew install qrencode
qrencode -t ansiutf8 "http://YOUR_IP:5173"
```
Scan with phone camera!

**2. Bookmark on Phone**
Add to home screen for app-like experience.

**3. Multiple Devices**
All devices on WiFi can access simultaneously!

**4. Cost Optimization**
- Use Minimax for testing (cheaper)
- Use Google for final output (best quality)
- Use Runpod for uncensored content

---

## 🎯 What You Can Do

✅ Generate images from text  
✅ Generate videos from text  
✅ Convert images to videos  
✅ Blend multiple images  
✅ Custom art styles  
✅ Switch between AI models  
✅ Save to cloud (Firebase)  
✅ Work completely offline  
✅ Access from any device  

---

## 🚀 Next Steps

1. **Run it**: `./start-offline.sh`
2. **Try it**: Generate your first image
3. **Explore**: Switch between providers
4. **Deploy**: Follow [backend/DEPLOYMENT.md](backend/DEPLOYMENT.md) for production

---

## 📊 Quick Reference

```bash
# Install everything
./install.sh

# Run offline (local network)
./start-offline.sh

# Run localhost only
npm run dev

# Find your IP
ipconfig getifaddr en0  # macOS
hostname -I             # Linux

# Check backend health
curl http://localhost:3001/health
```

---

## 🎉 You're All Set!

Your platform is:
- ✅ Independent (not tied to any vendor)
- ✅ Multi-model (Google, Minimax, Runpod)
- ✅ Offline capable (no internet needed)
- ✅ Uncensored option (via Runpod)
- ✅ Production ready (deploy to Fly.io)

**Start creating!** 🎨

---

**Questions?** Check the documentation files above or the [PROJECT-SUMMARY.md](PROJECT-SUMMARY.md).
