import { GoogleGenAI, HarmCategory, HarmBlockThreshold, VideoGenerationReferenceType } from '@google/genai';
import { BaseModelProvider } from './base.js';
import { GenerationRequest, GenerationResponse, ModelCapabilities, ProviderConfig } from '../types/models.js';

export class GoogleProvider extends BaseModelProvider {
  private client: GoogleGenAI;

  constructor(config: ProviderConfig) {
    const capabilities: ModelCapabilities = {
      provider: 'google',
      name: 'Google Gemini (Imagen 3 + Veo 3.1)',
      supportsImage: true,
      supportsVideo: true,
      supportsImageToImage: true,
      supportsImageToVideo: true,
      supportsMultipleImages: true,
      supportsSafetyControls: true,
      maxImageResolution: '2048x2048',
      maxVideoDuration: 14,
      censored: false, // Can be configured with safety settings
      costPerImage: 0.04,
      costPerVideo: 0.24
    };

    super(config, capabilities);
    this.client = new GoogleGenAI({ apiKey: config.apiKey });
  }

  private getSafetySettings(level: 'minimal' | 'default' | 'strict' = 'minimal') {
    const thresholds = {
      minimal: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      default: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      strict: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE
    };

    const threshold = thresholds[level];

    return [
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold },
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold }
    ];
  }

  async generateImage(request: GenerationRequest): Promise<GenerationResponse> {
    try {
      const safetySettings = this.getSafetySettings(request.safetyLevel);

      // Image-to-Image (using Gemini 3 Pro)
      if (request.sourceImage || request.referenceImages) {
        const contentsParts: any[] = [];

        if (request.referenceImages && request.referenceImages.length > 0) {
          request.referenceImages.forEach(ref => {
            contentsParts.push({
              inlineData: { data: ref.data, mimeType: ref.mimeType }
            });
          });
        } else if (request.sourceImage) {
          contentsParts.push({
            inlineData: { data: request.sourceImage, mimeType: request.sourceMimeType || 'image/png' }
          });
        }

        contentsParts.push({ text: request.prompt });

        const response = await this.client.models.generateContent({
          model: 'gemini-3-pro-image-preview',
          contents: { parts: contentsParts },
          config: {
            safetySettings,
            imageConfig: { aspectRatio: request.aspectRatio || '1:1' as any }
          }
        });

        const part = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
        if (part?.inlineData) {
          return {
            success: true,
            data: {
              mediaBase64: part.inlineData.data,
              mimeType: part.inlineData.mimeType || 'image/png',
              provider: 'google',
              cost: this.capabilities.costPerImage
            }
          };
        } else {
          return {
            success: false,
            error: 'No image generated. Possible safety filter trigger.'
          };
        }
      }

      // Text-to-Image (using Imagen 3)
      const response = await this.client.models.generateImages({
        model: 'imagen-3.0-generate-001',
        prompt: request.prompt,
        config: {
          numberOfImages: 1,
          aspectRatio: request.aspectRatio || '1:1' as any,
          outputMimeType: 'image/png'
        }
      });

      if (response.generatedImages && response.generatedImages.length > 0) {
        return {
          success: true,
          data: {
            mediaBase64: response.generatedImages[0].image.imageBytes,
            mimeType: 'image/png',
            provider: 'google',
            cost: this.capabilities.costPerImage
          }
        };
      }

      return { success: false, error: 'No image generated' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Google image generation failed' };
    }
  }

  async generateVideo(request: GenerationRequest): Promise<GenerationResponse> {
    try {
      const safetySettings = this.getSafetySettings(request.safetyLevel);
      const aspectRatio = (request.aspectRatio === '9:16') ? '9:16' : '16:9';
      let op;

      // Image-to-Video
      if (request.sourceImage) {
        op = await this.client.models.generateVideos({
          model: 'veo-3.1-fast-generate-preview',
          prompt: request.prompt,
          image: {
            imageBytes: request.sourceImage,
            mimeType: request.sourceMimeType || 'image/png'
          },
          config: {
            numberOfVideos: 1,
            resolution: request.videoConfig?.resolution || '720p',
            aspectRatio: aspectRatio as any,
            safetySettings
          }
        });
      }
      // Multiple reference images
      else if (request.referenceImages && request.referenceImages.length > 0) {
        const refPayload = request.referenceImages.map(ref => ({
          image: { imageBytes: ref.data, mimeType: ref.mimeType },
          referenceType: VideoGenerationReferenceType.ASSET
        }));

        op = await this.client.models.generateVideos({
          model: 'veo-3.1-generate-preview',
          prompt: request.prompt,
          config: {
            numberOfVideos: 1,
            resolution: request.videoConfig?.resolution || '720p',
            aspectRatio: '16:9',
            referenceImages: refPayload as any,
            safetySettings
          }
        });
      }
      // Text-to-Video
      else {
        op = await this.client.models.generateVideos({
          model: 'veo-3.1-fast-generate-preview',
          prompt: request.prompt,
          config: {
            numberOfVideos: 1,
            resolution: request.videoConfig?.resolution || '720p',
            aspectRatio: aspectRatio as any,
            safetySettings
          }
        });
      }

      // Poll for completion
      let attempts = 0;
      while (!op.done && attempts < 120) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        op = await this.client.operations.getVideosOperation({ operation: op });
        attempts++;
      }

      if (op.response?.generatedVideos?.[0]?.video?.uri) {
        const videoUri = `${op.response.generatedVideos[0].video.uri}&key=${this.config.apiKey}`;
        const base64 = await this.downloadToBase64(videoUri);

        return {
          success: true,
          data: {
            mediaBase64: base64,
            mimeType: 'video/mp4',
            provider: 'google',
            cost: this.capabilities.costPerVideo
          }
        };
      }

      return { success: false, error: 'Video generation timed out or failed' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Google video generation failed' };
    }
  }
}
