// @river/assist — AI assistance (Vertex AI Gemini) with an offline fallback. Advisory only.
export { snippetKinds } from './types/SnippetKind.ts';
export type { SnippetKind } from './types/SnippetKind.ts';
export type { SnippetRequest } from './types/SnippetRequest.ts';
export type { SnippetSuggestion } from './types/SnippetSuggestion.ts';
export type { SnippetAssistant } from './types/SnippetAssistant.ts';
export { splitSentences } from './splitSentences.ts';
export { createFallbackAssistant } from './createFallbackAssistant.ts';
export { createVertexAssistant } from './createVertexAssistant.ts';
