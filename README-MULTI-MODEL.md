# April's Spielzeugkasten - Multi-Model Edition

🎨 **Independent AI Image & Video Generation Platform**

Generate images and videos using multiple AI providers including Google (Imagen 3, Veo 3.1), Minimax, Runpod (uncensored), and more!

## 🚀 Features

- **Multiple AI Providers**: Google, Minimax, Runpod (self-hosted uncensored models)
- **Uncensored Option**: Deploy your own models on Runpod without content restrictions
- **Image Generation**: Text-to-image, image-to-image, multi-image blending
- **Video Generation**: Text-to-video, image-to-video, extended videos
- **Style Presets**: Customizable art styles (claymation, linocut, realistic, anime, etc.)
- **Cloud Storage**: Firebase integration for saving creations
- **Local Gallery**: IndexedDB for offline storage
- **Provider Switching**: Easily switch between different AI models

## 📋 Prerequisites

- Node.js 20+
- API keys for your chosen providers
- (Optional) Runpod account for uncensored models
- (Optional) Fly.io account for backend deployment

## 🛠️ Installation

### 1. Clone and Install Dependencies

```bash
# Frontend
npm install

# Backend
cd backend
npm install
```

### 2. Configure Environment Variables

**Frontend** (`.env`):
```env
VITE_API_URL=http://localhost:3001
```

**Backend** (`backend/.env`):
```env
PORT=3001
NODE_ENV=development

# Google Gemini (Imagen 3 + Veo 3.1)
GOOGLE_API_KEY=your_google_api_key

# Minimax (Chinese AI - less censored)
MINIMAX_API_KEY=your_minimax_api_key
MINIMAX_GROUP_ID=your_minimax_group_id

# Runpod (Fully uncensored self-hosted)
RUNPOD_API_KEY=your_runpod_api_key
RUNPOD_IMAGE_ENDPOINT=https://api.runpod.ai/v2/your-image-endpoint
RUNPOD_VIDEO_ENDPOINT=https://api.runpod.ai/v2/your-video-endpoint

ALLOWED_ORIGINS=http://localhost:5173
```

### 3. Run Locally

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

Visit: `http://localhost:5173`

## 🌐 Deployment

### Deploy Backend to Fly.io

1. **Install Fly CLI**:
```bash
curl -L https://fly.io/install.sh | sh
```

2. **Login**:
```bash
fly auth login
```

3. **Create App**:
```bash
cd backend
fly apps create aprils-toybox-backend
```

4. **Set Secrets**:
```bash
fly secrets set GOOGLE_API_KEY="your_key"
fly secrets set MINIMAX_API_KEY="your_key"
fly secrets set MINIMAX_GROUP_ID="your_id"
fly secrets set RUNPOD_API_KEY="your_key"
fly secrets set RUNPOD_IMAGE_ENDPOINT="your_endpoint"
fly secrets set RUNPOD_VIDEO_ENDPOINT="your_endpoint"
fly secrets set ALLOWED_ORIGINS="https://your-frontend.com"
```

5. **Deploy**:
```bash
fly deploy
```

### Deploy Runpod Endpoints

See `/backend/runpod/README.md` for detailed Runpod deployment instructions.

**Quick Start:**

1. Build Docker images:
```bash
cd backend/runpod
docker build -f Dockerfile.image -t your-username/toybox-image:latest .
docker build -f Dockerfile.video -t your-username/toybox-video:latest .
docker push your-username/toybox-image:latest
docker push your-username/toybox-video:latest
```

2. Create endpoints on Runpod.io dashboard

3. Update backend with endpoint URLs

## 🔑 Getting API Keys

### Google Gemini API
1. Go to [https://ai.google.dev/](https://ai.google.dev/)
2. Get API key from Google AI Studio
3. Note: Requires paid account for video generation

### Minimax API
1. Visit [https://www.minimax.chat/](https://www.minimax.chat/)
2. Sign up (may require Chinese phone or international workaround)
3. Get API key and Group ID from dashboard

### Runpod API
1. Go to [https://runpod.io](https://runpod.io)
2. Sign up and add credits
3. Create serverless endpoints (see `/backend/runpod/README.md`)
4. Copy API key and endpoint IDs

## 🎨 Usage

1. **Select AI Provider**: Choose from available models (Google, Minimax, Runpod)
2. **Upload Reference Images** (optional): Add source images for img2img or img2video
3. **Choose Style**: Select from presets or create custom styles
4. **Generate Image**: Enter prompt and click "SCULPT"
5. **Generate Video**: Add animation description and click video button
6. **Save**: Login to save to Firebase, or use local storage

## 🔓 Uncensored Generation

For fully uncensored generation:

1. **Use Runpod provider** with self-hosted models
2. Deploy custom Stable Diffusion/AnimateDiff without safety filters
3. No content restrictions - full creative freedom
4. See `/backend/runpod/` for deployment scripts

## 💰 Cost Comparison

| Provider | Image Cost | Video Cost | Censored |
|----------|------------|------------|----------|
| Google | ~$0.04 | ~$0.24 | Configurable |
| Minimax | ~$0.02 | ~$0.15 | Less strict |
| Runpod | ~$0.01 | ~$0.10 | Uncensored |

*Costs are estimates. Runpod costs depend on GPU pricing.

## 🏗️ Architecture

```
Frontend (Vite + TypeScript)
    ↓
Backend API (Express + TypeScript)
    ├── Google Provider (Imagen 3 + Veo 3.1)
    ├── Minimax Provider (Chinese AI)
    └── Runpod Provider (Self-hosted SDXL + AnimateDiff)
```

## 🛠️ Adding New Providers

1. Create new provider class in `/backend/src/providers/`
2. Extend `BaseModelProvider`
3. Implement `generateImage()` and `generateVideo()` 
4. Register in `/backend/src/providers/index.ts`
5. Update frontend model colors in `/src/index-multi-model.tsx`

Example:
```typescript
export class CustomProvider extends BaseModelProvider {
  async generateImage(request: GenerationRequest): Promise<GenerationResponse> {
    // Your implementation
  }
  
  async generateVideo(request: GenerationRequest): Promise<GenerationResponse> {
    // Your implementation
  }
}
```

## 📝 API Documentation

### GET `/api/providers`
Get available AI providers and their capabilities.

### POST `/api/generate`
Generate image or video.

**Request:**
```json
{
  "prompt": "A cute character",
  "provider": "minimax",
  "type": "image",
  "aspectRatio": "16:9",
  "safetyLevel": "minimal"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "mediaBase64": "...",
    "mimeType": "image/png",
    "provider": "minimax",
    "cost": 0.02
  }
}
```

## 🐛 Troubleshooting

**No providers available:**
- Check backend `.env` file has API keys
- Verify backend is running on correct port
- Check browser console for connection errors

**502 errors on Fly.io:**
- Verify secrets are set: `fly secrets list`
- Check logs: `fly logs`
- Ensure CORS origins are configured

**Runpod timeout:**
- Increase timeout in Runpod dashboard
- Check GPU availability
- Reduce inference steps

## 📚 Documentation

- [Deployment Guide](/backend/DEPLOYMENT.md)
- [Runpod Setup](/backend/runpod/README.md)
- [API Reference](API.md) (create if needed)

## 🤝 Contributing

This project is independent and extensible. Feel free to:
- Add new AI providers
- Improve UI/UX
- Add new style presets
- Optimize costs

## 📄 License

MIT

## 🙏 Acknowledgments

- Google Gemini (Imagen 3, Veo 3.1)
- Minimax AI
- Stability AI (Stable Diffusion)
- Runpod (Serverless GPU infrastructure)

---

**Made independent from vendor lock-in** 🎉
