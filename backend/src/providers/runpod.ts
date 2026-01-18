import axios from 'axios';
import { BaseModelProvider } from './base.js';
import { GenerationRequest, GenerationResponse, ModelCapabilities, ProviderConfig } from '../types/models.js';

export class RunpodProvider extends BaseModelProvider {
  private imageEndpoint: string;
  private videoEndpoint: string;

  constructor(config: ProviderConfig & { imageEndpoint: string; videoEndpoint: string }) {
    const capabilities: ModelCapabilities = {
      provider: 'runpod',
      name: 'Runpod (Uncensored Self-Hosted)',
      supportsImage: true,
      supportsVideo: true,
      supportsImageToImage: true,
      supportsImageToVideo: true,
      supportsMultipleImages: true,
      supportsSafetyControls: false,
      maxImageResolution: '2048x2048',
      maxVideoDuration: 10,
      censored: false, // Fully uncensored
      costPerImage: 0.01, // Depends on your Runpod pricing
      costPerVideo: 0.10
    };

    super(config, capabilities);
    this.imageEndpoint = config.imageEndpoint;
    this.videoEndpoint = config.videoEndpoint;
  }

  async generateImage(request: GenerationRequest): Promise<GenerationResponse> {
    try {
      const payload: any = {
        input: {
          prompt: request.prompt,
          negative_prompt: request.negativePrompt || '',
          width: 1024,
          height: 1024,
          num_inference_steps: 30,
          guidance_scale: 7.5
        }
      };

      // Adjust dimensions based on aspect ratio
      if (request.aspectRatio === '16:9') {
        payload.input.width = 1344;
        payload.input.height = 768;
      } else if (request.aspectRatio === '9:16') {
        payload.input.width = 768;
        payload.input.height = 1344;
      }

      // Image-to-image mode
      if (request.sourceImage) {
        payload.input.image = `data:image/png;base64,${request.sourceImage}`;
        payload.input.strength = 0.75; // How much to transform the input image
      }

      // Run the job
      const response = await axios.post(`${this.imageEndpoint}/run`, payload, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const jobId = response.data.id;

      // Poll for completion
      let attempts = 0;
      let result = null;

      while (attempts < 60 && !result) {
        await new Promise(resolve => setTimeout(resolve, 2000));

        const statusResponse = await axios.get(`${this.imageEndpoint}/status/${jobId}`, {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        });

        if (statusResponse.data.status === 'COMPLETED') {
          result = statusResponse.data.output;
          break;
        } else if (statusResponse.data.status === 'FAILED') {
          return { success: false, error: 'Runpod image generation failed' };
        }

        attempts++;
      }

      if (result && result.image_base64) {
        return {
          success: true,
          data: {
            mediaBase64: result.image_base64,
            mimeType: 'image/png',
            provider: 'runpod',
            cost: this.capabilities.costPerImage
          }
        };
      }

      return { success: false, error: 'Image generation timed out' };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Runpod image generation failed'
      };
    }
  }

  async generateVideo(request: GenerationRequest): Promise<GenerationResponse> {
    try {
      const payload: any = {
        input: {
          prompt: request.prompt,
          num_frames: (request.videoConfig?.duration || 5) * 8, // Assuming 8fps
          num_inference_steps: 25
        }
      };

      // Image-to-video mode
      if (request.sourceImage) {
        payload.input.image = `data:image/png;base64,${request.sourceImage}`;
      }

      const response = await axios.post(`${this.videoEndpoint}/run`, payload, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const jobId = response.data.id;

      // Poll for completion
      let attempts = 0;
      let result = null;

      while (attempts < 120 && !result) {
        await new Promise(resolve => setTimeout(resolve, 5000));

        const statusResponse = await axios.get(`${this.videoEndpoint}/status/${jobId}`, {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        });

        if (statusResponse.data.status === 'COMPLETED') {
          result = statusResponse.data.output;
          break;
        } else if (statusResponse.data.status === 'FAILED') {
          return { success: false, error: 'Runpod video generation failed' };
        }

        attempts++;
      }

      if (result && result.video_base64) {
        return {
          success: true,
          data: {
            mediaBase64: result.video_base64,
            mimeType: 'video/mp4',
            provider: 'runpod',
            cost: this.capabilities.costPerVideo
          }
        };
      }

      return { success: false, error: 'Video generation timed out' };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Runpod video generation failed'
      };
    }
  }
}
