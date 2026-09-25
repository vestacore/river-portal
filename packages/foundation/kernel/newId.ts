const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/**
 * Time-ordered unique identifier (ULID layout: 10 time characters + 16 random characters),
 * prefixed with the aggregate kind, e.g. `need_01JABC...`. Sorts by creation time.
 */
export function newId(prefix: string, at: Date = new Date()): string {
  let time = at.getTime();
  let timePart = '';
  for (let i = 0; i < 10; i++) {
    timePart = alphabet.charAt(time % 32) + timePart;
    time = Math.floor(time / 32);
  }
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let randomPart = '';
  for (const byte of bytes) randomPart += alphabet.charAt(byte % 32);
  return `${prefix}_${timePart}${randomPart}`;
}
