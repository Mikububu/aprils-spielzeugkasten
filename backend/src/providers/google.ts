import axios from 'axios';
import { BaseModelProvider } from './base.js';
import { GenerationRequest, GenerationResponse, ModelCapabilities, ProviderConfig } from '../types/models.js';

export class GoogleProvider extends BaseModelProvider {
  private apiKey: string;

  constructor(config: ProviderConfig & { apiKey: string }) {
    const capabilities: ModelCapabilities = {
      provider: 'google',
      name: 'Google (Veo 3 + Gemini Image)',
      supportsImage: true,
      supportsVideo: true,
      supportsImageToImage: false, // Google API doesn't support image input for Gemini Image yet
      supportsImageToVideo: true,
      supportsMultipleImages: false,
      supportsSafetyControls: false,
      maxImageResolution: '1024x1024',
      maxVideoDuration: 10,
      censored: false,
      costPerImage: 0.001,
      costPerVideo: 0.05
    };

    super(config, capabilities);
    this.apiKey = config.apiKey;
  }

  async generateImage(request: GenerationRequest): Promise<GenerationResponse> {
    try {
      console.log('Google generateImage called:', {
        prompt: request.prompt?.substring(0, 50),
        seed: request.seed,
        hasSourceImage: !!request.sourceImage
      });

      // Build full prompt with style
      let fullPrompt = request.prompt;
      if (request.style && request.style !== 'NONE') {
        fullPrompt = `${request.prompt} ${request.style}`;
      }

      // Handle dual image input (Merge or Couple mode)
      const imageParts: any[] = [{ text: fullPrompt }];
      
      if (request.sourceImages && request.sourceImages.length > 0) {
        // For Google, we'll use the first image as reference
        // Dual image merge/couple is more complex and may not be supported
        const parsedImage = this.parseDataUri(request.sourceImages[0]);
        if (parsedImage) {
          imageParts.push({
            inlineData: { mimeType: parsedImage.mimeType, data: parsedImage.data }
          });
        }
        if (request.sourceImages.length === 2) {
          console.log('Note: Google API uses first image only. Dual image merge/couple requires Replicate.');
        }
      }

      const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent';
      
      const requestBody: any = {
        contents: { parts: imageParts },
        config: {}
      };

      // Add seed if provided
      if (request.seed && request.seed > 0) {
        requestBody.config.seed = request.seed;
      }

      console.log('Calling Google Image API...');

      const response = await axios.post(
        `${endpoint}?key=${this.apiKey}`,
        requestBody,
        { timeout: 120000 }
      );

      console.log('Google Image response received');

      // Extract image from response
      if (response.data.candidates?.[0]?.content?.parts) {
        for (const part of response.data.candidates[0].content.parts) {
          if (part.inlineData) {
            const base64String = part.inlineData.data;
            const mimeType = part.inlineData.mimeType || 'image/png';
            
            console.log('Image generated successfully');
            
            return {
              success: true,
              data: {
                mediaBase64: base64String,
                mimeType: mimeType,
                provider: 'google',
                cost: this.capabilities.costPerImage,
                seed: request.seed || undefined
              }
            };
          }
        }
      }

      return { success: false, error: 'No image returned from Google API' };

    } catch (error: any) {
      console.error('Google Image API error:', error.message);
      
      let errorMessage = 'Image generation failed';
      
      if (error.response?.status === 429) {
        errorMessage = 'Google quota exceeded. Try again later or request quota increase.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Google API access denied. Check billing and API enablement.';
      } else if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return { success: false, error: errorMessage };
    }
  }

  async generateVideo(request: GenerationRequest): Promise<GenerationResponse> {
    try {
      console.log('Google generateVideo called:', {
        prompt: request.prompt?.substring(0, 50),
        hasSourceImage: !!request.sourceImage
      });

      // Build prompt with style
      let fullPrompt = request.prompt;
      if (request.style && request.style !== 'NONE') {
        fullPrompt = `${request.style}\n\n${request.prompt}`;
      }

      const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/veo-3.1-fast-generate-preview:generateContent';

      const vidConfig = {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: this.aspectRatioToGoogle(request.aspectRatio)
      };

      // Fix aspect ratio
      if (vidConfig.aspectRatio === '1:1') vidConfig.aspectRatio = '16:9';

      const requestBody: any = {
        prompt: fullPrompt,
        config: vidConfig
      };

      // Handle image-to-video
      if (request.sourceImage) {
        const parsedImage = this.parseDataUri(request.sourceImage);
        if (parsedImage) {
          requestBody.image = {
            imageBytes: parsedImage.data,
            mimeType: parsedImage.mimeType
          };
        }
      }

      console.log('Calling Google Video API...');

      const response = await axios.post(
        `${endpoint}?key=${this.apiKey}`,
        requestBody,
        { timeout: 300000 }
      );

      const operationName = response.data.name;
      console.log('Operation started:', operationName);

      // Poll for completion
      let attempts = 0;
      const MAX_ATTEMPTS = 120; // 10 minutes max
      
      const pollEndpoint = `https://generativelanguage.googleapis.com/v1beta/${operationName}`;
      
      while (attempts < MAX_ATTEMPTS) {
        attempts++;
        await new Promise(r => setTimeout(r, 5000));
        
        const pollResponse = await axios.get(pollEndpoint, { params: { key: this.apiKey } });
        const operation = pollResponse.data;
        
        console.log(`Polling... (${attempts}) Status: ${operation.done ? 'done' : 'processing'}`);
        
        if (operation.done) {
          if (operation.error) {
            console.error('Video error:', operation.error);
            return { success: false, error: operation.error.message || 'Video generation failed' };
          }
          
          const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
          
          if (videoUri) {
            console.log('Video URI:', videoUri.substring(0, 50));
            
            // Download video with API key
            const videoRes = await fetch(`${videoUri}&key=${this.apiKey}`);
            
            if (!videoRes.ok) {
              return { success: false, error: `Video download failed: ${videoRes.statusText}` };
            }
            
            const videoBlob = await videoRes.blob();
            const videoBase64 = Buffer.from(await videoBlob.arrayBuffer()).toString('base64');
            
            console.log('Video downloaded successfully');
            
            return {
              success: true,
              data: {
                mediaBase64: videoBase64,
                mimeType: 'video/mp4',
                provider: 'google',
                cost: this.capabilities.costPerVideo
              }
            };
          }
          
          return { success: false, error: 'No video URI in response' };
        }
      }

      return { success: false, error: 'Video generation timed out' };

    } catch (error: any) {
      console.error('Google Video API error:', error.message);
      
      let errorMessage = 'Video generation failed';
      
      if (error.response?.status === 429) {
        errorMessage = 'Google quota exceeded. Try again later or request quota increase.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Google API access denied. Check billing and API enablement.';
      } else if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return { success: false, error: errorMessage };
    }
  }

  private aspectRatioToGoogle(aspectRatio?: string): string {
    switch (aspectRatio) {
      case '16:9': return '16:9';
      case '9:16': return '9:16';
      case '1:1':
      default: return '16:9';
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
}
