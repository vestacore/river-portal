/** A card number grouped by four as the payer types it (American Express by 4-6-5), at most 19 digits. */
export function formatCardNumber(input: string): string {
  const d = input.replace(/\D/g, '').slice(0, 19);
  if (/^3[47]/.test(d)) return [d.slice(0, 4), d.slice(4, 10), d.slice(10, 15)].filter(Boolean).join(' ');
  return d.replace(/(\d{4})(?=\d)/g, '$1 ');
}
