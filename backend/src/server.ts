import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import axios from 'axios';
import { ProviderFactory } from './providers/index.js';
import { uploadToDrive } from './providers/drive.js';
import { saveToLocalFolder } from './providers/localfolder.js';
import { GenerationRequest } from './types/models.js';

dotenv.config();

async function downloadToBase64(url: string): Promise<string> {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(response.data).toString('base64');
}

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// CORS configuration - Allow all origins for now
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: false,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize providers
ProviderFactory.initialize();

// Root endpoint - API info
app.get('/', (req, res) => {
  res.json({
    name: "April's Spielzeugkasten API",
    version: "1.0.0",
    description: "Free uncensored AI image generation via Replicate",
    endpoints: {
      health: "GET /health",
      providers: "GET /api/providers",
      generate: "POST /api/generate",
      upload: "POST /api/upload"
    },
    providers: ProviderFactory.getAvailableProviders()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    availableProviders: ProviderFactory.getAvailableProviders()
  });
});

// Get all available providers and their capabilities
app.get('/api/providers', (req, res) => {
  try {
    const capabilities = ProviderFactory.getAllCapabilities();
    res.json({
      success: true,
      providers: capabilities
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Generate image or video
app.post('/api/generate', async (req, res) => {
  try {
    const request: GenerationRequest = req.body;

    // Validate request
    if (!request.prompt || !request.provider || !request.type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: prompt, provider, type'
      });
    }

    // Create anonymous session for public access
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    (req as any).sessionId = sessionId;

    // Get provider
    const provider = ProviderFactory.getProvider(request.provider);
    if (!provider) {
      return res.status(400).json({
        success: false,
        error: `Provider '${request.provider}' not available. Check server configuration.`
      });
    }

    // Validate request against provider capabilities
    const validation = provider.validateRequest(request);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error
      });
    }

    // Generate media
    let result;
    if (request.type === 'image') {
      result = await provider.generateImage(request);
    } else if (request.type === 'video') {
      result = await provider.generateVideo(request);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid type. Must be "image" or "video"'
      });
    }

    // Save to local folder if requested (instead of Drive)
    console.log('Local save check:', { success: result.success, hasData: !!result.data, uploadToDrive: request.uploadToDrive });
    if (result.success && result.data && request.uploadToDrive) {
      console.log('Saving to local folder...');
      try {
        let base64Data = result.data.mediaBase64;
        console.log('Initial base64Data:', base64Data ? 'exists' : 'undefined');
        
        // If provider returned a URL instead of base64, download it first
        if (!base64Data && result.data.mediaUrl) {
          console.log('Downloading image from URL...');
          base64Data = await downloadToBase64(result.data.mediaUrl);
          console.log('Download complete, base64 length:', base64Data?.length);
        }
        
        if (base64Data) {
          console.log('Saving to local folder...');
          const localPath = await saveToLocalFolder(
            base64Data,
            result.data.mimeType,
            request.prompt,
            request.provider
          );
          console.log('Local save complete:', localPath);
          result.data.localPath = localPath;
        } else {
          console.log('No base64 data available for local save');
        }
      } catch (saveError: any) {
        console.error('Local save failed:', saveError.message);
        // Continue with base64 response if local save fails
      }
    }

    res.json(result);
  } catch (error: any) {
    console.error('Generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// Upload and convert image to base64 (helper endpoint)
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const base64 = req.file.buffer.toString('base64');
    res.json({
      success: true,
      data: {
        base64,
        mimeType: req.file.mimetype
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 April's Spielzeugkasten Backend (Replicate - Free & Uncensored)`);
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`\n Available providers: ${ProviderFactory.getAvailableProviders().join(', ')}`);
  console.log(`\n Ready to generate! 🎨🎬\n`);
});

export default app;
