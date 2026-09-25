import { createFallbackAssistant, createVertexAssistant, type SnippetAssistant } from '@river/assist';
import type { RuntimeConfig } from './types/RuntimeConfig.ts';

/** Vertex AI when configured, otherwise the offline extractive assistant. */
export function createAssistant(config: RuntimeConfig): SnippetAssistant {
  if (config.ai === 'vertex' && config.projectId) {
    return createVertexAssistant({ project: config.projectId, location: config.aiLocation, model: config.aiModel });
  }
  return createFallbackAssistant();
}
