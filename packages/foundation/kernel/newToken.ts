/** Unguessable URL-safe token (256 bits), e.g. for a recipient's tracking link. */
export function newToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Buffer.from(bytes).toString('base64url');
}
