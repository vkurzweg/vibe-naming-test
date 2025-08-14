import api from './api';

// Fetch the current Gemini config (basePrompt, principles, dos, donts)
export const fetchGeminiConfig = () =>
  api.get('/api/gemini/config').then(res => res.data);

// Add a new item (principle, do, or don't) to the config
export const addConfigItem = (element, text) =>
  api.post(`/api/gemini/config/${element}`, { text });

// Update (edit/toggle) an existing item by id
export const updateConfigItem = (element, id, data) =>
  api.patch(`/api/gemini/config/${element}/${id}`, data);

// Delete an item by id
export const deleteConfigItem = (element, id) =>
  api.delete(`/api/gemini/config/${element}/${id}`);

// Update the base prompt text or activation
export const updateBasePrompt = (data) =>
  api.patch('/api/gemini/config/basePrompt', data);

// Generate names using Gemini (with the composed prompt)
export async function fetchGeminiNames(prompt) {
  const response = await api.post('/api/gemini/naming', { prompt });
  return response.data;
}