import { BaseModelProvider } from './base.js';
import { GenerationRequest, GenerationResponse, ModelCapabilities, ProviderConfig } from '../types/models.js';

export class DevstralProvider extends BaseModelProvider {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';

  constructor(config: ProviderConfig & { apiKey: string }) {
    const capabilities: ModelCapabilities = {
      provider: 'devstral',
      name: 'Devstral 2 (Free - Coding Specialist)',
      supportsImage: false,
      supportsVideo: false,
      supportsImageToImage: false,
      supportsImageToVideo: false,
      supportsMultipleImages: false,
      supportsSafetyControls: false,
      maxImageResolution: undefined,
      maxVideoDuration: 0,
      censored: false,
      costPerImage: 0,
      costPerVideo: 0
    };

    super(config, capabilities);
    this.apiKey = config.apiKey;
  }

  async generateImage(request: GenerationRequest): Promise<GenerationResponse> {
    return {
      success: false,
      error: 'Devstral is a text-only model. Use it for coding tasks, not image generation.'
    };
  }

  async generateVideo(request: GenerationRequest): Promise<GenerationResponse> {
    return {
      success: false,
      error: 'Devstral does not support video generation.'
    };
  }
}
