// Model configurations
export const MODELS = {
  PRO: 'gemini-2.5-flash',
  FLASH: 'gemini-2.5-flash',
} as const;

// Create a unified interface that matches the existing GoogleGenAI usage
// but routes requests through our backend proxy instead of calling Google directly
export const ai = {
  models: {
    generateContent: async ({ model, contents }: { model: string; contents: string | any[] }) => {
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ model, contents }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        return { text: data.text };
      } catch (error) {
        console.error('Error calling backend API:', error);
        throw error;
      }
    }
  }
};

export default ai;
