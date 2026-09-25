import { settingBoolean, settingText, type SettingsSnapshot } from '@river/settings';
import type { Dictionary } from '@/lib/dictionary/types';
import { QuickExit } from './QuickExit';

/** The quick exit on pages where someone may need to leave fast, when the organisation turns it on. */
export function QuickExitFor({ settings, dict }: { settings: SettingsSnapshot; dict: Dictionary }) {
  if (!settingBoolean(settings, 'help.quickExit')) return null;
  return <QuickExit url={settingText(settings, 'help.quickExitUrl')} label={dict.quickExit.label} hint={dict.quickExit.hint} />;
}
