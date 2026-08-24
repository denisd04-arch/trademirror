import type { TradeSignal } from '../types';
import { safeValidateTradeSignal } from '../parsers/signalSchema';
import { parseTextSignal } from '../parsers/textParser';

export type ParseScreenshotResult =
  | { success: true; signal: TradeSignal }
  | { success: false; error: string; configurationError?: boolean };

export const signalParserService = {
  parseText(text: string) {
    return parseTextSignal(text);
  },

  async parseScreenshot(file: File): Promise<ParseScreenshotResult> {
    const apiKeyConfigured = import.meta.env.VITE_AI_PARSER_ENABLED === 'true';

    if (!apiKeyConfigured) {
      return {
        success: false,
        error:
          'AI screenshot parsing is not configured. Set OPENAI_API_KEY in Vercel and VITE_AI_PARSER_ENABLED=true, or use Manual Input / Paste Signal.',
        configurationError: true,
      };
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/parse-screenshot', {
        method: 'POST',
        body: formData,
      });

      const payload = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: payload.error ?? 'Failed to parse screenshot',
        };
      }

      const validated = safeValidateTradeSignal({
        ...payload,
        source: 'SCREENSHOT',
        screenshotUrl: URL.createObjectURL(file),
      });

      if (!validated.success) {
        return { success: false, error: validated.error };
      }

      return {
        success: true,
        signal: {
          ...validated.data,
          screenshotFile: file,
          screenshotUrl: URL.createObjectURL(file),
        },
      };
    } catch {
      return {
        success: false,
        error: 'Network error while parsing screenshot. Please try again.',
      };
    }
  },
};
