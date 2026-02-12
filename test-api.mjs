import { GoogleGenAI } from '@google/genai';

const apiKey = 'AIzaSyBfotmOpi45icy9MkVtNRO35dzTbfjCACc';
const ai = new GoogleGenAI({ apiKey });

console.log('Testing Gemini API with correct model...');

try {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: 'Say hello in Japanese',
  });

  console.log('✓ API works!');
  console.log('Response:', response.text);
} catch (error) {
  console.error('✗ API Error:', error.message);
  console.error('Full error:', error);
}
