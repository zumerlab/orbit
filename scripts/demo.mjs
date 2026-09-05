import { createServer } from 'node:http';
import { access, readFile, realpath, stat } from 'node:fs/promises';
import { dirname, extname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const host = '127.0.0.1';
const port = Number(process.env.PORT ?? 5174);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535.');
}

for (const file of ['dist/orbit.css', 'dist/orbit.js']) {
  try {
    await access(join(root, file));
  } catch {
    throw new Error(`Missing ${file}. Run npm run compile, or use npm run demo to compile and start.`);
  }
}

const roots = new Map(await Promise.all(['examples', 'dist'].map(async (name) => [
  name, await realpath(join(root, name)),
])));
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const server = createServer(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const fail = (status, message) => {
    res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(req.method === 'HEAD' ? undefined : message);
  };
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return fail(405, 'Method not allowed');
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, `http://${host}:${port}`).pathname);
  } catch {
    return fail(400, 'Invalid URL');
  }
  if (pathname === '/') pathname = '/examples/playground.html';
  const parts = pathname.split('/');
  const base = roots.get(parts[1]);
  if (!base || pathname.includes('\\') || pathname.includes('\0') || parts.some((part) => part === '..' || part.startsWith('.'))) {
    return fail(404, 'Not found');
  }

  try {
    const file = await realpath(join(base, ...parts.slice(2)));
    const local = relative(base, file);
    if (!local || local.startsWith(`..${sep}`) || local === '..' || !(await stat(file)).isFile()) {
      return fail(404, 'Not found');
    }
    const type = mime[extname(file)] ?? 'application/octet-stream';
    let body = await readFile(file);
    if (extname(file) === '.html') {
      body = Buffer.from(body.toString('utf8').replaceAll('https://unpkg.com/@zumer/orbit@latest/dist/', '/dist/'));
    }
    res.writeHead(200, { 'Content-Type': type, 'Content-Length': body.length });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return fail(404, 'Not found');
    console.error('Unable to serve demo asset:', error.message);
    fail(500, 'Unable to read demo asset');
  }
});

server.on('error', (error) => {
  console.error(error.code === 'EADDRINUSE'
    ? `Port ${port} is in use. Try PORT=${port + 1} npm run demo.`
    : error.message);
  process.exitCode = 1;
});
server.listen(port, host, () => {
  console.log(`Orbit core demo: http://${host}:${port}`);
  console.log('Serving the local build. Press Ctrl+C to stop.');
});
