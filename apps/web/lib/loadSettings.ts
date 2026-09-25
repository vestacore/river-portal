import { cache } from 'react';
import { getRuntime, loadSettings as readRuntimeSettings } from '@river/runtime';
import type { SettingsSnapshot } from '@river/settings';

/** The organisation's settings, read once per request. */
export const loadSettings = cache(async (): Promise<SettingsSnapshot> => readRuntimeSettings(await getRuntime()));
