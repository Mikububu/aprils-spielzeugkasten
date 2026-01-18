"""
Runpod Handler for Uncensored Image Generation
Using Stable Diffusion XL or Flux
"""

import runpod
import torch
import base64
from io import BytesIO
from PIL import Image

# Check if Flux is available, otherwise use SDXL
try:
    from diffusers import FluxPipeline
    MODEL_TYPE = "flux"
    MODEL_NAME = "black-forest-labs/FLUX.1-dev"
except:
    from diffusers import StableDiffusionXLPipeline
    MODEL_TYPE = "sdxl"
    MODEL_NAME = "stabilityai/stable-diffusion-xl-base-1.0"

print(f"Loading {MODEL_TYPE} model: {MODEL_NAME}")

# Initialize pipeline at startup
if MODEL_TYPE == "flux":
    pipe = FluxPipeline.from_pretrained(
        MODEL_NAME,
        torch_dtype=torch.float16
    ).to("cuda")
else:
    pipe = StableDiffusionXLPipeline.from_pretrained(
        MODEL_NAME,
        torch_dtype=torch.float16,
        variant="fp16",
        use_safetensors=True
    ).to("cuda")

# DISABLE SAFETY CHECKER FOR UNCENSORED OUTPUT
pipe.safety_checker = None
if hasattr(pipe, 'requires_safety_checker'):
    pipe.requires_safety_checker = False

print(f"✓ Model loaded successfully - Safety checker: DISABLED")


def handler(event):
    """
    Handle image generation requests
    
    Expected input:
    {
        "prompt": str,
        "negative_prompt": str (optional),
        "width": int (default: 1024),
        "height": int (default: 1024),
        "num_inference_steps": int (default: 30),
        "guidance_scale": float (default: 7.5),
        "image": str (optional base64 for img2img),
        "strength": float (optional, for img2img, default: 0.75)
    }
    """
    try:
        input_data = event.get("input", {})
        
        prompt = input_data.get("prompt", "")
        if not prompt:
            return {"error": "Prompt is required"}
        
        negative_prompt = input_data.get("negative_prompt", "")
        width = input_data.get("width", 1024)
        height = input_data.get("height", 1024)
        num_inference_steps = input_data.get("num_inference_steps", 30)
        guidance_scale = input_data.get("guidance_scale", 7.5)
        
        # Image-to-image mode
        if "image" in input_data:
            # Decode base64 image
            image_data = input_data["image"]
            if "base64," in image_data:
                image_data = image_data.split("base64,")[1]
            
            image_bytes = base64.b64decode(image_data)
            init_image = Image.open(BytesIO(image_bytes)).convert("RGB")
            
            strength = input_data.get("strength", 0.75)
            
            # Generate image-to-image
            if MODEL_TYPE == "sdxl":
                from diffusers import StableDiffusionXLImg2ImgPipeline
                img2img_pipe = StableDiffusionXLImg2ImgPipeline(**pipe.components)
                result = img2img_pipe(
                    prompt=prompt,
                    negative_prompt=negative_prompt,
                    image=init_image,
                    strength=strength,
                    num_inference_steps=num_inference_steps,
                    guidance_scale=guidance_scale
                )
            else:
                # Flux doesn't have img2img in the same way, use strength parameter
                result = pipe(
                    prompt=prompt,
                    image=init_image,
                    strength=strength,
                    num_inference_steps=num_inference_steps,
                    guidance_scale=guidance_scale
                )
        else:
            # Text-to-image mode
            result = pipe(
                prompt=prompt,
                negative_prompt=negative_prompt if MODEL_TYPE == "sdxl" else None,
                width=width,
                height=height,
                num_inference_steps=num_inference_steps,
                guidance_scale=guidance_scale
            )
        
        # Get the generated image
        image = result.images[0]
        
        # Convert to base64
        buffered = BytesIO()
        image.save(buffered, format="PNG", optimize=True)
        img_base64 = base64.b64encode(buffered.getvalue()).decode()
        
        return {
            "image_base64": img_base64,
            "model": MODEL_TYPE,
            "prompt": prompt,
            "width": image.width,
            "height": image.height
        }
        
    except Exception as e:
        return {"error": str(e)}


# Start the serverless handler
runpod.serverless.start({"handler": handler})
