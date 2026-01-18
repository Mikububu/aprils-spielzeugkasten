import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { ProviderFactory } from './providers/index.js';
import { GenerationRequest } from './types/models.js';
import { verifySupabaseToken, createAnonymousSession } from './services/supabase.js';

dotenv.config();

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

    // Authenticate via Supabase (or create anonymous session)
    const authHeader = req.headers.authorization;
    const authResult = await verifySupabaseToken(authHeader);
    
    if (!authResult.valid) {
      // Create anonymous session for public access (no payment required yet)
      const anonSession = await createAnonymousSession();
      (req as any).userId = anonSession.userId;
      (req as any).sessionId = anonSession.sessionId;
    } else {
      (req as any).userId = authResult.userId;
    }

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
  // #region agent log
  const routes: any[] = [];
  app._router.stack.forEach((middleware: any) => {
    if (middleware.route) {
      routes.push({path: middleware.route.path, methods: Object.keys(middleware.route.methods)});
    }
  });
  
  console.log(`\n🚀 April's Spielzeugkasten Backend (Minimax AI)`);
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`\n Available providers: ${ProviderFactory.getAvailableProviders().join(', ')}`);
  console.log(`\n Ready to generate! 🎨🎬\n`);
});

export default app;
