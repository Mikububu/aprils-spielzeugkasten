// Model provider types

export type ModelProvider = 'google' | 'falai' | 'replicate' | 'openrouter' | 'drive' | 'devstral';

export type MediaType = 'image' | 'video';

export interface GenerationRequest {
  prompt: string;
  provider: ModelProvider;
  type: MediaType;
  aspectRatio?: '1:1' | '16:9' | '9:16';
  negativePrompt?: string;
  style?: string;
  seed?: number;  // For reproducible generation
  sourceImage?: string; // Single source image (base64)
  sourceImages?: string[]; // Multiple source images for merge/couple
  imageMode?: 'merge' | 'couple'; // How to combine multiple images
  sourceMimeType?: string;
  videoConfig?: VideoConfig;
  safetyLevel?: 'minimal' | 'default' | 'strict';
  uploadToDrive?: boolean; // If true, upload result to Drive and return link
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
    driveUrl?: string;
    localPath?: string;
    mimeType: string;
    provider: ModelProvider;
    cost?: number;
    seed?: number | undefined;  // Echoed back for reproducibility
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
