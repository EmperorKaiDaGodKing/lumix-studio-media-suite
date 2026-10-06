import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

/**
 * Health & Configuration endpoint
 */
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: !!process.env.GEMINI_API_KEY,
  });
});

/**
 * AI Cartoon & Anime Neural Style Transfer Endpoint
 * Uses @google/genai with gemini-3.1-flash-lite-image / gemini-3.1-flash-image
 */
app.post('/api/ai-anime-stylize', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', stylePreset = 'modern-anime', customPrompt } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ success: false, error: 'No image data provided' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: 'GEMINI_API_KEY is not configured in environment secrets. You can still use the real-time Algorithmic Anime Engine in the canvas.',
        missingApiKey: true,
      });
    }

    // Strip header prefix if present (data:image/jpeg;base64,...)
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');

    // Style prompt formulation based on requested style preset
    let styleDescription = 'Japanese anime illustration keyframe style, clean hand-drawn line art, expressive cartoon eyes, cel-shaded lighting, vibrant animated color palette, smooth anime skin tones';
    
    switch (stylePreset) {
      case 'modern-anime':
        styleDescription = 'High-end modern anime film animation keyframe, crisp contour ink line art, studio cel shading, vibrant cinematic lighting, beautiful expressive anime facial features';
        break;
      case 'ghibli':
        styleDescription = 'Studio Ghibli Hayao Miyazaki anime style, hand-painted aesthetic, soft gouache/watercolor texture, lush natural lighting, gentle cel animation line work';
        break;
      case 'shinkai':
        styleDescription = 'Makoto Shinkai anime movie aesthetic (Your Name / Weathering With You), luminous radiant sky lighting, golden hour lens bloom, hyper-detailed anime scenery and character illustration';
        break;
      case 'comic-toon':
        styleDescription = 'Western comic graphic novel cartoon style, bold thick pen-and-ink contour strokes, punchy pop-art colors, dynamic comic book cel shading';
        break;
      case 'classic-2d':
        styleDescription = 'Classic 90s Saturday-morning cartoon animation cel, flat 2D color fills, clean uniform black ink outlines, retro animated series look';
        break;
      case 'cyberpunk':
        styleDescription = 'Cyberpunk manga anime aesthetic (Akira / Ghost in the Shell), bold neo-tokyo ink outlines, electric cyan and neon magenta lighting contrasts, futuristic anime styling';
        break;
      case 'kawaii':
        styleDescription = 'Pastel kawaii manga portrait illustration, soft blush highlights, delicate fine line art, dreamy lifted shadows, cute aesthetic';
        break;
    }

    const promptText = customPrompt
      ? `Transform this image into a cartoon anime illustration: ${styleDescription}. Additional user direction: ${customPrompt}. Keep the person's pose, composition, hair color, and facial likeness recognizable while rendering them completely as a 2D animated cartoon.`
      : `Transform this image into a stylized cartoon anime illustration: ${styleDescription}. Preserve the subject's pose, facial structure, expression, and clothing, but render them completely in a 2D hand-drawn animated cartoon style.`;

    const ai = new GoogleGenAI({ apiKey });

    // Primary model for image-to-image cartoon rendering
    const modelName = 'gemini-3.1-flash-lite-image';

    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType,
            },
          },
          {
            text: promptText,
          },
        ],
      },
    });

    const parts = response.candidates?.[0]?.content?.parts || [];
    let generatedImageBase64: string | null = null;
    let outputMime = 'image/png';
    let textDescription = '';

    for (const part of parts) {
      if (part.inlineData?.data) {
        generatedImageBase64 = part.inlineData.data;
        if (part.inlineData.mimeType) {
          outputMime = part.inlineData.mimeType;
        }
      } else if (part.text) {
        textDescription += part.text;
      }
    }

    if (generatedImageBase64) {
      return res.json({
        success: true,
        imageBase64: `data:${outputMime};base64,${generatedImageBase64}`,
        mimeType: outputMime,
        description: textDescription || 'AI cartoon anime style transfer completed.',
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Model did not return an image part in the response.',
      details: textDescription,
    });
  } catch (err: any) {
    console.error('AI Anime Stylize error:', err);
    const errorMessage = err?.message || 'Unknown error during style transfer';
    const isPaidModelError =
      errorMessage.includes('RESOURCE_EXHAUSTED') ||
      errorMessage.includes('quota') ||
      errorMessage.includes('paid') ||
      errorMessage.includes('tier');

    return res.status(500).json({
      success: false,
      error: errorMessage,
      requiresPaidKey: isPaidModelError,
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Lumix Studio server running on port ${PORT}`);
  });
}

startServer();
