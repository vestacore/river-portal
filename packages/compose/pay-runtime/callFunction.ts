const metadata = 'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity';

/**
 * Calls another function of the river over HTTP as this service: an identity token for that
 * function is taken from the metadata server and sent as the bearer. Works only on Google Cloud —
 * elsewhere there is no identity to call with, and the call fails rather than going out unsigned.
 */
export async function callFunction(url: string, request: { headers: Record<string, string>; body: string }): Promise<{ status: number; body: string }> {
  const token = await fetch(`${metadata}?audience=${encodeURIComponent(url)}`, { headers: { 'Metadata-Flavor': 'Google' } });
  if (!token.ok) throw new Error(`No identity token for ${url} (${token.status})`);
  const response = await fetch(url, { method: 'POST', headers: { ...request.headers, authorization: `Bearer ${await token.text()}` }, body: request.body });
  return { status: response.status, body: await response.text() };
}
