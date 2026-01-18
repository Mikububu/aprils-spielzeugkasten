// Model provider types

export type ModelProvider = 'google' | 'minimax' | 'runpod' | 'replicate' | 'stability';

export type MediaType = 'image' | 'video';

export interface GenerationRequest {
  prompt: string;
  provider: ModelProvider;
  type: MediaType;
  aspectRatio?: '1:1' | '16:9' | '9:16';
  negativePrompt?: string;
  style?: string;
  referenceImages?: ImageReference[];
  sourceImage?: string; // base64
  sourceMimeType?: string;
  videoConfig?: VideoConfig;
  safetyLevel?: 'minimal' | 'default' | 'strict';
}

export interface ImageReference {
  data: string; // base64
  mimeType: string;
  weight?: number;
}

export interface VideoConfig {
  duration?: number; // seconds
  fps?: number;
  resolution?: '720p' | '1080p';
  extend?: boolean;
  audio?: boolean;
}

export interface GenerationResponse {
  success: boolean;
  data?: {
    mediaUrl?: string;
    mediaBase64?: string;
    mimeType: string;
    provider: ModelProvider;
    cost?: number;
    metadata?: any;
  };
  error?: string;
}

export interface ModelCapabilities {
  provider: ModelProvider;
  name: string;
  supportsImage: boolean;
  supportsVideo: boolean;
  supportsImageToImage: boolean;
  supportsImageToVideo: boolean;
  supportsMultipleImages: boolean;
  supportsSafetyControls: boolean;
  maxImageResolution?: string;
  maxVideoDuration?: number;
  censored: boolean;
  costPerImage?: number;
  costPerVideo?: number;
}

export interface ProviderConfig {
  apiKey: string;
  endpoint?: string;
  additionalParams?: Record<string, any>;
}
