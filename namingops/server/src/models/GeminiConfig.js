const mongoose = require('mongoose');
const itemSchema = new mongoose.Schema({
  text: { type: String, required: true },
  active: { type: Boolean, default: true }
});
const configSchema = new mongoose.Schema({
  basePrompt: { text: { type: String, required: true }, active: { type: Boolean, default: true } },
  principles: [itemSchema],
  dos: [itemSchema],
  donts: [itemSchema]
});
module.exports = mongoose.model('GeminiConfig', configSchema);