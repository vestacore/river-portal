import type { SettingsSnapshot } from '@river/settings';
import type { DocStore } from '@river/store';
import type { CommandContext } from './CommandContext.ts';
import type { Projector } from './Projector.ts';

/** Everything a command needs: storage, the projectors to run, who is acting, and the settings in force. */
export type CommandEnv = {
  store: DocStore;
  projectors: readonly Projector[];
  ctx: CommandContext;
  settings: SettingsSnapshot;
};
