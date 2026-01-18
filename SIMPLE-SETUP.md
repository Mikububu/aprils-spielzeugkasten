# Simple Setup - Get Your Chrome Address

If localhost doesn't work for you, use your **real local IP address** instead.

---

## Step 1: Get Your Address

```bash
./get-my-url.sh
```

This will show you your **real address** that works in Chrome, like:
```
http://192.168.1.100:5173
```

**Copy this address!**

---

## Step 2: Start the Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

Wait until you see: "Ready to generate! 🎨🎬"

**Terminal 2 - Frontend:**
```bash
npm run dev
```

Wait until you see: "Local: http://..." and "Network: http://..."

---

## Step 3: Open Chrome

Open Chrome and paste your address:
```
http://192.168.1.100:5173
```

(Use the exact address from Step 1)

**That's it!** Should work now.

---

## If It Still Doesn't Work

### Check Firewall

**macOS:**
```bash
System Preferences → Security & Privacy → Firewall → Allow Node
```

**Windows:**
```bash
Windows Defender Firewall → Allow an app → Node.js
```

### Test Backend Directly

Open Chrome and try:
```
http://YOUR_IP:3001/health
```

If you see `{"status":"healthy"...}` - backend is working!

### Manual IP Detection

If the script doesn't work, find your IP manually:

**macOS:**
```bash
ipconfig getifaddr en0
```

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" like `192.168.1.100`

**Linux:**
```bash
hostname -I
```

Then update `.env`:
```env
VITE_API_URL=http://YOUR_IP:3001
```

And update `backend/.env`:
```env
ALLOWED_ORIGINS=http://YOUR_IP:5173
```

---

## Why Localhost Doesn't Work

Some systems have issues with "localhost". Using your real IP address like `192.168.1.100` fixes this.

The address works on:
- ✅ Your desktop Chrome
- ✅ Any other browser on your computer
- ✅ Any other device on your WiFi

---

## TL;DR

```bash
# 1. Get your address
./get-my-url.sh

# 2. Start backend
cd backend && npm run dev

# 3. Start frontend (new terminal)
npm run dev

# 4. Open Chrome
# Go to: http://YOUR_IP:5173
```

Done!
