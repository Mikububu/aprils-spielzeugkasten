# Fix: ERR_CONNECTION_REFUSED

If you see **"ERR_CONNECTION_REFUSED"** - it means the servers aren't running yet.

---

## ✅ Solution: Start the Servers

Run this ONE command:

```bash
./START.sh
```

This will:
1. ✅ Check your configuration
2. ✅ Start the backend server
3. ✅ Start the frontend server
4. ✅ Show you the Chrome address
5. ✅ Keep both running until you press Ctrl+C

**Wait 10-20 seconds** for both servers to start, then open the address in Chrome.

---

## 📋 Manual Method (If Script Doesn't Work)

If the script fails, start them manually:

### Terminal 1 - Backend

```bash
cd backend
npm run dev
```

**Wait until you see:** `Ready to generate! 🎨🎬`

### Terminal 2 - Frontend

Open a **NEW terminal** window:

```bash
npm run dev
```

**Wait until you see:** `Local: http://...` and `Network: http://...`

### Then Open Chrome

Go to: `http://172.20.10.4:5173`

---

## 🔍 Troubleshooting

### "Backend failed to start"

**Problem:** Missing API key

**Fix:** Edit `backend/.env` and add:
```env
GOOGLE_API_KEY=your_actual_key_here
```

Get key from: https://aistudio.google.com/

### "Frontend failed to start"

**Problem:** Port 5173 already in use

**Fix:** Kill existing process:
```bash
# macOS/Linux
lsof -ti:5173 | xargs kill -9

# Windows
netstat -ano | findstr :5173
# Then: taskkill /PID <PID> /F
```

### "Still connection refused"

**Check if servers are running:**
```bash
# Check backend
curl http://172.20.10.4:3001/health

# Should see: {"status":"healthy"...}
```

If backend works, the problem is frontend.

### "npm: command not found"

**Problem:** Node.js not installed

**Fix:** Install Node.js:
```bash
# macOS
brew install node

# Or download from: https://nodejs.org/
```

Then run `./install.sh` again.

---

## ⚡ Quick Check

Before opening Chrome, verify servers are running:

```bash
# Check processes
ps aux | grep node

# Should see 2 node processes running
```

---

## 🎯 Common Mistakes

❌ Only starting one server (need both!)  
❌ Not waiting for servers to fully start  
❌ Forgetting to add API key to backend/.env  
❌ Opening Chrome before servers are ready  

✅ Run `./START.sh` and wait 20 seconds  
✅ Then open Chrome  

---

## 📝 Summary

**ERR_CONNECTION_REFUSED** = Servers not running

**Solution:**
```bash
./START.sh
# Wait 20 seconds
# Open Chrome: http://172.20.10.4:5173
```

That's it!
