import { google, drive_v3 } from 'googleapis';
import { JWT, GoogleAuth } from 'google-auth-library';
import { Readable } from 'stream';
import { BaseModelProvider } from './base.js';
import { GenerationRequest, GenerationResponse, ModelCapabilities, ProviderConfig } from '../types/models.js';

export class DriveStorageProvider extends BaseModelProvider {
  private drive: any;
  private folderId = '1CMNHy1qWJRawFGfbVL6NBOmvugV_KoEO';

  constructor(config: ProviderConfig & { serviceAccountKey: string }) {
    const capabilities: ModelCapabilities = {
      provider: 'drive',
      name: 'Google Drive Storage',
      supportsImage: true,
      supportsVideo: true,
      supportsImageToImage: false,
      supportsImageToVideo: false,
      supportsMultipleImages: false,
      supportsSafetyControls: false,
      maxImageResolution: '0',
      maxVideoDuration: 0,
      censored: false,
      costPerImage: 0,
      costPerVideo: 0
    };

    super(config, capabilities);

    try {
      const serviceAccount = JSON.parse(config.serviceAccountKey);
      const jwtClient = new JWT();
      jwtClient.fromJSON(serviceAccount);
      this.drive = google.drive({ version: 'v3', auth: jwtClient as any });
    } catch (error) {
      console.error('Failed to initialize Google Drive:', error);
    }
  }

  async uploadToDrive(base64Data: string, mimeType: string, prompt: string, provider: string): Promise<string> {
    const buffer = Buffer.from(base64Data, 'base64');
    const timestamp = new Date().toISOString().split('T')[0];
    const safePrompt = prompt.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${timestamp}_${provider}_${safePrompt}.${mimeType.split('/')[1]}`;

    const response = await this.drive.files.create({
      requestBody: {
        name: filename,
        parents: [this.folderId]
      },
      media: {
        mimeType: mimeType,
        body: buffer
      }
    });

    await this.drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    });

    return `https://drive.google.com/file/d/${response.data.id}/view`;
  }

  async generateImage(request: GenerationRequest): Promise<GenerationResponse> {
    return { success: false, error: 'DriveStorageProvider is for storage only. Use fal.ai or other providers for generation.' };
  }

  async generateVideo(request: GenerationRequest): Promise<GenerationResponse> {
    return { success: false, error: 'DriveStorageProvider is for storage only. Use fal.ai or other providers for generation.' };
  }
}

export async function uploadToDrive(base64Data: string, mimeType: string, prompt: string, provider: string): Promise<string> {
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY not configured');
  }

  const serviceAccount = JSON.parse(serviceAccountKey);
  console.log('Creating JWT client...');
  
  const scopes = ['https://www.googleapis.com/auth/drive'];
  
  const jwtClient = new JWT(
    serviceAccount.client_email,
    undefined,
    serviceAccount.private_key,
    scopes
  );
  
  console.log('Authorizing JWT client...');
  await jwtClient.authorize();
  const accessToken = jwtClient.credentials.access_token;
  console.log('Access token:', accessToken ? accessToken.substring(0, 20) + '...' : 'missing');
  
  if (!accessToken) {
    throw new Error('Failed to get access token');
  }
  
  console.log('Testing direct API call...');
  const axios = (await import('axios')).default;
  try {
    const response = await axios.post(
      'https://www.googleapis.com/upload/drive/v3/files',
      {
        name: 'test.txt',
        mimeType: 'text/plain'
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          uploadType: 'multipart'
        }
      }
    );
    console.log('Direct API call success:', response.data.id);
  } catch (directError: any) {
    console.error('Direct API call failed:', directError.response?.data || directError.message);
  }
  
  const drive = google.drive({ version: 'v3', auth: jwtClient as any });

  const folderId = '1CMNHy1qWJRawFGfbVL6NBOmvugV_KoEO';
  const buffer = Buffer.from(base64Data, 'base64');
  const timestamp = new Date().toISOString().split('T')[0];
  const safePrompt = prompt.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_');
  const ext = mimeType === 'video/mp4' ? 'mp4' : mimeType === 'image/png' ? 'png' : 'jpg';
  const filename = `${timestamp}_${provider}_${safePrompt}.${ext}`;

  console.log('Creating file in Drive...');
  let response;
  try {
    response = await drive.files.create({
      requestBody: {
        name: filename,
        parents: [folderId]
      },
      media: {
        mimeType: mimeType,
        body: Readable.from(buffer)
      }
    });
  } catch (driveError: any) {
    console.error('Drive API error:', driveError.message);
    console.error('Drive API error details:', JSON.stringify(driveError.response?.data || driveError));
    throw driveError;
  }

  const fileId = response.data.id;
  if (!fileId) {
    throw new Error('Failed to get file ID from Drive response');
  }

  await drive.permissions.create({
    fileId: fileId,
    requestBody: {
      role: 'reader',
      type: 'anyone'
    }
  });

  return `https://drive.google.com/file/d/${fileId}/view`;
}
