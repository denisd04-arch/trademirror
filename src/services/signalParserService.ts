import type { TradeSignal } from '../types';
import { safeValidateTradeSignal } from '../parsers/signalSchema';
import { parseTextSignal } from '../parsers/textParser';

export type ParseScreenshotResult =
  | { success: true; signal: TradeSignal }
  | { success: false; error: string; configurationError?: boolean };

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      if (!base64) {
        reject(new Error('Failed to read image'));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read image'));
    reader.readAsDataURL(file);
  });
}

export const signalParserService = {
  parseText(text: string) {
    return parseTextSignal(text);
  },

  async parseScreenshot(file: File): Promise<ParseScreenshotResult> {
    const apiKeyConfigured = import.meta.env.VITE_AI_PARSER_ENABLED === 'true';

    if (!apiKeyConfigured) {
      return {
        success: false,
        error: 'AI parser is not configured.',
        configurationError: true,
      };
    }

    try {
      const base64 = await fileToBase64(file);
      const mimeType = file.type || 'image/png';

      const response = await fetch('/api/parse-screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mimeType }),
      });

      const payload = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: payload.error ?? 'Could not detect a valid trading signal.',
        };
      }

      const previewUrl = URL.createObjectURL(file);
      const validated = safeValidateTradeSignal({
        ...payload,
        source: 'SCREENSHOT',
        screenshotUrl: previewUrl,
      });

      if (!validated.success) {
        return { success: false, error: validated.error };
      }

      return {
        success: true,
        signal: {
          ...validated.data,
          screenshotFile: file,
          screenshotUrl: previewUrl,
        },
      };
    } catch {
      return {
        success: false,
        error: 'Could not read the screenshot.',
      };
    }
  },
};
