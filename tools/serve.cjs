const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const files = {'/': ['index.html', 'text/html; charset=utf-8'], '/index.html': ['index.html', 'text/html; charset=utf-8'], '/style.css': ['style.css', 'text/css; charset=utf-8'], '/main.js': ['main.js', 'text/javascript; charset=utf-8']};
const server = http.createServer((req, res) => {
  const route = files[new URL(req.url, 'http://localhost').pathname];
  if (!route) {res.writeHead(404); res.end('Nicht gefunden'); return;}
  if (req.method !== 'GET' && req.method !== 'HEAD') {res.writeHead(405); res.end(); return;}
  res.setHeader('Content-Type', route[1]);
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method === 'HEAD') {res.end(); return;}
  fs.createReadStream(path.join(__dirname, '..', 'app', route[0])).pipe(res);
});
server.listen(4796, '127.0.0.1', () => console.log('TV-Vorschau: http://127.0.0.1:4796'));
