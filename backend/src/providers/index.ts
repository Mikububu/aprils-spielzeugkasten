import { BaseModelProvider } from './base.js';
import { ReplicateProvider } from './replicate.js';
import { GoogleProvider } from './google.js';
import { FalAIProvider } from './falai.js';
import { OpenRouterProvider } from './openrouter.js';
import { DevstralProvider } from './devstral.js';
import { ModelProvider } from '../types/models.js';
import dotenv from 'dotenv';

dotenv.config();

export class ProviderFactory {
  private static providers: Map<ModelProvider, BaseModelProvider> = new Map();

  static initialize() {
    // Initialize Google Provider (Veo 3 + Gemini Image)
    if (process.env.GOOGLE_API_KEY) {
      this.providers.set('google', new GoogleProvider({
        apiKey: process.env.GOOGLE_API_KEY
      }));
      console.log('✓ Google provider initialized (Veo 3 + Gemini Image)');
    } else {
      console.warn('⚠ GOOGLE_API_KEY not set');
    }

    // Initialize fal.ai Provider (Stable Diffusion)
    if (process.env.FALAI_API_KEY) {
      this.providers.set('falai', new FalAIProvider({
        apiKey: process.env.FALAI_API_KEY
      }));
      console.log('✓ fal.ai provider initialized (Stable Diffusion)');
    } else {
      console.warn('⚠ FALAI_API_KEY not set');
    }

    // Initialize OpenRouter Provider (FLUX.2 Pro)
    if (process.env.OPENROUTER_API_KEY) {
      this.providers.set('openrouter', new OpenRouterProvider({
        apiKey: process.env.OPENROUTER_API_KEY
      }));
      console.log('✓ OpenRouter provider initialized (FLUX.2 Pro - NO CENSORSHIP)');
    } else {
      console.warn('⚠ OPENROUTER_API_KEY not set');
    }

    // Initialize Replicate Provider (FLUX - fully uncensored, waiting on support)
    if (process.env.REPLICATE_API_KEY) {
      this.providers.set('replicate', new ReplicateProvider({
        apiKey: process.env.REPLICATE_API_KEY,
        model: process.env.REPLICATE_MODEL || 'flux-schnell'
      }));
      console.log('✓ Replicate provider initialized (FLUX - NO CENSORSHIP)');
    } else {
      console.warn('⚠ REPLICATE_API_KEY not set');
    }

    // Initialize Devstral Provider (Mistral Devstral 2 - FREE coding specialist)
    if (process.env.OPENROUTER_API_KEY) {
      this.providers.set('devstral', new DevstralProvider({
        apiKey: process.env.OPENROUTER_API_KEY
      }));
      console.log('✓ Devstral provider initialized (Devstral 2 - FREE coding specialist)');
    } else {
      console.warn('⚠ OPENROUTER_API_KEY not set for Devstral');
    }

    console.log(`\n Available providers: ${this.getAvailableProviders().join(', ')}`);
  }

  static getProvider(provider: ModelProvider): BaseModelProvider | undefined {
    return this.providers.get(provider);
  }

  static getProviderForTask(task: 'text-to-image' | 'image-to-image' | 'text-to-video' | 'image-to-video'): BaseModelProvider | undefined {
    return undefined;
  }

  static getAvailableProviders(): ModelProvider[] {
    return Array.from(this.providers.keys());
  }

  static getAllCapabilities() {
    const capabilities: any[] = [];
    this.providers.forEach((provider, key) => {
      capabilities.push({
        ...provider.getCapabilities(),
        available: true
      });
    });
    return capabilities;
  }
}

export { ReplicateProvider, GoogleProvider, FalAIProvider, OpenRouterProvider, DevstralProvider };
