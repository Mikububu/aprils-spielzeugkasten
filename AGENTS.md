# April's Spielzeugkasten - Agent Documentation

## Project Overview
Multi-provider AI image/video generation platform with unified backend API and web UI.

**Current Active Provider:** fal.ai only (Replicate is disabled due to account issues)

**Goal:** Store generated media in Google Drive instead of returning base64

## API Keys & Configuration

### Backend URL
```
https://aprils-spielzeugkasten-backend.fly.dev/
```

### Providers Configuration
| Provider | Status | Notes |
|----------|--------|-------|
| **fal.ai** | ACTIVE | Stable Diffusion, fully working |
| Replicate | DISABLED | Account has rate limit issues |
| Google (Veo 3) | WAITING | Needs billing/quota approval |
| OpenRouter | TESTING | Gemini 2.5 Flash, free but slow |

### fal.ai Configuration
```bash
FALAI_API_KEY=b601338b-50fe-452d-8506-600df8180867:c818db07a93fef1d57bd9af8716fd4e1
```
- Model: `fal-ai/flux-dev` (text-to-image)
- Video: `fal-ai/stable-video-diffusion`
- Image-to-Image: Supported via `fal-ai/flux-dev/image-to-image`

### OpenRouter Configuration (if needed later)
```bash
OPENROUTER_API_KEY=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
```
- Model: `google/gemini-2.5-flash-image`
- **IMPORTANT:** Text-to-image ONLY, does NOT support image-to-image
- Free to use but slower than fal.ai

## Google Drive Storage Integration (TODO)

**Folder:** https://drive.google.com/drive/folders/1CMNHy1qWJRawFGfbVL6NBOmvugV_KoEO

### What Needs to Be Done
1. Enable Google Drive API in Google Cloud project `spielzeugkasten`
2. Create Service Account with Drive access
3. Download Service Account JSON credentials
4. Share the Drive folder with Service Account email
5. Implement `drive.ts` provider module to:
   - Upload base64 images/videos to Drive
   - Return shareable Drive links instead of base64
   - Organize by date/provider type

### Service Account Setup Steps
1. Go to: https://console.cloud.google.com/apis/enable/drive?project=spielzeugkasten
2. Enable Google Drive API
3. Go to: https://console.cloud.google.com/iam-admin/serviceaccounts?project=spielzeugkasten
4. Create Service Account with role "Drive API"
5. Download JSON key
6. Share folder `1CMNHy1qWJRawFGfbVL6NBOmvugV_KoEO` with the Service Account email

### Files to Modify
- `backend/src/providers/drive.ts` - NEW (Drive upload logic)
- `backend/src/providers/index.ts` - Register Drive provider
- `backend/.env` - Add `GOOGLE_SERVICE_ACCOUNT_KEY` JSON content
- Frontend - Update to display Drive links instead of base64 images

## Frontend URL
```
http://localhost:5173 (dev)
https://aprils-spielzeugkasten.fly.dev (prod - not yet deployed)
```

## Common Issues

### "Cannot read image.png - model does not support image input"
- This means you're trying image-to-image with a text-to-image only model
- fal.ai supports image-to-image via `fal-ai/flux-dev/image-to-image`
- OpenRouter/Gemini does NOT support image-to-image

### Replicate "stuck prediction" error
- Account has a stuck prediction blocking new ones
- Support ticket submitted, no ETA
- For now, use fal.ai only

## Commands

### Deploy Backend
```bash
cd backend
npm run build && fly deploy -a aprils-spielzeugkasten-backend
```

### Test Local
```bash
cd backend
export FALAI_API_KEY=...
npm run dev
```

### Test API
```bash
# Test fal.ai
curl -X POST https://aprils-spielzeugkasten-backend.fly.dev/api/generate \
  -H "Content-Type: application/json" \
  -d '{"provider":"falai","type":"image","prompt":"a cat"}'

# Test image-to-image
curl -X POST https://aprils-spielzeugkasten-backend.fly.dev/api/generate \
  -H "Content-Type: application/json" \
  -d '{"provider":"falai","type":"image","prompt":"make it blue","sourceImage":"BASE64_DATA"}'
```

## Next Steps (Priority)
1. ✅ fal.ai working
2. 🔄 Google Drive storage (blocked on Service Account setup)
3. ⏳ Enable Replicate later (waiting on support)
4. ⏳ Enable Google Veo 3 (waiting on quota approval)
