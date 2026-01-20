import { BaseModelProvider } from './base.js';
import { GenerationRequest, GenerationResponse, ModelCapabilities, ProviderConfig } from '../types/models.js';

export class OpenRouterProvider extends BaseModelProvider {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';

  constructor(config: ProviderConfig & { apiKey: string }) {
    const capabilities: ModelCapabilities = {
      provider: 'openrouter',
      name: 'OpenRouter (Gemini 2.5 Flash Image)',
      supportsImage: true,
      supportsVideo: false,
      supportsImageToImage: false,  // Gemini 2.5 Flash is text-to-image only
      supportsImageToVideo: false,
      supportsMultipleImages: false,
      supportsSafetyControls: false,
      maxImageResolution: '1024x1024',
      maxVideoDuration: 0,
      censored: true,
      costPerImage: 0,
      costPerVideo: 0
    };

    super(config, capabilities);
    this.apiKey = config.apiKey;
  }

  async generateImage(request: GenerationRequest): Promise<GenerationResponse> {
    try {
      let fullPrompt = request.prompt;
      if (request.style && request.style !== 'NONE') {
        fullPrompt = `${request.prompt} ${request.style}`;
      }

      // Use Gemini 2.5 Flash Image for best free image generation
      const model = 'google/gemini-2.5-flash-image';
      const endpoint = `${this.baseUrl}/chat/completions`;

      const headers = {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://aprils-spielzeugkasten.fly.dev',
        'X-Title': "April's Spielzeugkasten"
      };

      const requestBody: any = {
        model: model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: fullPrompt
              }
            ]
          }
        ],
        modalities: ['image', 'text'],
        image_size: this.aspectRatioToSize(request.aspectRatio)
      };

      if (request.seed && request.seed > 0) {
        requestBody.seed = request.seed;
      }

      // Note: Gemini 2.5 Flash Image is text-to-image only, no image-to-image support
      if (request.sourceImage) {
        return { success: false, error: 'OpenRouter (Gemini 2.5 Flash Image) does not support image-to-image. Use Replicate or fal.ai for image transformations.' };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://aprils-spielzeugkasten.fly.dev',
          'X-Title': "April's Spielzeugkasten"
        },
        body: JSON.stringify(requestBody)
      });

      const responseData = await response.json();

      const message = responseData.choices?.[0]?.message;
      const images = message?.images || [];
      
      if (images && images.length > 0) {
        const imageData = images[0];
        
        // Handle different response formats
        let imageBase64: string;
        
        if (typeof imageData === 'string') {
          imageBase64 = imageData;
        } else if (imageData.image_url?.url) {
          // Handle nested image_url structure from OpenRouter/Gemini
          const imageUrl = imageData.image_url.url;
          if (imageUrl.startsWith('data:')) {
            const parsed = this.parseDataUri(imageUrl);
            if (parsed) {
              imageBase64 = parsed.data;
            } else {
              return { success: false, error: 'Invalid image data URL from OpenRouter' };
            }
          } else {
            // Download from URL
            imageBase64 = await this.downloadToBase64(imageUrl);
          }
        } else if (imageData.url) {
          // Direct URL (for other providers)
          const imageUrl = imageData.url;
          if (imageUrl.startsWith('data:')) {
            const parsed = this.parseDataUri(imageUrl);
            if (parsed) {
              imageBase64 = parsed.data;
            } else {
              return { success: false, error: 'Invalid image data URL from OpenRouter' };
            }
          } else {
            imageBase64 = await this.downloadToBase64(imageUrl);
          }
        } else if (imageData.b64_json) {
          imageBase64 = imageData.b64_json;
        } else {
          return { success: false, error: 'Invalid image response format from OpenRouter' };
        }
        
        return {
          success: true,
          data: {
            mediaBase64: imageBase64,
            mimeType: 'image/png',
            provider: 'openrouter',
            cost: this.capabilities.costPerImage,
            seed: request.seed || undefined
          }
        };
      }

      return { success: false, error: 'No image returned from OpenRouter' };

    } catch (error: any) {
      let errorMessage = 'Image generation failed';
      
      if (error.response?.status === 429) {
        errorMessage = 'OpenRouter quota exceeded. Try again later.';
      } else if (error.response?.status === 401) {
        errorMessage = 'OpenRouter authentication failed. Check API key.';
      } else if (error.responseData?.error?.message) {
        errorMessage = error.responseData.error.message;
      } else if (error.responseData?.detail) {
        errorMessage = error.responseData.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return { success: false, error: errorMessage };
    }
  }

  async generateVideo(request: GenerationRequest): Promise<GenerationResponse> {
    return { 
      success: false, 
      error: 'OpenRouter does not currently support video generation. Use Replicate or fal.ai for video.' 
    };
  }

  private aspectRatioToSize(aspectRatio?: string): string {
    switch (aspectRatio) {
      case '16:9': return '1024x576';
      case '9:16': return '576x1024';
      case '1:1':
      default: return '1024x1024';
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

  async generateText(request: GenerationRequest): Promise<GenerationResponse> {
    return {
      success: false,
      error: 'OpenRouter provider does not support text generation. Use Devstral 2 for coding tasks.'
    };
  }
}
