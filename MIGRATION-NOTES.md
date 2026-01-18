# Migration Notes - From Google-Only to Multi-Model

## What Changed

### Before (Google AI Studio Only)
- Direct API calls from frontend to Google's services
- Only supported Imagen 3 and Veo 3.1
- Limited to Google's safety policies
- Tied to Google AI Studio ecosystem

### After (Multi-Model Backend)
- Backend API server handles all AI providers
- Support for Google, Minimax, Runpod, and extensible to more
- Choose censorship level per provider
- Independent infrastructure

---

## Architecture Changes

### Old Architecture
```
Frontend (index.tsx) 
    → @google/genai directly
    → Google Imagen 3 / Veo 3.1
```

### New Architecture
```
Frontend (src/index-multi-model.tsx)
    ↓
Backend API (Express)
    ├── Google Provider (Imagen 3 + Veo 3.1)
    ├── Minimax Provider (Chinese AI)
    ├── Runpod Provider (Self-hosted SDXL + AnimateDiff)
    └── [Easy to add more...]
```

---

## File Structure

### New Files
```
backend/
├── package.json               # Backend dependencies
├── tsconfig.json              # TypeScript config
├── fly.toml                   # Fly.io deployment
├── Dockerfile                 # Container build
├── DEPLOYMENT.md              # Deployment guide
├── README.md                  # Backend docs
├── .env.template              # Environment template
├── src/
│   ├── server.ts              # Express server
│   ├── types/models.ts        # TypeScript interfaces
│   └── providers/
│       ├── base.ts            # Base provider class
│       ├── google.ts          # Google implementation
│       ├── minimax.ts         # Minimax implementation
│       ├── runpod.ts          # Runpod implementation
│       └── index.ts           # Provider factory
└── runpod/
    ├── README.md              # Runpod deployment guide
    ├── image-handler.py       # SDXL handler
    ├── video-handler.py       # AnimateDiff handler
    ├── Dockerfile.image       # Image generation container
    └── Dockerfile.video       # Video generation container

src/
├── api/
│   └── client.ts              # API client for frontend
└── index-multi-model.tsx      # New multi-model frontend

README-MULTI-MODEL.md          # Updated documentation
QUICK-START.md                 # Quick start guide
.env.example                   # Frontend environment template
```

---

## Migration Steps for Existing Users

### If You're Using the Old Version

1. **Backup Your Data**
   - Export your gallery if needed
   - Save custom style presets

2. **Install New Backend**
   ```bash
   cd backend
   npm install
   cp .env.template .env
   # Add your API keys
   ```

3. **Update Frontend**
   - The old `index.tsx` still works with Google directly
   - To use new features, switch to `src/index-multi-model.tsx`

4. **Run Both Servers**
   - Backend: `cd backend && npm run dev` (port 3001)
   - Frontend: `npm run dev` (port 5173)

---

## Backward Compatibility

The original `index.tsx` still works and can be used as:
- Direct Google integration (no backend needed)
- Single-provider mode
- Simpler setup for Google-only users

To use the old version:
- Keep using the original `index.tsx`
- Set `API_KEY` environment variable
- Don't run the backend

---

## Benefits of Migration

### Flexibility
- ✅ Switch between providers easily
- ✅ Add new providers without frontend changes
- ✅ Mix and match models

### Cost Optimization
- ✅ Use cheaper providers for testing
- ✅ Use Google for best quality
- ✅ Use Runpod for uncensored content

### Independence
- ✅ Not tied to single vendor
- ✅ Self-host uncensored models
- ✅ Scale independently

### Safety Controls
- ✅ Choose your own content policies
- ✅ Fully uncensored option (Runpod)
- ✅ Or use strict filtering (Google strict mode)

---

## Provider Comparison

| Feature | Google | Minimax | Runpod |
|---------|--------|---------|--------|
| Setup Complexity | Easy | Medium | Hard |
| Cost (Image) | $0.04 | $0.02 | $0.01 |
| Cost (Video) | $0.24 | $0.15 | $0.10 |
| Quality | Excellent | Good | Excellent |
| Censorship | Configurable | Less strict | None |
| Speed | Fast | Fast | Variable |
| Requires Setup | API Key | API Key | Self-hosted |

---

## Future Additions

Easy to add:
- **Replicate**: Popular model hosting
- **Stability AI**: Direct Stable Diffusion API
- **OpenAI DALL-E**: Image generation
- **Custom Models**: Your own fine-tuned models

---

## Support

Questions? Issues?
- Check [QUICK-START.md](QUICK-START.md)
- Read [backend/DEPLOYMENT.md](backend/DEPLOYMENT.md)
- Review [backend/runpod/README.md](backend/runpod/README.md)

---

**You're now independent! 🎉**
