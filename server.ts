import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { analyzeMotionWithGemini } from './src/server/geminiMotionService.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// CORS headers for GitHub Pages -> Separate Backend Server calls
app.use('/api', (req, res, next) => {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'ai-motionlab-api' });
});

// API endpoint for Gemini Biomechanical Analysis
app.post('/api/analyze-motion', async (req, res) => {
  try {
    const feedback = await analyzeMotionWithGemini(req.body);
    res.json(feedback);
  } catch (error: any) {
    console.warn('Server error analyzing motion:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze motion' });
  }
});

import fs from 'fs';

// Serve static frontend build assets
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  const indexPath = path.resolve(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send('AI MotionLab application is initializing.');
  }
});

const serverPort = Number(process.env.PORT) || 3000;
app.listen(serverPort, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${serverPort}`);
});
