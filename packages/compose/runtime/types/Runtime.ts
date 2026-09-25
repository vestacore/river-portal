import type { SnippetAssistant } from '@river/assist';
import type { Projector } from '@river/log';
import type { DocStore } from '@river/store';
import type { RuntimeConfig } from './RuntimeConfig.ts';

/**
 * Everything an application needs at run time. `demoTrackingLinks` exists only for seeded demo data,
 * so testers can open a recipient's view; real tracking tokens are never kept.
 */
export type Runtime = {
  config: RuntimeConfig;
  store: DocStore;
  projectors: readonly Projector[];
  assistant: SnippetAssistant;
  demoTrackingLinks: Record<string, string>;
};
