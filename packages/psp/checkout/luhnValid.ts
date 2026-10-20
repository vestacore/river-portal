/** Whether a card number passes the Luhn check. An empty or short number does not. */
export function luhnValid(input: string): boolean {
  const d = input.replace(/\D/g, '');
  if (d.length < 12) return false;
  let sum = 0;
  let double = false;
  for (let i = d.length - 1; i >= 0; i -= 1) {
    let n = Number(d[i]);
    if (double) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
    double = !double;
  }
  return sum % 10 === 0;
}
