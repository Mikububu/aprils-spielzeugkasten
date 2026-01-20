import axios from 'axios';
import { BaseModelProvider } from './base.js';
import { GenerationRequest, GenerationResponse, ModelCapabilities, ProviderConfig } from '../types/models.js';

export class ReplicateProvider extends BaseModelProvider {
  private apiKey: string;
  private model: string;

  constructor(config: ProviderConfig & { apiKey: string; model?: string }) {
    const modelName = config.model || 'flux-schnell';
    const capabilities: ModelCapabilities = {
      provider: 'replicate',
      name: `Replicate (${modelName} - Uncensored)`,
      supportsImage: true,
      supportsVideo: true,
      supportsImageToImage: true,
      supportsImageToVideo: true,
      supportsMultipleImages: false,
      supportsSafetyControls: false,
      maxImageResolution: '1024x1024',
      maxVideoDuration: 10,
      censored: false,
      costPerImage: 0.003,
      costPerVideo: 0.08
    };

    super(config, capabilities);
    this.apiKey = config.apiKey;
    this.model = modelName;
  }

  async generateImage(request: GenerationRequest): Promise<GenerationResponse> {
    try {
      console.log('Replicate generateImage called:', {
        prompt: request.prompt?.substring(0, 50),
        aspectRatio: request.aspectRatio,
        hasSourceImage: !!request.sourceImage
      });

      const endpoint = 'https://api.replicate.com/v1/predictions';

      let fullPrompt = request.prompt;
      if (request.style) {
        fullPrompt = `${request.prompt}. ${request.style}`;
      }

      let version: string;
      let input: any;

      if (request.sourceImage) {
        const sdxlVersion = this.getSDXLVersion();
        input = {
          prompt: fullPrompt,
          image: `data:image/jpeg;base64,${request.sourceImage}`,
          strength: 0.6,
          num_outputs: 1,
          guidance: 7.5,
          num_inference_steps: 50
        };
        version = sdxlVersion;
        console.log('Using SDXL for image-to-image');
      } else {
        version = this.getModelVersion();
        input = {
          prompt: fullPrompt,
          num_outputs: 1,
          aspect_ratio: this.aspectRatioToReplicate(request.aspectRatio),
          output_format: 'png',
          output_quality: 90,
          go_fast: true,
          num_inference_steps: 4
        };
        console.log('Using FLUX for text-to-image');
      }

      console.log('Calling Replicate API...');

      const createResponse = await axios.post(endpoint, {
        version: version,
        input: input
      }, {
        headers: {
          'Authorization': `Token ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'wait'
        },
        timeout: 180000
      });

      console.log('Replicate response status:', createResponse.data.status);

      let imageUrl = null;
      if (createResponse.data.output) {
        if (Array.isArray(createResponse.data.output)) {
          imageUrl = createResponse.data.output[0];
        } else if (typeof createResponse.data.output === 'string') {
          imageUrl = createResponse.data.output;
        }
      }

      if (imageUrl) {
        console.log('Downloading image from:', imageUrl.substring(0, 80));
        const imageBase64 = await this.downloadToBase64(imageUrl);
        console.log('Image downloaded, size:', imageBase64.length, 'chars');

        return {
          success: true,
          data: {
            mediaBase64: imageBase64,
            mimeType: 'image/png',
            provider: 'replicate',
            cost: this.capabilities.costPerImage
          }
        };
      }

      if (createResponse.data.status === 'failed') {
        return { success: false, error: createResponse.data.error || 'Generation failed' };
      }

      return { success: false, error: 'No image returned from Replicate' };

    } catch (error: any) {
      console.error('Replicate API error:', error.message);
      if (error.response?.data) {
        console.error('Replicate error details:', JSON.stringify(error.response.data, null, 2));
      }

      let errorMessage = 'Image generation failed';
      if (error.response?.status === 401) {
        errorMessage = 'Replicate authentication failed';
      } else if (error.response?.status === 429) {
        errorMessage = 'Rate limit exceeded. Try again in a moment.';
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
      console.log('Replicate generateVideo called:', {
        prompt: request.prompt?.substring(0, 50),
        hasSourceImage: !!request.sourceImage,
        type: request.sourceImage ? 'image-to-video' : 'text-to-video'
      });

      const endpoint = 'https://api.replicate.com/v1/predictions';

      let version: string;
      let input: any;

      if (request.sourceImage) {
        version = this.getImageToVideoVersion();
        input = {
          prompt: request.prompt || 'video of this image',
          image: `data:image/jpeg;base64,${request.sourceImage}`,
          video_length: request.videoConfig?.duration || 25,
          fps: request.videoConfig?.fps || 8
        };
        console.log('Using stable-video-diffusion for image-to-video');
      } else {
        version = this.getTextToVideoVersion();
        input = {
          prompt: request.prompt,
          num_frames: request.videoConfig?.duration ? request.videoConfig.duration * 8 : 24,
          width: 576,
          height: 320,
          fps: 8
        };
        console.log('Using zeroscope for text-to-video');
      }

      console.log('Calling Replicate Video API...');

      const createResponse = await axios.post(endpoint, {
        version: version,
        input: input
      }, {
        headers: {
          'Authorization': `Token ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'wait'
        },
        timeout: 300000
      });

      console.log('Video response status:', createResponse.data.status);

      let videoUrl = null;
      if (createResponse.data.output) {
        if (Array.isArray(createResponse.data.output)) {
          videoUrl = createResponse.data.output[0];
        } else if (typeof createResponse.data.output === 'string') {
          videoUrl = createResponse.data.output;
        }
      }

      if (videoUrl) {
        console.log('Downloading video from:', videoUrl.substring(0, 80));
        const videoBase64 = await this.downloadToBase64(videoUrl);
        console.log('Video downloaded, size:', videoBase64.length, 'chars');

        return {
          success: true,
          data: {
            mediaBase64: videoBase64,
            mimeType: 'video/mp4',
            provider: 'replicate',
            cost: this.capabilities.costPerVideo
          }
        };
      }

      if (createResponse.data.status === 'failed') {
        return { success: false, error: createResponse.data.error || 'Video generation failed' };
      }

      return { success: false, error: 'No video returned from Replicate' };

    } catch (error: any) {
      console.error('Replicate Video API error:', error.message);
      if (error.response?.data) {
        console.error('Replicate video error:', JSON.stringify(error.response.data, null, 2));
      }

      let errorMessage = 'Video generation failed';
      if (error.response?.status === 429) {
        errorMessage = 'Rate limit exceeded. Try again in a moment.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return { success: false, error: errorMessage };
    }
  }

  private getModelVersion(): string {
    const versions: Record<string, string> = {
      'flux-schnell': 'c846a69991daf4c0e5d016514849d14ee5b2e6846ce6b9d6f21369e564cfe51e',
      'flux-dev': 'a951d3a2a24c11aa1c5b5e4e4e77e6b6f5c7d8e9a1b2c3d4e5f6a7b8c9d0e1f'
    };
    return versions[this.model] || versions['flux-schnell'];
  }

  private getSDXLVersion(): string {
    return '39ed52c2a78a2c8c40a38c5d0a9e5a3c3f7b8d9e0a1b2c3d4e5f6a7b8c9d0e1f2';
  }

  private getTextToVideoVersion(): string {
    return '9f747673945c62801b13b84701c783929c0ee784e4748ec062204894dda1a351';
  }

  private getImageToVideoVersion(): string {
    return '3cbe0b9b96c3842c8a65e8d4b8a7d4e3c7b8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a';
  }

  private aspectRatioToReplicate(aspectRatio?: string): string {
    switch (aspectRatio) {
      case '16:9': return '16:9';
      case '9:16': return '9:16';
      case '1:1':
      default: return '1:1';
    }
  }
}
