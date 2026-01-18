# Runpod Deployment for Uncensored Models

This directory contains handlers and Dockerfiles for deploying uncensored image and video generation models on Runpod.

## Models Included

### Image Generation
- **Stable Diffusion XL** - High quality, uncensored
- **Flux.1-dev** - Cutting edge, fully uncensored

### Video Generation
- **CogVideoX-5b** - State-of-the-art video generation
- **AnimateDiff** - Fallback for video generation

## Setup Instructions

### 1. Build and Push Docker Images

#### For Image Generation:
```bash
cd runpod
docker build -f Dockerfile.image -t your-dockerhub-username/toybox-image-gen:latest .
docker push your-dockerhub-username/toybox-image-gen:latest
```

#### For Video Generation:
```bash
docker build -f Dockerfile.video -t your-dockerhub-username/toybox-video-gen:latest .
docker push your-dockerhub-username/toybox-video-gen:latest
```

### 2. Create Runpod Endpoints

1. Go to [Runpod.io](https://runpod.io)
2. Click **Serverless** → **Deploy a New Endpoint**

#### Image Endpoint:
- **Name**: `toybox-image-gen`
- **Docker Image**: `your-dockerhub-username/toybox-image-gen:latest`
- **GPU Type**: RTX 3090 or A40 (recommended)
- **Container Disk**: 20 GB
- **Max Workers**: 3 (adjust based on budget)
- **Timeout**: 120 seconds
- **Active Workers**: 1 (for faster cold starts)

#### Video Endpoint:
- **Name**: `toybox-video-gen`
- **Docker Image**: `your-dockerhub-username/toybox-video-gen:latest`
- **GPU Type**: A40 or A100 (video generation needs more VRAM)
- **Container Disk**: 30 GB
- **Max Workers**: 2
- **Timeout**: 300 seconds
- **Active Workers**: 1

### 3. Get Your Endpoint URLs

After creating the endpoints, you'll get URLs like:
```
https://api.runpod.ai/v2/YOUR_IMAGE_ENDPOINT_ID
https://api.runpod.ai/v2/YOUR_VIDEO_ENDPOINT_ID
```

### 4. Configure Backend

Add these to your backend `.env`:
```
RUNPOD_API_KEY=your_runpod_api_key
RUNPOD_IMAGE_ENDPOINT=https://api.runpod.ai/v2/YOUR_IMAGE_ENDPOINT_ID
RUNPOD_VIDEO_ENDPOINT=https://api.runpod.ai/v2/YOUR_VIDEO_ENDPOINT_ID
```

Or set as Fly.io secrets:
```bash
fly secrets set RUNPOD_API_KEY="your_runpod_api_key"
fly secrets set RUNPOD_IMAGE_ENDPOINT="https://api.runpod.ai/v2/YOUR_IMAGE_ENDPOINT_ID"
fly secrets set RUNPOD_VIDEO_ENDPOINT="https://api.runpod.ai/v2/YOUR_VIDEO_ENDPOINT_ID"
```

## Testing Endpoints

### Test Image Generation:
```bash
curl -X POST "https://api.runpod.ai/v2/YOUR_IMAGE_ENDPOINT_ID/run" \
  -H "Authorization: Bearer YOUR_RUNPOD_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "prompt": "A beautiful landscape",
      "width": 1024,
      "height": 1024,
      "num_inference_steps": 30
    }
  }'
```

### Test Video Generation:
```bash
curl -X POST "https://api.runpod.ai/v2/YOUR_VIDEO_ENDPOINT_ID/run" \
  -H "Authorization: Bearer YOUR_RUNPOD_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "prompt": "A cat walking",
      "num_frames": 40,
      "num_inference_steps": 25
    }
  }'
```

## Cost Optimization

- **Active Workers**: Set to 0 for pure on-demand (coldest starts, lowest cost)
- **Max Workers**: Limit concurrent generations
- **Timeout**: Set appropriately to avoid stuck jobs
- **GPU Type**: Use cheaper GPUs for testing (RTX 3090 vs A100)

## Monitoring

View logs and metrics in the Runpod dashboard:
- Request count
- Average execution time
- GPU utilization
- Cost per request

## Troubleshooting

### Out of Memory Errors
- Use a GPU with more VRAM (A40 or A100)
- Reduce image size or video frames
- Enable model offloading in the handler

### Cold Start Times
- Increase "Active Workers" to keep GPUs warm
- Bake models into Docker image (increases image size)

### Timeout Errors
- Increase timeout in Runpod settings
- Reduce inference steps
- Use faster models (e.g., turbo variants)
