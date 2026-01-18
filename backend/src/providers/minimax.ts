import axios from 'axios';
import { appendFileSync } from 'fs';
import { BaseModelProvider } from './base.js';
import { GenerationRequest, GenerationResponse, ModelCapabilities, ProviderConfig } from '../types/models.js';

export class MinimaxProvider extends BaseModelProvider {
  private groupId: string;

  constructor(config: ProviderConfig & { groupId: string }) {
    const capabilities: ModelCapabilities = {
      provider: 'minimax',
      name: 'Minimax (Chinese AI - Image & Video)',
      supportsImage: true,
      supportsVideo: true,
      supportsImageToImage: true,
      supportsImageToVideo: true,
      supportsMultipleImages: false,
      supportsSafetyControls: false,
      maxImageResolution: '1024x1024',
      maxVideoDuration: 6,
      censored: false, // Less restrictive than Google
      costPerImage: 0.02,
      costPerVideo: 0.15
    };

    super(config, capabilities);
    this.groupId = config.groupId;
  }

  async generateImage(request: GenerationRequest): Promise<GenerationResponse> {
    try {
      // Correct Minimax image generation endpoint
      const endpoint = 'https://api.minimax.io/v1/image_generation';

      const payload: any = {
        model: 'image-01',
        prompt: request.prompt,
        aspect_ratio: request.aspectRatio || '1:1'
      };

      // Image-to-image mode
      if (request.sourceImage) {
        payload.subject_reference = [{
          type: 'character',
          image_file: {
            file_data: `data:image/jpeg;base64,${request.sourceImage}`
          }
        }];
      }

      // #region agent log
      const logData1 = JSON.stringify({location:'minimax.ts:generateImage-request',message:'Calling Minimax API',data:{endpoint:endpoint,hasApiKey:!!this.config.apiKey,hasGroupId:!!this.groupId,promptLength:request.prompt?.length,model:payload.model},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'F1,F2'}) + '\n';
      appendFileSync('/Users/michaelperinwogenburg/Desktop/big challenge/aprils-spielzeugkasten/.cursor/debug.log', logData1);
      // #endregion

      const response = await axios.post(endpoint, payload, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      // #region agent log
      const logData2 = JSON.stringify({location:'minimax.ts:generateImage-response',message:'Minimax API response',data:{status:response.status,hasData:!!response.data,dataKeys:Object.keys(response.data||{})},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'F3'}) + '\n';
      appendFileSync('/Users/michaelperinwogenburg/Desktop/big challenge/aprils-spielzeugkasten/.cursor/debug.log', logData2);
      // #endregion

      // Minimax returns image URL in data.image_urls array
      if (response.data && response.data.data && response.data.data.image_urls && response.data.data.image_urls.length > 0) {
        const imageUrl = response.data.data.image_urls[0];
        const imageBase64 = await this.downloadToBase64(imageUrl);
        return {
          success: true,
          data: {
            mediaBase64: imageBase64,
            mimeType: 'image/png',
            provider: 'minimax',
            cost: this.capabilities.costPerImage
          }
        };
      }

      return { success: false, error: 'No image returned from Minimax' };
    } catch (error: any) {
      // #region agent log
      const logData3 = JSON.stringify({location:'minimax.ts:generateImage-error',message:'Minimax API error',data:{errorMessage:error.message,errorCode:error.code,responseStatus:error.response?.status,responseData:error.response?.data,responseStatusText:error.response?.statusText},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'F1,F2,F4'}) + '\n';
      appendFileSync('/Users/michaelperinwogenburg/Desktop/big challenge/aprils-spielzeugkasten/.cursor/debug.log', logData3);
      // #endregion
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Minimax image generation failed'
      };
    }
  }

  async generateVideo(request: GenerationRequest): Promise<GenerationResponse> {
    try {
      // Correct Minimax video generation endpoint (Hailuo AI)
      const endpoint = 'https://api.minimax.io/v1/video_generation';

      const payload: any = {
        model: 'video-01',
        prompt: request.prompt
      };

      // Image-to-video mode
      if (request.sourceImage) {
        payload.first_frame_image = `data:image/jpeg;base64,${request.sourceImage}`;
      }

      const response = await axios.post(endpoint, payload, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const taskId = response.data.task_id;

      // Poll for completion
      let attempts = 0;
      let videoUrl = null;

      while (attempts < 60 && !videoUrl) {
        await new Promise(resolve => setTimeout(resolve, 5000));

        const statusResponse = await axios.get(
          `https://api.minimax.io/v1/query/video_generation?task_id=${taskId}`,
          {
            headers: {
              'Authorization': `Bearer ${this.config.apiKey}`
            }
          }
        );

        if (statusResponse.data.status === 'Success' && statusResponse.data.file_id) {
          videoUrl = statusResponse.data.file_id;
          break;
        } else if (statusResponse.data.status === 'Finished' && statusResponse.data.data?.file_id) {
          videoUrl = statusResponse.data.data.file_id;
          break;
        } else if (statusResponse.data.status === 'Failed') {
          return { success: false, error: 'Minimax video generation failed' };
        }

        attempts++;
      }

      if (videoUrl) {
        const videoBase64 = await this.downloadToBase64(videoUrl);
        return {
          success: true,
          data: {
            mediaBase64: videoBase64,
            mimeType: 'video/mp4',
            provider: 'minimax',
            cost: this.capabilities.costPerVideo
          }
        };
      }

      return { success: false, error: 'Video generation timed out' };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Minimax video generation failed'
      };
    }
  }
}
