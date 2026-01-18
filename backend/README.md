# April's Toybox Backend

Multi-model backend API supporting Google, Minimax, Runpod, and more.

## Features

- **Provider Abstraction**: Easy to add new AI providers
- **Multiple Models**: Support for various image and video generation models
- **Safety Controls**: Configurable content filtering
- **Cost Tracking**: Built-in cost estimation per provider
- **RESTful API**: Simple HTTP endpoints

## Quick Start

```bash
npm install
cp .env.template .env
# Edit .env with your API keys
npm run dev
```

## API Endpoints

### GET /health
Health check endpoint

### GET /api/providers
List available providers and capabilities

### POST /api/generate
Generate image or video

**Example Request:**
```bash
curl -X POST http://localhost:3001/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A beautiful landscape",
    "provider": "minimax",
    "type": "image",
    "aspectRatio": "16:9"
  }'
```

## Supported Providers

### Google (Imagen 3 + Veo 3.1)
- Image: Imagen 3.0
- Video: Veo 3.1
- Safety: Configurable (minimal/default/strict)
- Cost: $0.04/image, $0.24/video

### Minimax
- Image: Abab 6.5
- Video: Video-01
- Safety: Less restrictive
- Cost: $0.02/image, $0.15/video

### Runpod (Self-hosted)
- Image: SDXL / Flux
- Video: AnimateDiff / CogVideoX
- Safety: Fully uncensored
- Cost: ~$0.01/image, ~$0.10/video (varies by GPU)

## Adding Custom Providers

1. Create new file in `src/providers/your-provider.ts`
2. Extend `BaseModelProvider`
3. Implement required methods
4. Register in `src/providers/index.ts`

See existing providers for examples.

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for Fly.io and Runpod deployment instructions.

## Environment Variables

Required:
- At least one provider API key (GOOGLE_API_KEY, MINIMAX_API_KEY, or RUNPOD_API_KEY)

Optional:
- PORT (default: 3001)
- NODE_ENV (development/production)
- ALLOWED_ORIGINS (comma-separated CORS origins)

## Testing

```bash
# Unit tests (if you add them)
npm test

# Manual API testing
npm run dev
# Then use curl or Postman to test endpoints
```

## License

MIT
