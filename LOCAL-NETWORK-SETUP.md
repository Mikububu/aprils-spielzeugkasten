# 🌐 Running on Local Network (Offline URL)

This guide shows you how to access April's Toybox from other devices on your WiFi network.

---

## Quick Start (Automated)

```bash
./run-local-network.sh
```

This script will:
1. Detect your local IP address
2. Update configuration files
3. Start both frontend and backend
4. Show you the URL to access from other devices

---

## Manual Setup

### Step 1: Find Your Local IP Address

**macOS:**
```bash
ipconfig getifaddr en0
# Example output: 192.168.1.100
```

**Linux:**
```bash
hostname -I | awk '{print $1}'
# Example output: 192.168.1.100
```

**Windows:**
```bash
ipconfig
# Look for "IPv4 Address" under your WiFi adapter
```

### Step 2: Update Backend Configuration

Edit `backend/.env` and add your local IP to ALLOWED_ORIGINS:

```env
ALLOWED_ORIGINS=http://localhost:5173,http://192.168.1.100:5173
```

Replace `192.168.1.100` with your actual local IP.

### Step 3: Update Frontend Configuration

**Option A: For accessing from other devices**

Edit `.env` in the project root:
```env
VITE_API_URL=http://192.168.1.100:3001
```

**Option B: For localhost only**
```env
VITE_API_URL=http://localhost:3001
```

### Step 4: Start Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### Step 5: Access from Other Devices

- **From the same computer**: `http://localhost:5173`
- **From other devices**: `http://192.168.1.100:5173`

---

## 📱 Accessing from Phone/Tablet

1. Make sure your device is on the **same WiFi network**
2. Open browser and go to: `http://YOUR_LOCAL_IP:5173`
3. Accept any security warnings (self-signed cert)
4. Start generating!

---

## 🔒 Firewall Configuration

If you can't access from other devices:

### macOS
```bash
# Allow Node.js to accept incoming connections
# System Preferences → Security & Privacy → Firewall → Firewall Options
# Click "Allow incoming connections" for Node
```

### Linux (UFW)
```bash
sudo ufw allow 5173/tcp
sudo ufw allow 3001/tcp
```

### Windows
```bash
# Windows Defender Firewall → Advanced Settings → Inbound Rules
# New Rule → Port → TCP → Specific ports: 3001, 5173
```

---

## 🌍 Exposing to Internet (Temporary)

For temporary public access, use a tunneling service:

### Option 1: ngrok (Recommended)

**Install:**
```bash
brew install ngrok  # macOS
# or download from https://ngrok.com/
```

**Expose Backend:**
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
ngrok http 3001
# Copy the https URL, e.g., https://abc123.ngrok.io
```

**Expose Frontend:**
```bash
# Terminal 3
npm run dev

# Terminal 4
ngrok http 5173
# Copy the https URL, e.g., https://xyz789.ngrok.io
```

**Update Configuration:**
```bash
# Update .env
VITE_API_URL=https://abc123.ngrok.io

# Update backend/.env
ALLOWED_ORIGINS=https://xyz789.ngrok.io

# Restart servers
```

**Share the frontend URL** with anyone: `https://xyz789.ngrok.io`

### Option 2: Cloudflare Tunnel

```bash
# Install
brew install cloudflare/cloudflare/cloudflared

# Expose backend
cloudflared tunnel --url http://localhost:3001

# Expose frontend
cloudflared tunnel --url http://localhost:5173
```

### Option 3: LocalTunnel

```bash
npm install -g localtunnel

# Expose frontend
lt --port 5173
# You'll get a URL like: https://random-name.loca.lt

# Expose backend
lt --port 3001
```

---

## 🔧 Troubleshooting

### "Connection Refused" from Other Devices

**Check if servers are listening on 0.0.0.0:**
```bash
# Backend should show: Server listening on 0.0.0.0:3001
# Frontend (Vite) should show: Network: http://192.168.1.100:5173
```

If not, ensure `vite.config.ts` has:
```typescript
server: {
  host: '0.0.0.0',
  port: 5173
}
```

And backend `server.ts` has:
```typescript
app.listen(PORT, '0.0.0.0', () => { ... })
```

### CORS Errors

Add your device's access URL to `backend/.env`:
```env
ALLOWED_ORIGINS=http://localhost:5173,http://192.168.1.100:5173,http://192.168.1.50:5173
```

### Can't Access from Phone

1. Ensure phone is on **same WiFi network**
2. Check firewall isn't blocking connections
3. Try accessing backend directly: `http://YOUR_IP:3001/health`
4. If backend works but frontend doesn't, check CORS settings

---

## 📊 Network Modes Comparison

| Mode | Access From | Setup | Speed | Cost |
|------|-------------|-------|-------|------|
| **Localhost** | Same computer | Easy | Fastest | Free |
| **Local Network** | Same WiFi | Medium | Fast | Free |
| **ngrok/Tunnel** | Anywhere | Easy | Medium | Free tier |
| **Fly.io Deploy** | Anywhere | Medium | Fast | ~$0-5/mo |

---

## 🎯 Recommended Setups

### Development (Solo)
```env
VITE_API_URL=http://localhost:3001
```
✅ Fastest, simplest

### Testing on Phone
```env
VITE_API_URL=http://192.168.1.100:3001
```
✅ No internet needed, local WiFi only

### Demo to Friends
```bash
ngrok http 5173
ngrok http 3001
```
✅ Share public URL, temporary

### Production
```bash
fly deploy
```
✅ Permanent, scalable, professional

---

## 🚀 Quick Commands

**Localhost only:**
```bash
npm run dev
```

**Local network:**
```bash
./run-local-network.sh
```

**Public demo:**
```bash
ngrok http 3001 &
ngrok http 5173 &
```

---

## 📝 Notes

- **Security**: Local network mode is only accessible on your WiFi
- **Performance**: Local network is fastest (no internet latency)
- **Tunnels**: ngrok/cloudflare are free but URLs change each session
- **Production**: Use Fly.io for permanent public deployment

---

**Need Help?**
- Check firewall settings
- Ensure same WiFi network
- Verify CORS configuration in `backend/.env`
- Test backend health: `http://YOUR_IP:3001/health`
