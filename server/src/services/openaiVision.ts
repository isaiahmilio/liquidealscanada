import OpenAI from 'openai';

// Identifies a product from a photo using GPT-4o vision. Returns null if no key configured.

export interface ImageIdentification {
  identifiedProduct: string;
  category: string | null;
  confidence: number; // 0..1
}

const SYSTEM_PROMPT = `You are a product identifier for a Canadian liquidation marketplace.
Given a photo, respond with strict JSON of the form:
{"identifiedProduct": string, "category": string, "confidence": number}
- identifiedProduct: a short, search-friendly product name (brand + model + key descriptor) under 80 chars.
- category: one of: Electronics, Home, Kitchen, Clothing, Beauty, Tools, Toys, Sports, Office, Other.
- confidence: 0 (unsure) to 1 (certain).
Output only the JSON object, no prose.`;

let client: OpenAI | null = null;
function getClient(): OpenAI | null {
  if (client) return client;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.startsWith('sk-...')) return null;
  client = new OpenAI({ apiKey });
  return client;
}

const CATEGORY_PROMPT = `You are a product categorizer for a Canadian liquidation marketplace.
Given a product name and photo, respond with strict JSON:
{"category": string, "confidence": number}
- category: one of: Electronics, Home, Kitchen, Clothing, Beauty, Tools, Toys, Sports, Office, Other.
- confidence: 0 (unsure) to 1 (certain).
Output only the JSON object, no prose.`;

export async function identifyImage(buffer: Buffer, mimeType: string, productHint?: string): Promise<ImageIdentification | null> {
  const openai = getClient();
  if (!openai) return null;

  const dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;

  // When the seller provides a name, trust it — only ask AI for the category.
  if (productHint) {
    try {
      const res = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: CATEGORY_PROMPT },
          { role: 'user', content: [
            { type: 'text', text: `Product name: "${productHint}". What category does this belong to?` },
            { type: 'image_url', image_url: { url: dataUrl } },
          ]},
        ],
        max_tokens: 80,
      });
      const parsed = JSON.parse(res.choices[0]?.message?.content ?? '{}') as { category?: string; confidence?: number };
      return {
        identifiedProduct: productHint,
        category: parsed.category ? String(parsed.category) : null,
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 1.0,
      };
    } catch (err) {
      console.error('[openaiVision] category failed:', err instanceof Error ? err.message : err);
      return { identifiedProduct: productHint, category: null, confidence: 1.0 };
    }
  }

  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: [
          { type: 'text', text: 'Identify this product.' },
          { type: 'image_url', image_url: { url: dataUrl } },
        ]},
      ],
      max_tokens: 200,
    });
    const text = res.choices[0]?.message?.content ?? '';
    const parsed = JSON.parse(text) as Partial<ImageIdentification>;
    if (!parsed.identifiedProduct) return null;
    return {
      identifiedProduct: String(parsed.identifiedProduct).slice(0, 200),
      category: parsed.category ? String(parsed.category) : null,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
    };
  } catch (err) {
    console.error('[openaiVision] identify failed:', err instanceof Error ? err.message : err);
    return null;
  }
}
