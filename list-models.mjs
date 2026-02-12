import { GoogleGenAI } from '@google/genai';

const apiKey = 'AIzaSyBfotmOpi45icy9MkVtNRO35dzTbfjCACc';
const ai = new GoogleGenAI({ apiKey });

console.log('Fetching available models...\n');

try {
  const response = await ai.models.list();
  console.log('Response:', JSON.stringify(response, null, 2));
} catch (error) {
  console.error('Error:', error.message);
  console.error('Full error:', error);
}
