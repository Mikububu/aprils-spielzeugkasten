import { GenerationRequest, GenerationResponse, ModelCapabilities, ProviderConfig } from '../types/models.js';

export abstract class BaseModelProvider {
  protected config: ProviderConfig;
  protected capabilities: ModelCapabilities;

  constructor(config: ProviderConfig, capabilities: ModelCapabilities) {
    this.config = config;
    this.capabilities = capabilities;
  }

  abstract generateImage(request: GenerationRequest): Promise<GenerationResponse>;
  abstract generateVideo(request: GenerationRequest): Promise<GenerationResponse>;
  abstract generateText(request: GenerationRequest): Promise<GenerationResponse>;
  
  getCapabilities(): ModelCapabilities {
    return this.capabilities;
  }

  validateRequest(request: GenerationRequest): { valid: boolean; error?: string } {
    if (request.type === 'image' && !this.capabilities.supportsImage) {
      return { valid: false, error: 'Provider does not support image generation' };
    }
    if (request.type === 'video' && !this.capabilities.supportsVideo) {
      return { valid: false, error: 'Provider does not support video generation' };
    }
    if (request.type === 'text' && this.capabilities.provider !== 'devstral') {
      return { valid: false, error: 'Provider does not support text generation' };
    }
    if (request.sourceImage && request.type === 'image' && !this.capabilities.supportsImageToImage) {
      return { valid: false, error: 'Provider does not support image-to-image' };
    }
    if (request.sourceImage && request.type === 'video' && !this.capabilities.supportsImageToVideo) {
      return { valid: false, error: 'Provider does not support image-to-video' };
    }
    if (request.sourceImages && request.sourceImages.length > 1 && !this.capabilities.supportsMultipleImages) {
      return { valid: false, error: 'Provider does not support multiple source images' };
    }
    return { valid: true };
  }

  protected async downloadToBase64(url: string): Promise<string> {
    const axios = (await import('axios')).default;
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(response.data).toString('base64');
  }
}
