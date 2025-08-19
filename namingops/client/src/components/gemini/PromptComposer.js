// GeminiPromptComposer.js

/**
 * Compose the prompt for Gemini using admin config and user input.
 * @param {Object} config - The Gemini config object from the backend.
 * @param {string} userInput - The user's input/description.
 * @returns {string} The composed prompt string.
 */

export function composeGeminiPrompt(config, userInput = '') {
  let prompt = '';
  if (config.basePrompt?.active) {
    prompt += config.basePrompt.text + '\n';
  }
  if (userInput) {
    prompt += `User Input:\n${userInput}\n`;
  }
  if (config.principles?.length) {
    prompt += 'Principles:\n' + config.principles.filter(p => p.active).map(p => '- ' + p.text).join('\n') + '\n';
  }
  if (config.dos?.length) {
    prompt += "Do's:\n" + config.dos.filter(d => d.active).map(d => '- ' + d.text).join('\n') + '\n';
  }
  if (config.donts?.length) {
    prompt += "Don'ts:\n" + config.donts.filter(d => d.active).map(d => '- ' + d.text).join('\n') + '\n';
  }
  return prompt.trim();
}