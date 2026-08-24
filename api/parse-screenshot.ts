import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

const aiResponseSchema = z.object({
  symbol: z.literal('XAUUSD'),
  direction: z.enum(['BUY', 'SELL']),
  entryType: z.enum(['ZONE', 'SINGLE']),
  bestEntry: z.number().positive().optional(),
  worstEntry: z.number().positive().optional(),
  singleEntry: z.number().positive().optional(),
  stopLoss: z.number().positive(),
  takeProfits: z.array(
    z.object({
      label: z.string(),
      price: z.number().positive(),
    }),
  ).min(1),
});

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count += 1;
  return true;
}

async function parseWithOpenAI(base64Image: string, mimeType: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You extract XAUUSD/GOLD trading signals from screenshots. Return JSON only with:
{
  "symbol": "XAUUSD",
  "direction": "BUY" | "SELL",
  "entryType": "ZONE" | "SINGLE",
  "bestEntry": number | null,
  "worstEntry": number | null,
  "singleEntry": number | null,
  "stopLoss": number,
  "takeProfits": [{ "label": "TP1", "price": number }]
}
Rules:
- LONG maps to BUY, SHORT maps to SELL
- For entry zones use bestEntry and worstEntry; for single entry use singleEntry
- BUY: bestEntry is lower price, worstEntry is higher
- SELL: bestEntry is higher price, worstEntry is lower
- Extract all visible TPs (TP1, TP2, etc.)
- Do not calculate lot, risk, profit, or CRV
- If a required field cannot be detected, use null and we will handle errors`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract the trading signal from this screenshot.',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`AI provider error: ${err}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty AI response');
  return JSON.parse(content);
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ?? 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
  }

  try {
    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      req.on('end', () => resolve());
      req.on('error', reject);
    });

    const buffer = Buffer.concat(chunks);
    const contentType = req.headers['content-type'] ?? '';

    let imageBuffer: Buffer;
    let mimeType = 'image/png';

    if (contentType.includes('multipart/form-data')) {
      const boundary = contentType.split('boundary=')[1];
      const body = buffer.toString('binary');
      const parts = body.split(`--${boundary}`);
      const filePart = parts.find((p) => p.includes('Content-Type: image'));
      if (!filePart) {
        return res.status(400).json({ error: 'No image found in upload' });
      }
      const headerEnd = filePart.indexOf('\r\n\r\n');
      const headers = filePart.slice(0, headerEnd);
      const mimeMatch = headers.match(/Content-Type:\s*(image\/[\w+.-]+)/i);
      if (mimeMatch) mimeType = mimeMatch[1];
      imageBuffer = Buffer.from(filePart.slice(headerEnd + 4).replace(/\r\n$/, ''), 'binary');
    } else {
      imageBuffer = buffer;
      if (contentType.startsWith('image/')) mimeType = contentType;
    }

    if (!imageBuffer.length) {
      return res.status(400).json({ error: 'Empty image upload' });
    }

    const base64Image = imageBuffer.toString('base64');
    const raw = await parseWithOpenAI(base64Image, mimeType);
    const parsed = aiResponseSchema.safeParse(raw);

    if (!parsed.success) {
      return res.status(422).json({
        error: 'Could not extract a valid signal from screenshot',
        details: parsed.error.issues,
      });
    }

    return res.status(200).json(parsed.data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('OPENAI_API_KEY')) {
      return res.status(503).json({ error: 'AI parser is not configured on the server' });
    }
    return res.status(500).json({ error: message });
  }
}
