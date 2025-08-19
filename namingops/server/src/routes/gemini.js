const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const GeminiConfig = require('../models/GeminiConfig');
const router = express.Router();

// --- ADMIN CONFIG ENDPOINTS ---

// GET Gemini config (apiKey, defaultPrompt)
router.get('/config', async (req, res) => {
  try {
    let config = await GeminiConfig.findOne();
    if (!config) {
      config = await GeminiConfig.create({});
    }
   // Only return editable fields, not apiKey
    res.json({
      basePrompt: config.basePrompt || { text: '', active: true },
      principles: config.principles || [],
      dos: config.dos || [],
      donts: config.donts || []
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch Gemini config' });
  }
});

// POST Gemini config (save basePrompt, principles, dos, donts)
router.post('/config', async (req, res) => {
  try {
    const { basePrompt, principles, dos, donts } = req.body;
    let config = await GeminiConfig.findOne();
    if (!config) {
      config = await GeminiConfig.create({});
    }
    if (basePrompt) config.basePrompt = basePrompt;
    if (principles) config.principles = principles;
    if (dos) config.dos = dos;
    if (donts) config.donts = donts;
    await config.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save Gemini config' });
  }
});

// --- ADVANCED CONFIG ENDPOINTS ---

// ADD new item (POST /config/:element)
router.post('/config/:element', async (req, res) => {
  const { element } = req.params;
  const { text } = req.body;
  const config = await GeminiConfig.findOne();
  config[element].push({ text, active: true });
  await config.save();
  res.json(config);
});

// EDIT/TOGGLE item (PATCH /config/:element/:id)
router.patch('/config/:element/:id', async (req, res) => {
  const { element, id } = req.params;
  const { text, active } = req.body;
  const config = await GeminiConfig.findOne();
  const item = config[element].id(id);
  if (text !== undefined) item.text = text;
  if (active !== undefined) item.active = active;
  await config.save();
  res.json(config);
});

// DELETE item (DELETE /config/:element/:id)
router.delete('/config/:element/:id', async (req, res) => {
  const { element, id } = req.params;
  const config = await GeminiConfig.findOne();
  config[element].id(id).remove();
  await config.save();
  res.json(config);
});

// EDIT/TOGGLE basePrompt (PATCH /config/basePrompt)
router.patch('/config/basePrompt', async (req, res) => {
  const { text, active } = req.body;
  const config = await GeminiConfig.findOne();
  if (text !== undefined) config.basePrompt.text = text;
  if (active !== undefined) config.basePrompt.active = active;
  await config.save();
  res.json(config);
});

// --- GEMINI GENERATION ENDPOINTS ---

// POST /naming - Generate names using Gemini
router.post('/naming', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    // Use config.apiKey if present, else fallback to process.env
    const config = await GeminiConfig.findOne();
    const apiKey = config?.apiKey || process.env.GEMINI_API_KEY;
    const ai = new GoogleGenAI({ apiKey });

    const result = await ai.models.generateContent({
      model: 'models/gemini-1.5-pro-latest',
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });
    res.json(result);
  } catch (error) {
    console.error('Gemini API error:', error);
    res.status(500).json({ error: 'Failed to generate names', details: error.message });
  }
});

// GET /models - List available Gemini models
router.get('/models', async (req, res) => {
  try {
    // Use config.apiKey if present, else fallback to process.env
    const config = await GeminiConfig.findOne();
    const apiKey = config?.apiKey || process.env.GEMINI_API_KEY;
    const ai = new GoogleGenAI({ apiKey });

    const modelsList = await ai.models.list();
    res.json(modelsList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;