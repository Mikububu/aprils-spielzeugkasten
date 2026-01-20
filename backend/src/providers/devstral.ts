import { BaseModelProvider } from './base.js';
import { GenerationRequest, GenerationResponse, ModelCapabilities, ProviderConfig } from '../types/models.js';

export class DevstralProvider extends BaseModelProvider {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';
  private model = 'mistralai/devstral-2512:free';

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

  async generateText(request: GenerationRequest): Promise<GenerationResponse> {
    try {
      const textResponse = await this.callDevstralAPI(request.prompt);
      
      return {
        success: true,
        data: {
          mediaUrl: undefined,
          mediaBase64: undefined,
          mimeType: 'text/plain',
          provider: 'devstral',
          cost: 0,
          metadata: {
            textResponse,
            note: 'Devstral is a text-only coding model.'
          }
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Devstral 2 generation failed'
      };
    }
  }

  private async callDevstralAPI(prompt: string): Promise<string> {
    const endpoint = `${this.baseUrl}/chat/completions`;

    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://aprils-spielzeugkasten.fly.dev',
      'X-Title': "April's Spielzeugkasten - Devstral 2"
    };

    const requestBody = {
      model: this.model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 4096,
      temperature: 0.7
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
      }

      const data = await response.json();

      if (data.choices && data.choices.length > 0) {
        return data.choices[0].message?.content || '';
      }

      throw new Error('No response from Devstral 2');
    } catch (error: any) {
      throw new Error(`Devstral 2 API error: ${error.message}`);
    }
  }

  async generateImage(request: GenerationRequest): Promise<GenerationResponse> {
    return await this.generateText(request);
  }

  async generateVideo(request: GenerationRequest): Promise<GenerationResponse> {
    return {
      success: false,
      error: 'Devstral does not support video generation. It is a text-only coding model.'
    };
  }
}
