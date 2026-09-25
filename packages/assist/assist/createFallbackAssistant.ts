import { redactPii } from '@river/privacy';
import type { SnippetAssistant } from './types/SnippetAssistant.ts';
import type { SnippetSuggestion } from './types/SnippetSuggestion.ts';

const paragraphs = (text: string) => redactPii(text).split(/\n{2,}/).map((p) => p.replace(/\s+/g, ' ').trim()).filter(Boolean);

/**
 * Deterministic, offline assistant used when Vertex AI is not configured (local development) and when
 * a Vertex call fails. It relies on report paragraphs being parallel across locales: the first two
 * paragraphs become a delivery item, the paragraph with costs a "honest numbers" item, and consented
 * thanks (already redacted) a thanks item.
 */
export function createFallbackAssistant(): SnippetAssistant {
  return async (request) => {
    const en = paragraphs(request.body['en-GB']);
    const uk = paragraphs(request.body.uk);
    const suggestions: SnippetSuggestion[] = [];
    if (en[0] && uk[0]) suggestions.push({ kind: 'delivery', text: { 'en-GB': [en[0], en[1]].filter(Boolean).join(' '), uk: [uk[0], uk[1]].filter(Boolean).join(' ') } });
    const costIndex = en.findIndex((p) => /\bcosts?\b/i.test(p) && p.includes('£'));
    if (costIndex >= 0 && uk[costIndex]) suggestions.push({ kind: 'costs', text: { 'en-GB': en[costIndex] as string, uk: uk[costIndex] as string } });
    const thanks = request.facts.consentedThanks;
    if (typeof thanks === 'string' && thanks) {
      suggestions.push({ kind: 'thanks', text: { 'en-GB': `“${thanks}” — words of thanks from ${request.facts.region}.`, uk: `«${thanks}» — слова подяки з ${request.facts.regionUkGenitive ?? 'України'}.` } });
    }
    return { source: 'fallback', model: 'extractive-v2', suggestions: suggestions.slice(0, request.maxItems) };
  };
}
