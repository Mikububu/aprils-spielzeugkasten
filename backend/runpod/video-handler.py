"""
Runpod Handler for Uncensored Video Generation
Using CogVideoX or AnimateDiff
"""

import runpod
import torch
import base64
from io import BytesIO
from PIL import Image
import imageio
import numpy as np

# Use CogVideoX for better quality
try:
    from diffusers import CogVideoXPipeline, CogVideoXImageToVideoPipeline
    MODEL_TYPE = "cogvideox"
    MODEL_NAME = "THUDM/CogVideoX-5b"
    print(f"Loading CogVideoX model: {MODEL_NAME}")
    
    pipe = CogVideoXPipeline.from_pretrained(
        MODEL_NAME,
        torch_dtype=torch.float16
    ).to("cuda")
    
    # For image-to-video
    i2v_pipe = CogVideoXImageToVideoPipeline.from_pretrained(
        MODEL_NAME,
        torch_dtype=torch.float16
    ).to("cuda")
    
except Exception as e:
    print(f"CogVideoX not available, falling back to AnimateDiff: {e}")
    from diffusers import AnimateDiffPipeline, MotionAdapter, DDIMScheduler
    MODEL_TYPE = "animatediff"
    
    adapter = MotionAdapter.from_pretrained(
        "guoyww/animatediff-motion-adapter-v1-5-2",
        torch_dtype=torch.float16
    )
    pipe = AnimateDiffPipeline.from_pretrained(
        "runwayml/stable-diffusion-v1-5",
        motion_adapter=adapter,
        torch_dtype=torch.float16
    ).to("cuda")
    
    scheduler = DDIMScheduler.from_pretrained(
        "runwayml/stable-diffusion-v1-5",
        subfolder="scheduler",
        clip_sample=False,
        timestep_spacing="linspace",
        steps_offset=1
    )
    pipe.scheduler = scheduler
    i2v_pipe = None

# DISABLE SAFETY CHECKER
if hasattr(pipe, 'safety_checker'):
    pipe.safety_checker = None
if hasattr(pipe, 'requires_safety_checker'):
    pipe.requires_safety_checker = False

print(f"✓ Video model loaded - Safety checker: DISABLED")


def frames_to_video_base64(frames, fps=8):
    """Convert frame list to base64 encoded MP4"""
    buffered = BytesIO()
    
    # Convert PIL images to numpy arrays if needed
    if hasattr(frames[0], 'numpy'):
        frames = [np.array(f) for f in frames]
    
    # Write video to buffer
    writer = imageio.get_writer(buffered, format='mp4', fps=fps, codec='libx264')
    for frame in frames:
        writer.append_data(np.array(frame))
    writer.close()
    
    # Encode to base64
    video_base64 = base64.b64encode(buffered.getvalue()).decode()
    return video_base64


def handler(event):
    """
    Handle video generation requests
    
    Expected input:
    {
        "prompt": str,
        "num_frames": int (default: 40),
        "num_inference_steps": int (default: 25),
        "guidance_scale": float (default: 7.5),
        "fps": int (default: 8),
        "image": str (optional base64 for img2video)
    }
    """
    try:
        input_data = event.get("input", {})
        
        prompt = input_data.get("prompt", "")
        if not prompt:
            return {"error": "Prompt is required"}
        
        num_frames = input_data.get("num_frames", 40)
        num_inference_steps = input_data.get("num_inference_steps", 25)
        guidance_scale = input_data.get("guidance_scale", 7.5)
        fps = input_data.get("fps", 8)
        
        # Image-to-video mode
        if "image" in input_data and i2v_pipe is not None:
            # Decode base64 image
            image_data = input_data["image"]
            if "base64," in image_data:
                image_data = image_data.split("base64,")[1]
            
            image_bytes = base64.b64decode(image_data)
            init_image = Image.open(BytesIO(image_bytes)).convert("RGB")
            
            # Generate image-to-video
            if MODEL_TYPE == "cogvideox":
                result = i2v_pipe(
                    prompt=prompt,
                    image=init_image,
                    num_frames=num_frames,
                    num_inference_steps=num_inference_steps,
                    guidance_scale=guidance_scale
                )
            else:
                result = pipe(
                    prompt=prompt,
                    image=init_image,
                    num_frames=num_frames,
                    num_inference_steps=num_inference_steps,
                    guidance_scale=guidance_scale
                )
            
            frames = result.frames[0]
        else:
            # Text-to-video mode
            result = pipe(
                prompt=prompt,
                num_frames=num_frames,
                num_inference_steps=num_inference_steps,
                guidance_scale=guidance_scale
            )
            
            frames = result.frames[0]
        
        # Convert frames to video
        video_base64 = frames_to_video_base64(frames, fps=fps)
        
        return {
            "video_base64": video_base64,
            "model": MODEL_TYPE,
            "prompt": prompt,
            "num_frames": len(frames),
            "fps": fps,
            "duration": len(frames) / fps
        }
        
    except Exception as e:
        import traceback
        return {
            "error": str(e),
            "traceback": traceback.format_exc()
        }


# Start the serverless handler
runpod.serverless.start({"handler": handler})
