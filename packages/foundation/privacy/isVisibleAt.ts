import { visibilityLevels, type Visibility } from './types/Visibility.ts';

/** True when data at level `data` may be shown to an audience cleared for level `audience`. */
export function isVisibleAt(data: Visibility, audience: Visibility): boolean {
  return visibilityLevels.indexOf(data) >= visibilityLevels.indexOf(audience);
}
