const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const https = require('node:https');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..', '.local');
fs.mkdirSync(root, {recursive: true});
const host = process.env.TV_HOST;
if (!host || require('node:net').isIP(host) !== 4 || !(/^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.)/).test(host)) throw new Error('TV_HOST muss eine private IPv4-Adresse im Heimnetz sein.');
const action = process.argv[2] || 'status';
function log(message) {
  const line = `[${new Date().toISOString()}] ${message}`;
  console.log(line);
  fs.appendFileSync(path.join(root, 'commands.log'), line + '\n');
}
function get(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, {timeout: 5000}, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({status: res.statusCode, body}));
    });
    req.on('timeout', () => req.destroy(new Error('Zeitlimit')));
    req.on('error', reject);
  });
}
async function main() {
  if (action === 'status') {
    log(`GET http://${host}:8001/api/v2/ (nur lesen)`);
    const response = await get(`http://${host}:8001/api/v2/`);
    if (response.status !== 200) throw new Error(`HTTP ${response.status}`);
    const data = JSON.parse(response.body);
    const baseline = path.join(root, 'baseline.json');
    if (!fs.existsSync(baseline)) fs.writeFileSync(baseline, JSON.stringify({
      capturedAt: new Date().toISOString(), device: data,
      ownerReportedNetwork: {ip: host, subnet: null, gateway: null, dns: null, dnsMode: 'unknown'},
      packageList: 'Nicht über diese Fernbedienungsschnittstelle verfügbar',
      settingsChanged: [],
      undo: ['Bisher keine TV-Einstellungen geändert. Eine erteilte Fernbedienungsberechtigung kann am TV im Geräteverbindungsmanager widerrufen werden.']
    }, null, 2));
    log(JSON.stringify({model: data.device.modelName, os: data.device.OS, developerMode: data.device.developerMode, power: data.device.PowerState, remote: data.remote}));
    return;
  }
  if (action === 'pair-secure' || action === 'menu') {
    const tokenPath = path.join(root, 'pairing-token.json');
    const token = fs.existsSync(tokenPath) ? JSON.parse(fs.readFileSync(tokenPath, 'utf8')).token : '';
    const name = Buffer.from('PC TV Steuerung').toString('base64');
    const key = crypto.randomBytes(16).toString('base64');
    log(`CONNECT wss://${host}:8002 (Kopplung; keine Tasten; selbstsigniertes TV-Zertifikat)`);
    const req = https.request({hostname: host, port: 8002,
      path: `/api/v2/channels/samsung.remote.control?name=${name}${token ? '&token=' + encodeURIComponent(token) : ''}`,
      rejectUnauthorized: false,
      headers: {Connection: 'Upgrade', Upgrade: 'websocket', 'Sec-WebSocket-Key': key, 'Sec-WebSocket-Version': '13'}
    });
    const timer = setTimeout(() => {log('Zeitlimit: keine Kopplungsbestätigung.'); req.destroy(); process.exitCode = 1;}, 45000);
    req.on('upgrade', (res, socket, head) => {
      const expected = crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
      if (res.headers['sec-websocket-accept'] !== expected) {clearTimeout(timer); socket.destroy(); throw new Error('Ungültiger WebSocket-Handshake');}
      log('Verschlüsselte Verbindung offen. Bitte Anfrage am TV zulassen, falls angezeigt.');
      let buffer = head;
      const deadline = setTimeout(() => socket.destroy(), 45000);
      function consume(chunk) {
        buffer = Buffer.concat([buffer, chunk]);
        while (buffer.length >= 2) {
          const opcode = buffer[0] & 15;
          let length = buffer[1] & 127, offset = 2;
          if (length === 126) {if (buffer.length < 4) return; length = buffer.readUInt16BE(2); offset = 4;}
          if (length === 127) {if (buffer.length < 10) return; length = Number(buffer.readBigUInt64BE(2)); offset = 10;}
          if (length > 1048576) {socket.destroy(); return;}
          if (buffer.length < offset + length) return;
          const payload = buffer.subarray(offset, offset + length);
          buffer = buffer.subarray(offset + length);
          if (opcode === 8) {socket.destroy(); return;}
          if (opcode !== 1) continue;
          let msg; try {msg = JSON.parse(payload.toString());} catch {continue;}
          log('TV-Ereignis: ' + (msg.event || 'unbekannt'));
          if (msg.data && msg.data.token) fs.writeFileSync(tokenPath, JSON.stringify({token: msg.data.token}, null, 2));
          if (msg.event === 'ms.channel.connect') {
            if (action === 'menu') {
              const payload = Buffer.from(JSON.stringify({method:'ms.remote.control',params:{Cmd:'Click',DataOfCmd:'KEY_MENU',Option:'false',TypeOfRemote:'SendRemoteKey'}}));
              const mask = crypto.randomBytes(4);
              const header = payload.length < 126 ? Buffer.from([0x81, 0x80 | payload.length]) : Buffer.from([0x81, 0xfe, payload.length >> 8, payload.length & 255]);
              const masked = Buffer.from(payload);
              for (let i = 0; i < masked.length; i++) masked[i] ^= mask[i % 4];
              socket.write(Buffer.concat([header, mask, masked]), () => {
                log('SEND KEY_MENU einmal. Kein OK/Enter gesendet; sichtbares Ergebnis muss am TV geprüft werden.');
                setTimeout(() => socket.destroy(), 1500);
              });
              return;
            }
            log('Fernbedienungsverbindung bestätigt. Keine Taste gesendet.');
            socket.destroy();
          }
        }
      }
      socket.on('data', consume);
      socket.on('error', err => log('Socket-Fehler: ' + err.message));
      socket.on('close', () => {clearTimeout(timer); clearTimeout(deadline);});
      consume(Buffer.alloc(0));
    });
    req.on('response', res => {log('HTTP ' + res.statusCode); res.resume(); clearTimeout(timer); process.exitCode = 1;});
    req.on('error', err => {log('FEHLER: ' + err.message); clearTimeout(timer); process.exitCode = 1;});
    req.end();
    return;
  }
  if (action !== 'pair') throw new Error('Erlaubte Aktionen: status, pair, pair-secure');
  const tokenPath = path.join(root, 'pairing-token.json');
  const token = fs.existsSync(tokenPath) ? JSON.parse(fs.readFileSync(tokenPath, 'utf8')).token : '';
  const name = Buffer.from('PC TV Steuerung').toString('base64');
  log(`CONNECT ws://${host}:8001/api/v2/channels/samsung.remote.control (Kopplung; keine Tasten)`);
  const ws = new WebSocket(`ws://${host}:8001/api/v2/channels/samsung.remote.control?name=${name}${token ? '&token=' + encodeURIComponent(token) : ''}`);
  const timer = setTimeout(() => { log('Keine Kopplungsbestätigung innerhalb von 45 Sekunden.'); ws.close(); process.exitCode = 1; }, 45000);
  ws.addEventListener('open', () => log('Verbindung offen. Falls angezeigt: Anfrage am Fernseher selbst zulassen.'));
  ws.addEventListener('message', event => {
    let message;
    try {message = JSON.parse(event.data);} catch {return;}
    log(`TV-Ereignis: ${message.event || 'unbekannt'}`);
    if (message.data && message.data.token) fs.writeFileSync(tokenPath, JSON.stringify({token: message.data.token}, null, 2));
    if (message.event === 'ms.channel.connect') {
      log('Fernbedienungsverbindung bestätigt. Keine Taste gesendet.');
      clearTimeout(timer); ws.close();
    } else if (message.event === 'ms.channel.unauthorized') {
      clearTimeout(timer); ws.close(); process.exitCode = 1;
    }
  });
  ws.addEventListener('error', () => {log('WebSocket-Verbindung fehlgeschlagen.'); clearTimeout(timer); process.exitCode = 1;});
  ws.addEventListener('close', () => clearTimeout(timer));
}
main().catch(error => {log('FEHLER: ' + error.message); process.exitCode = 1;});
