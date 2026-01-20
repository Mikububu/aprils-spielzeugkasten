import { fal } from '@fal-ai/client';
import { BaseModelProvider } from './base.js';
import { GenerationRequest, GenerationResponse, ModelCapabilities, ProviderConfig } from '../types/models.js';

export class FalAIProvider extends BaseModelProvider {
  private apiKey: string;

  constructor(config: ProviderConfig & { apiKey: string }) {
    const capabilities: ModelCapabilities = {
      provider: 'falai',
      name: 'fal.ai (FLUX)',
      supportsImage: true,
      supportsVideo: true,
      supportsImageToImage: true,
      supportsImageToVideo: false,
      supportsMultipleImages: false,
      supportsSafetyControls: false,
      maxImageResolution: '1024x1024',
      maxVideoDuration: 10,
      censored: true,
      costPerImage: 0.002,
      costPerVideo: 0.08
    };

    super(config, capabilities);
    this.apiKey = config.apiKey;
    fal.config({ credentials: this.apiKey });
  }

  async generateImage(request: GenerationRequest): Promise<GenerationResponse> {
    try {
      let fullPrompt = request.prompt;
      if (request.style && request.style !== 'NONE') {
        fullPrompt = `${request.prompt} ${request.style}`;
      }

      const model = request.sourceImage 
        ? 'fal-ai/flux-1/dev/image-to-image'  
        : 'fal-ai/flux-1/dev';

      const input: any = {
        prompt: fullPrompt,
        num_images: 1
      };

      if (request.seed && request.seed > 0) {
        input.seed = request.seed;
      }

      const aspectRatio = this.aspectRatioToFal(request.aspectRatio);
      if (aspectRatio !== '1:1') {
        input.aspect_ratio = aspectRatio;
      }

      if (request.sourceImage) {
        const parsedImage = this.parseDataUri(request.sourceImage);
        if (parsedImage) {
          input.image = {
            url: `data:${parsedImage.mimeType};base64,${parsedImage.data}`
          };
          input.strength = 0.7;
        }
      }

      console.log(`Calling fal.ai (${model})...`);

      const result = await fal.subscribe(model, { input });

      console.log('fal.ai response received');

      const images = this.extractImages(result.data);
      
      if (images.length > 0) {
        const imageUrl = images[0];
        console.log('Image generated successfully');
        
        return {
          success: true,
          data: {
            mediaUrl: imageUrl,
            mimeType: 'image/png',
            provider: 'falai',
            cost: this.capabilities.costPerImage,
            seed: request.seed || undefined
          }
        };
      }

      return { success: false, error: 'No image returned from fal.ai' };

    } catch (error: any) {
      console.error('fal.ai Image API error:', error.message);
      
      let errorMessage = 'Image generation failed';
      
      if (error.message?.includes('filtered') || error.message?.includes('NSFW')) {
        errorMessage = 'fal.ai blocked this request (possible content filtering). Try a different prompt or use Replicate (fully uncensored).';
      } else if (error.message?.includes('429')) {
        errorMessage = 'fal.ai quota exceeded. Try again later.';
      } else if (error.message?.includes('401')) {
        errorMessage = 'fal.ai authentication failed. Check API key.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return { success: false, error: errorMessage };
    }
  }

  async generateVideo(request: GenerationRequest): Promise<GenerationResponse> {
    try {
      console.log('fal.ai generateVideo called:', {
        prompt: request.prompt?.substring(0, 50),
        hasSourceImage: !!request.sourceImage
      });

      let fullPrompt = request.prompt;
      if (request.style && request.style !== 'NONE') {
        fullPrompt = `${request.style}\n\n${request.prompt}`;
      }

      const input: any = {
        prompt: fullPrompt,
        num_frames: 24,
        fps: 8
      };

      if (request.sourceImage) {
        const parsedImage = this.parseDataUri(request.sourceImage);
        if (parsedImage) {
          input.image = {
            url: `data:${parsedImage.mimeType};base64,${parsedImage.data}`
          };
        }
      }

      console.log('Calling fal.ai Video API...');

      const result = await fal.subscribe('fal-ai/stable-video-diffusion', { input });

      console.log('fal.ai video response received');

      const videos = this.extractVideos(result.data);
      
      if (videos.length > 0) {
        const videoUrl = videos[0];
        console.log('Video generated successfully');
        
        return {
          success: true,
          data: {
            mediaUrl: videoUrl,
            mimeType: 'video/mp4',
            provider: 'falai',
            cost: this.capabilities.costPerVideo
          }
        };
      }

      return { success: false, error: 'No video returned from fal.ai' };

    } catch (error: any) {
      console.error('fal.ai Video API error:', error.message);
      
      let errorMessage = 'Video generation failed';
      
      if (error.message?.includes('filtered') || error.message?.includes('NSFW')) {
        errorMessage = 'fal.ai blocked this request (possible content filtering). Try a different prompt or use Replicate (fully uncensored).';
      } else if (error.message?.includes('429')) {
        errorMessage = 'fal.ai quota exceeded. Try again later.';
      } else if (error.message?.includes('401')) {
        errorMessage = 'fal.ai authentication failed. Check API key.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      return { success: false, error: errorMessage };
    }
  }

  private aspectRatioToFal(aspectRatio?: string): string {
    switch (aspectRatio) {
      case '16:9': return '16:9';
      case '9:16': return '9:16';
      case '1:1':
      default: return '1:1';
    }
  }

  private parseDataUri(dataUri: string): { mimeType: string; data: string } | null {
    if (!dataUri || !dataUri.startsWith('data:')) return null;
    
    try {
      const splitIdx = dataUri.indexOf(',');
      if (splitIdx === -1) return null;
      
      const metadata = dataUri.substring(0, splitIdx);
      const data = dataUri.substring(splitIdx + 1);
      
      const mimeRegex = /data:([^;]+);base64/;
      const mimeMatch = metadata.match(mimeRegex);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      
      return { mimeType, data };
    } catch (e) {
      return null;
    }
  }

  private extractImages(data: any): string[] {
    if (data.images && Array.isArray(data.images)) {
      return data.images.map((img: any) => {
        if (typeof img === 'string') return img;
        if (img.url) return img.url;
        if (img.base64) return img.base64;
        return null;
      }).filter(Boolean);
    }
    
    if (data.image && typeof data.image === 'string') {
      return [data.image];
    }
    
    if (data.output && Array.isArray(data.output)) {
      return data.output;
    }
    
    if (data.result?.images) {
      return data.result.images;
    }
    
    const images = data.images || data.image || data.output || [];
    return Array.isArray(images) ? images : [];
  }

  private extractVideos(data: any): string[] {
    if (data.videos && Array.isArray(data.videos)) {
      return data.videos.map((vid: any) => {
        if (typeof vid === 'string') return vid;
        if (vid.url) return vid.url;
        return null;
      }).filter(Boolean);
    }
    
    if (data.video && typeof data.video === 'string') {
      return [data.video];
    }
    
    if (data.output && Array.isArray(data.output)) {
      return data.output;
    }
    
    if (data.result?.videos) {
      return data.result.videos;
    }
    
    const videos = data.videos || data.video || data.output || [];
    return Array.isArray(videos) ? videos : [];
  }

  async generateText(request: GenerationRequest): Promise<GenerationResponse> {
    return {
      success: false,
      error: 'fal.ai does not support text generation. Use Devstral 2 for coding tasks.'
    };
  }
}
