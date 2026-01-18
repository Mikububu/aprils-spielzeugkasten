# 🌐 Offline & Local Network Access Guide

Multiple ways to run April's Toybox offline and access from different devices.

---

## 🏠 Option 1: Localhost (Default)

**Best for:** Working on the same computer

```bash
# Terminal 1 - Backend
cd backend
npm run dev
# Runs on http://localhost:3001

# Terminal 2 - Frontend  
npm run dev
# Runs on http://localhost:5173 (or 3000)
```

**Access:** Open `http://localhost:5173` in your browser

✅ Fastest  
✅ No network needed  
✅ Most secure  

---

## 📱 Option 2: Local Network (WiFi)

**Best for:** Accessing from phone, tablet, or other computers on same WiFi

### Automated Setup

```bash
./run-local-network.sh
```

This will:
- Detect your local IP (e.g., 192.168.1.100)
- Configure CORS settings
- Start both servers
- Show you the URL to access from other devices

### Manual Setup

**1. Find your local IP:**

```bash
# macOS
ipconfig getifaddr en0

# Linux
hostname -I | awk '{print $1}'

# Windows
ipconfig
# Look for "IPv4 Address"
```

Example output: `192.168.1.100`

**2. Update `backend/.env`:**

```env
ALLOWED_ORIGINS=http://localhost:5173,http://192.168.1.100:5173
```

**3. Update `.env` (root directory):**

```env
VITE_API_URL=http://192.168.1.100:3001
```

**4. Start servers:**

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
npm run dev
```

**5. Access from any device on your WiFi:**

- From your computer: `http://localhost:5173`
- From phone/tablet: `http://192.168.1.100:5173`

✅ No internet needed  
✅ Fast local connection  
✅ Access from multiple devices  
✅ Completely offline  

---

## 🌍 Option 3: Temporary Public URL (ngrok)

**Best for:** Sharing with friends or testing from anywhere

### Install ngrok

```bash
# macOS
brew install ngrok

# Or download from https://ngrok.com/
```

### Expose to Internet

```bash
# Terminal 1 - Start backend
cd backend && npm run dev

# Terminal 2 - Expose backend
ngrok http 3001
# Copy the https URL (e.g., https://abc123.ngrok.io)

# Terminal 3 - Update frontend .env
echo "VITE_API_URL=https://abc123.ngrok.io" > .env

# Terminal 4 - Start frontend
npm run dev

# Terminal 5 - Expose frontend
ngrok http 5173
# Copy the https URL (e.g., https://xyz789.ngrok.io)
```

**Share the frontend URL** with anyone: `https://xyz789.ngrok.io`

✅ Access from anywhere  
✅ Share with others  
✅ HTTPS enabled  
⚠️ URL changes each session (free tier)  

---

## 🚀 Option 4: Production Deployment

**Best for:** Permanent public access

Already configured! See:
- **Backend**: `backend/DEPLOYMENT.md` (Fly.io)
- **Frontend**: Deploy to Vercel/Netlify

---

## 🔧 Troubleshooting

### Can't access from other devices?

**1. Check firewall:**

```bash
# macOS - Allow Node.js in Firewall settings
# System Preferences → Security & Privacy → Firewall

# Linux
sudo ufw allow 5173/tcp
sudo ufw allow 3001/tcp

# Windows - Allow in Windows Defender Firewall
```

**2. Verify servers are listening on 0.0.0.0:**

When you start the servers, you should see:
```
Network: http://192.168.1.100:5173
```

If you only see `localhost`, check `vite.config.ts` has:
```typescript
server: {
  host: '0.0.0.0'
}
```

**3. Check CORS:**

Add all access URLs to `backend/.env`:
```env
ALLOWED_ORIGINS=http://localhost:5173,http://192.168.1.100:5173,http://192.168.1.50:5173
```

**4. Test backend directly:**

From another device, visit: `http://YOUR_IP:3001/health`

If this works, the issue is CORS or frontend config.

---

## 📊 Comparison

| Method | Devices | Internet | Setup | Speed | Public |
|--------|---------|----------|-------|-------|--------|
| **Localhost** | Same PC | No | Easy | Fastest | No |
| **Local WiFi** | Same WiFi | No | Medium | Fast | No |
| **ngrok** | Any | Yes | Easy | Medium | Yes |
| **Fly.io** | Any | Yes | Medium | Fast | Yes |

---

## 🎯 Recommended Setups

### Solo Development
```bash
npm run dev
```
Access: `http://localhost:5173`

### Testing on Phone/Tablet
```bash
./run-local-network.sh
```
Access: `http://YOUR_IP:5173` from any device on WiFi

### Demo to Friends
```bash
# Use ngrok
ngrok http 3001 &
ngrok http 5173 &
```
Share the public URL

### Production
```bash
cd backend && fly deploy
# Deploy frontend to Vercel
```
Permanent public access

---

## 💡 Pro Tips

**1. Static IP for Local Network**

Set a static IP on your router for your computer so the URL doesn't change.

**2. QR Code for Mobile**

Generate a QR code for easy mobile access:
```bash
# Install qrencode
brew install qrencode

# Generate QR code
qrencode -t ansiutf8 "http://192.168.1.100:5173"
```

Scan with phone camera to open!

**3. Bookmark on Mobile**

Add to home screen on iOS/Android for app-like experience.

**4. Multiple Devices**

All devices on your WiFi can access simultaneously - great for collaborative sessions!

---

## 🔒 Security Notes

- **Local Network**: Only accessible on your WiFi (secure)
- **ngrok**: Temporary public URL (expires when you stop it)
- **Production**: Use environment variables for API keys (never commit them)

---

## 📝 Quick Reference

```bash
# Find your IP
ipconfig getifaddr en0  # macOS
hostname -I  # Linux

# Run on local network
./run-local-network.sh

# Expose to internet (temporary)
ngrok http 5173

# Check if backend is accessible
curl http://YOUR_IP:3001/health
```

---

**You can now run this completely offline on your local network!** 🎉

No internet required - just WiFi to connect your devices together.
