// AI Service - Works without API key using curated responses
// If you want to enable real AI, set GEMINI_API_KEY in your environment

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

function getApiKey(): string {
  let apiKey = '';
  try {
    apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;
  } catch {}

  if (!apiKey && typeof process !== 'undefined') {
    apiKey = process.env?.GEMINI_API_KEY || process.env?.API_KEY || '';
  }

  return apiKey && apiKey !== 'PLACEHOLDER_API_KEY' ? apiKey : '';
}

async function generateText(prompt: string): Promise<string | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini request failed with HTTP ${response.status}`);
    }

    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text ?? '')
      .join('')
      .trim() || null;
  } catch (error) {
    console.warn('Gemini request unavailable, using curated response:', error);
    return null;
  }
}

export const getCulturalInsight = async (title: string, artist: string, description: string): Promise<string> => {
  try {
    const response = await generateText(
      `Provide a detailed cultural and historical analysis of a fictional artwork titled "${title}" by "${artist}". The description of the piece is: "${description}". Focus on potential influences, symbolism, and its place in modern art history. Format the response as a short educational essay.`
    );
    if (response) return response;
  } catch (error) {
    console.warn("AI insight unavailable, using curated response:", error);
  }
  return getFallbackInsight(title, artist, description);
};

export const getGalleryGuideResponse = async (userMessage: string, history: { role: string, parts: { text: string }[] }[]): Promise<string> => {
  try {
    const response = await generateText(userMessage);
    if (response) return response;
  } catch (error) {
    console.warn("AI assistant unavailable, using curated response:", error);
  }
  return getFallbackGuideResponse(userMessage);
};

export const generateBrandStory = async (appName: string): Promise<string> => {
  try {
    const response = await generateText(
      `Generate a sophisticated and inspiring brand story for a digital art platform named "${appName}". Focus on themes of digital craftsmanship, the intersection of art and technology, and the preservation of creative legacy. Format it as a short, elegant narrative.`
    );
    if (response) return response;
  } catch (error) {
    console.warn("AI brand story unavailable, using curated response:", error);
  }
  return getFallbackBrandStory(appName);
};

// --- Curated fallback responses ---

function getFallbackInsight(title: string, artist: string, description: string): string {
  return `"${title}" by ${artist} represents a compelling intersection of contemporary vision and timeless artistic tradition. ${description ? `The piece — described as "${description}" — ` : 'This work '}invites viewers into a dialogue between form and meaning, drawing on influences that span from classical European masters to modern abstract expressionism.\n\nThe artist's approach reflects a deep awareness of art history while pushing boundaries into new territory. The composition speaks to themes of identity, transformation, and the human experience — universal concerns that have driven artistic expression for centuries.\n\nIn the context of modern art history, this work sits at a fascinating crossroads where digital-age sensibilities meet traditional craftsmanship, making it a noteworthy contribution to contemporary discourse.`;
}

function getFallbackGuideResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return "Welcome to ArtForge! 🎨 I'm your gallery guide. I can help you explore our collection, learn about different art movements, or find the perfect piece that speaks to you. What interests you today?";
  }
  if (lower.includes('recommend') || lower.includes('suggest')) {
    return "I'd recommend exploring our curated collections! Each piece in our gallery has been carefully selected to represent the best of contemporary and classical art. Try browsing by style — whether you're drawn to bold abstract expressionism, serene landscapes, or thought-provoking modern pieces, there's something here for every taste.";
  }
  if (lower.includes('art') || lower.includes('style') || lower.includes('movement')) {
    return "Art is a magnificent journey through human expression! From the Renaissance masters who perfected perspective and light, to the Impressionists who captured fleeting moments, to today's digital artists pushing boundaries — every movement tells the story of its era. Our gallery celebrates this rich tapestry of creativity across all periods and styles.";
  }
  if (lower.includes('buy') || lower.includes('purchase') || lower.includes('price')) {
    return "Great taste! To purchase artwork, simply click on any piece you love to see its details, then use the 'Add to Cart' option. We offer secure transactions and worldwide shipping. Each piece comes with a certificate of authenticity. Feel free to ask me about any specific artwork!";
  }
  return "That's a wonderful question! Art has the power to transform how we see the world. I'm here to help you navigate our gallery and discover pieces that resonate with you. Feel free to ask about any artwork, artist, or style — I'm always happy to share insights and help you explore the world of art. 🖼️";
}

function getFallbackBrandStory(appName: string): string {
  return `${appName} was born from a singular vision: to create a space where art transcends physical boundaries and becomes accessible to all.\n\nIn an age where technology and creativity converge, ${appName} stands as a digital atelier — a place where collectors discover masterworks, artists find their audience, and every visitor embarks on a journey through the boundless landscape of human expression.\n\nWe believe that every brushstroke tells a story, every sculpture holds a secret, and every digital creation opens a new frontier. ${appName} is more than a platform; it is a living gallery where the legacy of art is preserved, celebrated, and reimagined for generations to come.\n\nOur commitment is simple: to forge connections between creators and connoisseurs, bridging the gap between inspiration and appreciation through the transformative power of technology.`;
}
