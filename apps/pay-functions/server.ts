// One function of the payment river per process (adr/records/ADR-0025). The function is chosen by
// PAY_FUNCTION; the code that decides anything lives in @river/pay-runtime — this file is the skin:
// it turns an HTTP request (a call, a webhook, an Eventarc event, a scheduler tick) into a plain
// request, runs the one handler this process was started for, and writes the answer back.
import { createServer } from 'node:http';
import { getPayRuntime, payFunctionNames, payFunctions, type PayFunctionName } from '@river/pay-runtime';

const name = process.env.PAY_FUNCTION ?? '';
if (!(payFunctionNames as readonly string[]).includes(name)) {
  console.error(JSON.stringify({ severity: 'CRITICAL', message: `PAY_FUNCTION must be one of ${payFunctionNames.join(', ')}` }));
  process.exit(1);
}
const handler = payFunctions[name as PayFunctionName];
const bodyLimit = 262_144; // bytes: a gesture, a webhook or an event is small

// Bodies, headers and secrets are never logged: a line says which function answered what, and how fast.
const log = (severity: 'INFO' | 'WARNING' | 'ERROR', message: string, fields: Record<string, unknown> = {}) =>
  console.log(JSON.stringify({ severity, message, function: name, ...fields }));

const server = createServer((request, response) => {
  const started = Date.now();
  const answer = (status: number, body: Record<string, unknown>) => {
    response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
    response.end(JSON.stringify(body));
    if (request.url !== '/ready') log(status >= 500 ? 'ERROR' : status >= 400 ? 'WARNING' : 'INFO', 'answered', { status, ms: Date.now() - started, ...(status >= 400 && typeof body.error === 'string' ? { error: body.error } : {}) });
  };
  if (request.method === 'GET' && request.url === '/ready') return answer(200, { ready: true });

  const chunks: Buffer[] = [];
  let size = 0;
  request.on('data', (chunk: Buffer) => {
    size += chunk.length;
    if (size <= bodyLimit) chunks.push(chunk);
  });
  request.on('end', () => {
    if (size > bodyLimit) return answer(413, { error: 'the body is too large' });
    const headers: Record<string, string | undefined> = {};
    for (const [key, value] of Object.entries(request.headers)) headers[key.toLowerCase()] = Array.isArray(value) ? value.join(',') : value;
    getPayRuntime()
      .then((runtime) => handler(runtime, { method: request.method ?? 'GET', path: request.url ?? '/', headers, body: Buffer.concat(chunks).toString('utf8') }))
      .then((result) => answer(result.status, result.body))
      .catch((error: unknown) => {
        // What went wrong is for the log; the caller — who may be anyone, at a webhook — is told only that it did.
        log('ERROR', 'failed', { error: error instanceof Error ? error.message : String(error) });
        answer(500, { error: 'the function failed' });
      });
  });
  request.on('error', () => answer(400, { error: 'the request could not be read' }));
});

// The settings are read before the first request: a function that is wrongly configured does not
// become ready, so a bad deployment fails where it is made and never answers a payment with an error.
const port = Number(process.env.PORT ?? 8080);
getPayRuntime()
  .then(() => server.listen(port, () => log('INFO', `listening on ${port}`)))
  .catch((error: unknown) => {
    console.error(JSON.stringify({ severity: 'CRITICAL', message: error instanceof Error ? error.message : String(error), function: name }));
    process.exit(1);
  });
process.on('SIGTERM', () => server.close(() => process.exit(0)));
