// GeminiPromptComposer.js

/**
 * Compose the prompt for Gemini using admin config and user input..
 * @param {Object} config - The Gemini config object from the backend.
 * @param {string} userInput - The user's input/description.
 * @returns {string} The composed prompt string.
 */
export function composeGeminiPrompt(config, userInput) {
    if (!config) return userInput;
  
    return `
  ${config.basePrompt?.active ? config.basePrompt.text : ''}
  
  Principles:
  ${(config.principles || []).filter(p => p.active).map(p => '- ' + p.text).join('\n')}
  
  Do:
  ${(config.dos || []).filter(d => d.active).map(d => '- ' + d.text).join('\n')}
  
  Don't:
  ${(config.donts || []).filter(d => d.active).map(d => '- ' + d.text).join('\n')}
  
  User description: ${userInput}
  
  Generate 5 creative, on-brand name ideas.
    `.trim();
}