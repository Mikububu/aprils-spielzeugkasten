// API Client for Multi-Model Backend

export interface ModelProvider {
  provider: 'google' | 'minimax' | 'runpod' | 'replicate' | 'stability';
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
  available: boolean;
}

export interface GenerationRequest {
  prompt: string;
  provider: string;
  type: 'image' | 'video';
  aspectRatio?: '1:1' | '16:9' | '9:16';
  negativePrompt?: string;
  style?: string;
  referenceImages?: Array<{
    data: string;
    mimeType: string;
    weight?: number;
  }>;
  sourceImage?: string;
  sourceMimeType?: string;
  videoConfig?: {
    duration?: number;
    fps?: number;
    resolution?: '720p' | '1080p';
    extend?: boolean;
    audio?: boolean;
  };
  safetyLevel?: 'minimal' | 'default' | 'strict';
}

export interface GenerationResponse {
  success: boolean;
  data?: {
    mediaUrl?: string;
    mediaBase64?: string;
    mimeType: string;
    provider: string;
    cost?: number;
    metadata?: any;
  };
  error?: string;
}

class APIClient {
  private baseUrl: string;
  private providers: ModelProvider[] = [];

  constructor() {
    // Use environment variable or default to localhost
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://172.20.10.2:3001';
    console.log('API Client initialized with baseUrl:', this.baseUrl);
  }

  async initialize() {
    try {
      // #region agent log
      const url = `${this.baseUrl}/api/providers`;
      fetch('http://127.0.0.1:7244/ingest/ae1e7be2-4a73-468a-87a6-28a5b504d7af',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client.ts:initialize-start',message:'Fetching providers',data:{url:url,baseUrl:this.baseUrl},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D1,D2,E2'})}).catch(()=>{});
      // #endregion
      
      const response = await fetch(`${this.baseUrl}/api/providers`);
      
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/ae1e7be2-4a73-468a-87a6-28a5b504d7af',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client.ts:initialize-response',message:'Providers response received',data:{status:response.status,statusText:response.statusText,ok:response.ok},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D1,D3'})}).catch(()=>{});
      // #endregion
      
      const data = await response.json();
      
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/ae1e7be2-4a73-468a-87a6-28a5b504d7af',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client.ts:initialize-data',message:'Providers data parsed',data:{hasSuccess:!!data.success,hasProviders:!!data.providers,providerCount:data.providers?.length,providers:data.providers,rawData:data},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D3,E3'})}).catch(()=>{});
      // #endregion
      
      if (data.success) {
        this.providers = data.providers;
        console.log('✓ Available providers:', this.providers.map(p => p.provider).join(', '));
      }
    } catch (error: any) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/ae1e7be2-4a73-468a-87a6-28a5b504d7af',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client.ts:initialize-error',message:'Failed to fetch providers',data:{errorMessage:error.message,errorName:error.name,baseUrl:this.baseUrl},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D2,E1,E2'})}).catch(()=>{});
      // #endregion
      
      console.error('Failed to fetch providers:', error);
      // Fallback to empty array - will show error in UI
      this.providers = [];
    }
  }

  getProviders(): ModelProvider[] {
    return this.providers;
  }

  getProvider(provider: string): ModelProvider | undefined {
    return this.providers.find(p => p.provider === provider);
  }

  async generateImage(request: Omit<GenerationRequest, 'type'>): Promise<GenerationResponse> {
    return this.generate({ ...request, type: 'image' });
  }

  async generateVideo(request: Omit<GenerationRequest, 'type'>): Promise<GenerationResponse> {
    return this.generate({ ...request, type: 'video' });
  }

  private async generate(request: GenerationRequest): Promise<GenerationResponse> {
    try {
      // #region agent log
      const url = `${this.baseUrl}/api/generate`;
      fetch('http://127.0.0.1:7244/ingest/ae1e7be2-4a73-468a-87a6-28a5b504d7af',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client.ts:generate-start',message:'Frontend making request',data:{url:url,baseUrl:this.baseUrl,method:'POST',provider:request.provider,type:request.type},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A1,A2,A3,C1'})}).catch(()=>{});
      // #endregion

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/ae1e7be2-4a73-468a-87a6-28a5b504d7af',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client.ts:generate-response',message:'Response received',data:{status:response.status,statusText:response.statusText,ok:response.ok,url:response.url},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A1,B1,B2'})}).catch(()=>{});
      // #endregion

      const data = await response.json();
      
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/ae1e7be2-4a73-468a-87a6-28a5b504d7af',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client.ts:generate-data',message:'Response data parsed',data:{success:data.success,hasError:!!data.error,error:data.error},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B2'})}).catch(()=>{});
      // #endregion
      
      return data;
    } catch (error: any) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/ae1e7be2-4a73-468a-87a6-28a5b504d7af',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client.ts:generate-error',message:'Request failed with error',data:{errorMessage:error.message,errorName:error.name,stack:error.stack?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C1,C2'})}).catch(()=>{});
      // #endregion
      
      return {
        success: false,
        error: error.message || 'Network error'
      };
    }
  }

  async uploadImage(file: File): Promise<{ base64: string; mimeType: string }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve({
          base64,
          mimeType: file.type
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

export const apiClient = new APIClient();
