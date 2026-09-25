// @river/runtime — wiring for applications: store driver, projectors, assistant, demo seed.
export { surfaces } from './types/Surface.ts';
export type { Surface } from './types/Surface.ts';
export type { RuntimeConfig } from './types/RuntimeConfig.ts';
export type { Runtime } from './types/Runtime.ts';
export { readConfig } from './readConfig.ts';
export { allProjectors } from './allProjectors.ts';
export { publicActor } from './publicActor.ts';
export { staffActor } from './staffActor.ts';
export { commandEnv } from './commandEnv.ts';
export { createAssistant } from './createAssistant.ts';
export { seedDemo } from './seedDemo.ts';
export { getRuntime } from './getRuntime.ts';
