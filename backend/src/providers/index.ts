import { BaseModelProvider } from './base.js';
import { MinimaxProvider } from './minimax.js';
import { ModelProvider } from '../types/models.js';
import dotenv from 'dotenv';

dotenv.config();

export class ProviderFactory {
  private static providers: Map<ModelProvider, BaseModelProvider> = new Map();

  static initialize() {
    // Initialize Minimax Provider ONLY - No censorship, Chinese AI
    if (process.env.MINIMAX_API_KEY && process.env.MINIMAX_GROUP_ID) {
      this.providers.set('minimax', new MinimaxProvider({
        apiKey: process.env.MINIMAX_API_KEY,
        groupId: process.env.MINIMAX_GROUP_ID
      }));
      console.log('✓ Minimax provider initialized (NO CENSORSHIP)');
    } else {
      console.warn('⚠ MINIMAX_API_KEY or MINIMAX_GROUP_ID not set');
    }
  }

  static getProvider(provider: ModelProvider): BaseModelProvider | undefined {
    return this.providers.get(provider);
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

export { MinimaxProvider };
