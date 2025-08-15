const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  text: { type: String, required: true },
  active: { type: Boolean, default: true }
});

const GeminiConfigSchema = new mongoose.Schema({
  apiKey: { type: String, default: '' }, // Store securely; consider encryption in production
  defaultPrompt: { type: String, default: '' },
  basePrompt: {
    text: { type: String, default: "You are a creative naming assistant for NamingHQ." },
    active: { type: Boolean, default: true }
  },
  principles: [itemSchema],
  dos: [itemSchema],
  donts: [itemSchema]
}, { timestamps: true });

module.exports = mongoose.model('GeminiConfig', GeminiConfigSchema);