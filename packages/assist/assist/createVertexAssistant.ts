import { redactPii } from '@river/privacy';
import { createFallbackAssistant } from './createFallbackAssistant.ts';
import { snippetKinds, type SnippetKind } from './types/SnippetKind.ts';
import type { SnippetAssistant } from './types/SnippetAssistant.ts';
import type { SnippetSuggestion } from './types/SnippetSuggestion.ts';

const instruction = `You write short public feed items for a charity portal that connects people in need with people who give.
Rules:
- Use only the facts in the report. Never invent numbers, places or people.
- Never include names, villages, streets, phone numbers or anything identifying. Oblast level only.
- Dignity, agency and warmth; no pity, no drama, no calls to guilt. Credit the chain of people, not a hero.
- Each item stands alone, at most 240 characters, in British English ("en") and natural native Ukrainian ("uk"), with the same meaning.
- Mix kinds when the report supports it: delivery, thanks (only if the report quotes thanks), costs (honest numbers), milestone, update.`;

const schema = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          kind: { type: 'string', enum: [...snippetKinds] },
          en: { type: 'string' },
          uk: { type: 'string' },
        },
        required: ['kind', 'en', 'uk'],
      },
    },
  },
  required: ['items'],
};

/**
 * Gemini on Vertex AI (ADR-0013) using the runtime service account; no API keys. Falls back to the
 * extractive assistant if the call fails, so editors are never blocked.
 */
export function createVertexAssistant(options: { project: string; location: string; model: string }): SnippetAssistant {
  const fallback = createFallbackAssistant();
  return async (request) => {
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ vertexai: true, project: options.project, location: options.location });
      const prompt = [
        `Report title (en): ${redactPii(request.title['en-GB'])}`,
        `Report title (uk): ${redactPii(request.title.uk)}`,
        `Report (en):\n${redactPii(request.body['en-GB'])}`,
        `Report (uk):\n${redactPii(request.body.uk)}`,
        `Facts: ${JSON.stringify(request.facts)}`,
        `Write up to ${request.maxItems} items.`,
      ].join('\n\n');
      const response = await ai.models.generateContent({
        model: options.model,
        contents: prompt,
        config: { systemInstruction: instruction, responseMimeType: 'application/json', responseJsonSchema: schema, temperature: 0.4 },
      });
      const parsed = JSON.parse(response.text ?? '{}') as { items?: Array<{ kind: string; en: string; uk: string }> };
      const suggestions: SnippetSuggestion[] = (parsed.items ?? [])
        .filter((i) => (snippetKinds as readonly string[]).includes(i.kind) && i.en && i.uk)
        .slice(0, request.maxItems)
        .map((i) => ({ kind: i.kind as SnippetKind, text: { 'en-GB': redactPii(i.en).slice(0, 280), uk: redactPii(i.uk).slice(0, 280) } }));
      return { source: 'vertex', model: options.model, suggestions };
    } catch (error) {
      console.error('Vertex AI suggestion failed; using fallback', error instanceof Error ? error.message : error);
      return fallback(request);
    }
  };
}
