const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const GeminiConfig = require('../models/GeminiConfig');
const router = express.Router();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// GET config
router.get('/config', async (req, res) => {
  let config = await GeminiConfig.findOne();
  if (!config) {
    // Create default config if not present
    config = await GeminiConfig.create({
      basePrompt: { text: "You are a creative naming assistant for NamingHQ.", active: true },
      principles: [],
      dos: [],
      donts: []
    });
  }
  res.json(config);
});

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

// POST /naming - Generate names using Gemini
router.post('/naming', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
  
    try {
      const result = await ai.models.generateContent({
        model: 'models/gemini-1.5-pro-latest', // or 'models/gemini-1.5-pro'
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });
      res.json(result);
    } catch (error) {
      console.error('Gemini API error:', error);
      res.status(500).json({ error: 'Failed to generate names', details: error.message });
    }
  });

  router.get('/models', async (req, res) => {
    try {
      const modelsList = await ai.models.list();
      res.json(modelsList);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

module.exports = router;