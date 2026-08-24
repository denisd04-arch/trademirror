import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { normalizeAiResponse } from '../src/parsers/normalizeAiResponse';

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const requestSchema = z.object({
  image: z.string().min(1),
  mimeType: z.string().regex(/^image\/(png|jpeg|jpg|webp|gif)$/i),
});

function logDev(message: string, meta?: Record<string, unknown>) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[parse-screenshot] ${message}`, meta ?? '');
  }
}

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

  logDev('AI request started', { mimeType, imageSize: base64Image.length });

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
          content: `You extract XAUUSD/GOLD trading signals from Telegram-style screenshots.
Return JSON only:
{
  "symbol": "XAUUSD" | "GOLD" | null,
  "direction": "BUY" | "SELL" | "LONG" | "SHORT" | null,
  "entryType": "ZONE" | "SINGLE" | null,
  "bestEntry": number | null,
  "worstEntry": number | null,
  "singleEntry": number | null,
  "stopLoss": number | null,
  "takeProfits": [{ "label": "TP1", "price": number }]
}
Rules:
- Extract all visible TPs (TP1, TP2, TP3, TP4, etc.)
- For entry zones like "4585 / 4582" return both values (do not calculate middle)
- LONG = BUY, SHORT = SELL, GOLD = XAUUSD
- Use null for fields you cannot detect
- Do NOT calculate lot, risk, profit, or CRV`,
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extract the trading signal from this screenshot.' },
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64Image}` },
            },
          ],
        },
      ],
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    logDev('AI provider error', { status: response.status });
    throw new Error(`AI provider error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty AI response');

  logDev('AI response received');
  return JSON.parse(content);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ?? 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
  }

  try {
    logDev('request received');

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const parsedBody = requestSchema.safeParse(body);

    if (!parsedBody.success) {
      return res.status(400).json({ error: 'Could not read the screenshot.' });
    }

    const { image, mimeType } = parsedBody.data;
    const imageBuffer = Buffer.from(image, 'base64');

    logDev('image received', {
      mimeType,
      imageSize: imageBuffer.length,
    });

    if (!imageBuffer.length) {
      return res.status(400).json({ error: 'Could not read the screenshot.' });
    }

    if (imageBuffer.length > MAX_IMAGE_BYTES) {
      return res.status(400).json({ error: 'Screenshot is too large. Maximum size is 10MB.' });
    }

    const raw = await parseWithOpenAI(image, mimeType);
    const normalized = normalizeAiResponse(raw);

    logDev('schema validation result', { success: normalized.success });

    if (!normalized.success) {
      return res.status(422).json({
        error: 'Could not detect a valid trading signal.',
      });
    }

    return res.status(200).json(normalized.signal);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logDev('handler error', { message });

    if (message.includes('OPENAI_API_KEY')) {
      return res.status(503).json({ error: 'AI parser is not configured.' });
    }

    return res.status(500).json({ error: 'Could not detect a valid trading signal.' });
  }
}
