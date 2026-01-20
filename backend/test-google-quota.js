#!/usr/bin/env node

/**
 * Test Google API Quota and Functionality
 * Run: node test-google-quota.js
 */

import { GoogleGenAI } from '@google/genai';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || 'AIzaSyALmHE81M3w64-XablUB4ahLfOyFjN_2g0';

console.log('='.repeat(60));
console.log('GOOGLE API QUOTA TEST');
console.log('='.repeat(60));
console.log();

// Test 1: API Key Validity
console.log('TEST 1: API Key Validation');
console.log('-'.repeat(40));
try {
  const ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });
  console.log('✅ API key loaded successfully');
  console.log();
} catch (e) {
  console.log('❌ API key error:', e.message);
  process.exit(1);
}

// Test 2: List Available Models
console.log('TEST 2: Available Models');
console.log('-'.repeat(40));
try {
  const ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });
  console.log('Checking models list...');
  // Note: Google GenAI doesn't have a simple list endpoint
  // We'll test the models we need directly
  console.log('Will test directly: gemini-2.5-flash-image, veo-3.1-fast-generate-preview');
  console.log();
} catch (e) {
  console.log('⚠️  Could not list models:', e.message);
  console.log();
}

// Test 3: Image Generation Test
console.log('TEST 3: Image Generation (gemini-2.5-flash-image)');
console.log('-'.repeat(40));
async function testImageGeneration() {
  try {
    const ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });
    console.log('Generating test image...');
    
    const startTime = Date.now();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: 'A simple red apple on a white background, high quality' }]
      },
      config: {
        seed: 12345
      }
    });
    const duration = Date.now() - startTime;
    
    let foundImage = false;
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const size = part.inlineData.data.length;
          console.log(`✅ Image generated successfully!`);
          console.log(`   Size: ${(size / 1024).toFixed(1)} KB`);
          console.log(`   Time: ${(duration / 1000).toFixed(1)}s`);
          console.log(`   Seed: 12345`);
          foundImage = true;
          break;
        }
      }
    }
    
    if (!foundImage) {
      console.log('⚠️  No image in response');
      console.log('   Response:', JSON.stringify(response).substring(0, 200));
    }
    
    console.log();
    return foundImage;
  } catch (e) {
    console.log('❌ Image generation failed:', e.message);
    if (e.message.includes('429') || e.message.includes('RESOURCE_EXHAUSTED')) {
      console.log('   → QUOTA EXCEEDED');
    } else if (e.message.includes('403') || e.message.includes('PERMISSION_DENIED')) {
      console.log('   → BILLING/PERMISSION ERROR');
    }
    console.log();
    return false;
  }
}

// Test 4: Video Generation Test
console.log('TEST 4: Video Generation (veo-3.1-fast-generate-preview)');
console.log('-'.repeat(40));
async function testVideoGeneration() {
  try {
    const ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });
    console.log('Starting video generation...');
    
    const vidConfig = {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '16:9'
    };
    
    const startTime = Date.now();
    const operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: 'A simple animation of a bouncing ball',
      config: vidConfig
    });
    
    console.log('Operation started, polling for completion...');
    
    let attempts = 0;
    const MAX_ATTEMPTS = 60; // 5 minutes max
    
    while (!operation.done && attempts < MAX_ATTEMPTS) {
      attempts++;
      await new Promise(r => setTimeout(r, 5000));
      operation = await ai.operations.getVideosOperation({ operation });
      console.log(`   Poll ${attempts}: ${operation.status || 'processing'}`);
    }
    
    const duration = Date.now() - startTime;
    
    if (operation.done && operation.response?.generatedVideos?.[0]?.video?.uri) {
      console.log(`✅ Video generated successfully!`);
      console.log(`   Time: ${(duration / 1000).toFixed(1)}s`);
      console.log(`   URI: ${operation.response.generatedVideos[0].video.uri.substring(0, 50)}...`);
    } else if (operation.error) {
      console.log(`❌ Video generation error:`, operation.error.message);
      if (operation.error.message.includes('429') || operation.error.message.includes('quota')) {
        console.log('   → QUOTA EXCEEDED');
      }
    } else {
      console.log('⚠️  Video generation timed out or incomplete');
    }
    
    console.log();
    return true;
  } catch (e) {
    console.log('❌ Video generation failed:', e.message);
    if (e.message.includes('429') || e.message.includes('RESOURCE_EXHAUSTED')) {
      console.log('   → QUOTA EXCEEDED');
    } else if (e.message.includes('403') || e.message.includes('PERMISSION_DENIED')) {
      console.log('   → BILLING/PERMISSION ERROR - Check Google Cloud Billing');
    }
    console.log();
    return false;
  }
}

// Run Tests
async function runTests() {
  console.log();
  console.log('Starting tests...');
  console.log();
  
  const imageResult = await testImageGeneration();
  await testVideoGeneration();
  
  console.log('='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Image Generation: ${imageResult ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`Google Project:spielzeugkasten`);
  console.log();
  console.log('Next Steps:');
  console.log('- If image/video failed, check Google Cloud Console quotas');
  console.log('- Request quota increase if needed');
  console.log('- Add billing method if not configured');
  console.log();
}

runTests().catch(console.error);
