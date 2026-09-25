/** Splits plain text into sentences (good enough for extractive summaries in en-GB and uk). */
export function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?…»”])\s+(?=[A-ZА-ЯІЇЄҐ«“0-9])/u)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}
