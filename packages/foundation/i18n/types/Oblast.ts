/**
 * A first-level administrative region of Ukraine. `ukStem` is the adjective stem from which
 * the Ukrainian case forms are built (e.g. `Харківськ` → Харківська / Харківської / Харківській).
 * Kyiv City has explicit forms instead.
 */
export type Oblast = {
  id: string;
  en: string;
  ukStem?: string;
  ukForms?: { nom: string; gen: string; loc: string };
};
