import type { SnippetRequest } from './SnippetRequest.ts';
import type { SnippetSuggestion } from './SnippetSuggestion.ts';

/** Anything that can propose feed snippets. Suggestions are advisory; a human publishes. */
export type SnippetAssistant = (request: SnippetRequest) => Promise<{
  source: 'vertex' | 'fallback';
  model: string;
  suggestions: SnippetSuggestion[];
}>;
