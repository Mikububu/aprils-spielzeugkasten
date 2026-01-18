# Deployment Guide for April's Toybox Backend

This guide covers deploying the multi-model backend to Fly.io and setting up Runpod endpoints.

## Prerequisites

- Node.js 20+
- Fly.io CLI (`curl -L https://fly.io/install.sh | sh`)
- Runpod account
- API keys for your chosen providers (Google, Minimax, etc.)

## 1. Deploy to Fly.io

### Initial Setup

1. **Install Fly CLI** (if not already installed):
```bash
curl -L https://fly.io/install.sh | sh
```

2. **Login to Fly.io**:
```bash
fly auth login
```

3. **Create a new app**:
```bash
cd backend
fly apps create aprils-toybox-backend
```

### Set Environment Variables

```bash
# Set your API keys as secrets
fly secrets set GOOGLE_API_KEY="your_google_api_key"
fly secrets set MINIMAX_API_KEY="your_minimax_api_key"
fly secrets set MINIMAX_GROUP_ID="your_minimax_group_id"
fly secrets set RUNPOD_API_KEY="your_runpod_api_key"
fly secrets set RUNPOD_IMAGE_ENDPOINT="https://api.runpod.ai/v2/your-image-endpoint"
fly secrets set RUNPOD_VIDEO_ENDPOINT="https://api.runpod.ai/v2/your-video-endpoint"
fly secrets set ALLOWED_ORIGINS="https://your-frontend-domain.com"
```

### Deploy

```bash
fly deploy
```

### Monitor

```bash
# View logs
fly logs

# Check status
fly status

# Open in browser
fly open
```

## 2. Set Up Runpod Endpoints

Runpod allows you to run uncensored models on serverless GPU infrastructure.

### For Image Generation (Stable Diffusion XL / Flux)

1. **Go to Runpod.io** and create an account
2. **Navigate to Serverless** → **Templates**
3. **Choose a template**:
   - **Stable Diffusion XL** (uncensored)
   - **Flux Dev** (uncensored)
   - Or create custom template

4. **Create a custom Runpod handler** (example below):

**handler.py** (for SDXL):
```python
import runpod
from diffusers import StableDiffusionXLPipeline
import torch
import base64
from io import BytesIO

# Load model once at startup
pipe = StableDiffusionXLPipeline.from_pretrained(
    "stabilityai/stable-diffusion-xl-base-1.0",
    torch_dtype=torch.float16,
    variant="fp16"
).to("cuda")

# Disable safety checker for uncensored output
pipe.safety_checker = None

def handler(event):
    input_data = event["input"]
    
    prompt = input_data.get("prompt", "")
    negative_prompt = input_data.get("negative_prompt", "")
    width = input_data.get("width", 1024)
    height = input_data.get("height", 1024)
    num_inference_steps = input_data.get("num_inference_steps", 30)
    guidance_scale = input_data.get("guidance_scale", 7.5)
    
    # Generate image
    image = pipe(
        prompt=prompt,
        negative_prompt=negative_prompt,
        width=width,
        height=height,
        num_inference_steps=num_inference_steps,
        guidance_scale=guidance_scale
    ).images[0]
    
    # Convert to base64
    buffered = BytesIO()
    image.save(buffered, format="PNG")
    img_base64 = base64.b64encode(buffered.getvalue()).decode()
    
    return {"image_base64": img_base64}

runpod.serverless.start({"handler": handler})
```

5. **Deploy to Runpod**:
   - Build Docker image
   - Push to Docker Hub or Runpod's registry
   - Create endpoint from template
   - Copy the endpoint URL

### For Video Generation (AnimateDiff / CogVideoX)

1. **Use AnimateDiff or CogVideoX template**
2. **Create custom handler**:

**video_handler.py** (for AnimateDiff):
```python
import runpod
from diffusers import AnimateDiffPipeline, MotionAdapter
import torch
import base64
from io import BytesIO
import imageio

adapter = MotionAdapter.from_pretrained(
    "guoyww/animatediff-motion-adapter-v1-5-2"
)
pipe = AnimateDiffPipeline.from_pretrained(
    "runwayml/stable-diffusion-v1-5",
    motion_adapter=adapter,
    torch_dtype=torch.float16
).to("cuda")

# Disable safety checker
pipe.safety_checker = None

def handler(event):
    input_data = event["input"]
    
    prompt = input_data.get("prompt", "")
    num_frames = input_data.get("num_frames", 40)
    
    # Generate video frames
    frames = pipe(
        prompt=prompt,
        num_frames=num_frames,
        num_inference_steps=25
    ).frames[0]
    
    # Save as video
    buffered = BytesIO()
    imageio.mimsave(buffered, frames, format='mp4', fps=8)
    video_base64 = base64.b64encode(buffered.getvalue()).decode()
    
    return {"video_base64": video_base64}

runpod.serverless.start({"handler": handler})
```

3. **Deploy video endpoint**
4. **Copy endpoint URL**

### Update Backend Configuration

Add your Runpod endpoints to your Fly.io secrets:

```bash
fly secrets set RUNPOD_IMAGE_ENDPOINT="https://api.runpod.ai/v2/YOUR_IMAGE_ENDPOINT_ID"
fly secrets set RUNPOD_VIDEO_ENDPOINT="https://api.runpod.ai/v2/YOUR_VIDEO_ENDPOINT_ID"
```

## 3. Get Minimax API Key

1. Go to [Minimax.chat](https://www.minimax.chat/)
2. Create an account (requires Chinese phone number or international sign-up)
3. Get your API key and Group ID
4. Add to Fly.io secrets:

```bash
fly secrets set MINIMAX_API_KEY="your_key"
fly secrets set MINIMAX_GROUP_ID="your_group_id"
```

## 4. Testing

Test your deployment:

```bash
# Test health endpoint
curl https://aprils-toybox-backend.fly.dev/health

# Test provider list
curl https://aprils-toybox-backend.fly.dev/api/providers

# Test image generation
curl -X POST https://aprils-toybox-backend.fly.dev/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A cute clay character",
    "provider": "minimax",
    "type": "image",
    "aspectRatio": "1:1"
  }'
```

## 5. Frontend Configuration

Update your frontend's API endpoint:

```typescript
const API_BASE_URL = 'https://aprils-toybox-backend.fly.dev';
```

## Scaling

Fly.io will auto-scale based on traffic. To configure scaling:

```bash
# Set minimum and maximum machines
fly scale count 1 --max-per-region 5

# Adjust memory
fly scale memory 1024
```

## Cost Optimization

- Use Fly.io's auto-stop/auto-start for low traffic
- Runpod charges per GPU-second, only when running
- Minimax is cheaper than Google for most operations
- Consider using different providers for different use cases

## Monitoring

```bash
# View metrics
fly dashboard

# Monitor logs in real-time
fly logs -a aprils-toybox-backend
```

## Troubleshooting

- **502 errors**: Check if secrets are set correctly
- **Timeout errors**: Increase timeout in fly.toml
- **Memory issues**: Scale up memory with `fly scale memory`
- **Runpod errors**: Check endpoint status in Runpod dashboard
