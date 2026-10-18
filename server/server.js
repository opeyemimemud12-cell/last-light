'use strict';
/* LAST LIGHT — real multiplayer server.
   node server/server.js            (or: npm start)
   Serves the client (auto-concatenating src/game parts into js/game.js),
   hosts the WebSocket band on /ws, persists the world to server/data/db.json.
   Play at http://localhost:8080 — friends on your LAN use http://<your-ip>:8080. */
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const { WebSocketServer } = require('ws');
const cfg = require('./lib/config');
const { Store } = require('./lib/store');
const { Auth } = require('./lib/auth');
const { World } = require('./lib/world');
const { Protocol } = require('./lib/protocol');
const mothers = require('./lib/mothers');

const ROOT = path.join(__dirname, '..');
const CLIENT = path.join(ROOT, 'client');
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.png': 'image/png', '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml', '.map': 'application/json', '.woff2': 'font/woff2'
};

/* Concatenate client/src/game/p01..p10 -> client/js/game.js when sources are
   newer than the build (the parts share one closure and must ship as one file). */
function buildGame() {
  const srcDir = path.join(CLIENT, 'src', 'game');
  const files = fs.readdirSync(srcDir).filter(f => /^p\d{2}-.*\.js$/.test(f)).sort();
  const dst = path.join(CLIENT, 'js', 'game.js');
  let newest = 0;
  for (const f of files) newest = Math.max(newest, fs.statSync(path.join(srcDir, f)).mtimeMs);
  if (fs.existsSync(dst) && fs.statSync(dst).mtimeMs >= newest && files.length === 10) return;
  const out = [];
  for (const f of files) {
    const t = fs.readFileSync(path.join(srcDir, f), 'utf8');
    const i = t.indexOf('═══ */\n');
    out.push(i < 0 ? t : t.slice(i + '═══ */\n'.length));
  }
  fs.mkdirSync(path.join(CLIENT, 'js'), { recursive: true });
  fs.writeFileSync(dst, out.join('\n'));
  console.log('[build] js/game.js regenerated from ' + files.length + ' source parts');
}

function start(opts) {
  opts = opts || {};
  buildGame();
  const store = new Store(opts.db || path.join(__dirname, 'data', 'db.json'));
  store.load();
  if (!store.data.meta.useed) { store.data.meta.useed = cfg.USEED; store.mark(); }
  const auth = new Auth(store, cfg);
  const world = new World();
  const proto = new Protocol(cfg, auth, world, store);

  const server = http.createServer((req, res) => {
    let p;
    try { p = decodeURIComponent(url.parse(req.url).pathname); } catch (e) { res.writeHead(400); res.end(); return; }
    if (p === '/') p = '/index.html';
    if (p === '/health') { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: true, online: world.players.size })); return; }
    const f = path.normalize(path.join(CLIENT, p));
    if (!f.startsWith(CLIENT)) { res.writeHead(403); res.end('forbidden'); return; }
    fs.readFile(f, (e, buf) => {
      if (e) { res.writeHead(404); res.end('not found'); return; }
      res.writeHead(200, {
        'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-cache'
      });
      res.end(buf);
    });
  });

  const wss = new WebSocketServer({ server, path: '/ws', maxPayload: cfg.WS_MAX_BYTES });
  const send = (ws, o) => { if (ws.readyState === 1) { try { ws.send(JSON.stringify(o)); } catch (e) {} } };
  const authed = () => { const a = []; wss.clients.forEach(c => { if (c.mp && c.mp.authed) a.push(c); }); return a; };
  const broadcastAll = o => { for (const c of authed()) send(c, o); };
  const broadcastOthers = (ws, o) => { for (const c of authed()) if (c !== ws) send(c, o); };

  wss.on('connection', ws => {
    proto.attach(ws);
    ws.on('message', data => {
      let m;
      try { m = JSON.parse(data); } catch (e) { return; }
      try { proto.handle(ws, m, { send, broadcastAll, broadcastOthers }); }
      catch (e) { console.error('[net] handler error:', e.message); }
    });
    ws.on('close', () => {
      const c = ws.mp;
      if (c && c.authed) {
        const p = world.get(c.name);
        if (p && p.ws === ws) {
          world.remove(c.name);
          broadcastAll({ t: 'leave', n: c.name });
          broadcastAll({ t: 'roster', list: world.list(), online: world.players.size });
          console.log('[net] -', c.name, '·', world.players.size, 'online');
        }
      }
    });
    ws.on('pong', () => { if (ws.mp) ws.mp.alive = true; });
    ws.on('error', () => {});
  });

  const hb = setInterval(() => {
    wss.clients.forEach(ws => {
      if (!ws.mp) return;
      if (ws.mp.alive === false) { try { ws.terminate(); } catch (e) {} return; }
      ws.mp.alive = false;
      try { ws.ping(); } catch (e) {}
    });
  }, 30000);

  /* 10 Hz snapshots: transforms only for peers in your system + online count */
  const snap = setInterval(() => {
    for (const ws of authed()) {
      const me = world.get(ws.mp.name);
      if (!me) continue;
      const pls = [];
      for (const p of world.peersIn(me.sys, me.name)) {
        pls.push({ n: p.name, sys: p.sys, p: p.p, q: p.q, spd: p.spd, mode: p.mode });
      }
      send(ws, { t: 'snap', pls, online: world.players.size });
    }
    const mch = mothers.tick(store.data, cfg);
    if (mch) { store.mark(); broadcastAll({ t: 'mom', list: mch }); }
  }, cfg.SNAP_MS);

  const ros = setInterval(() => {
    broadcastAll({ t: 'roster', list: world.list(), online: world.players.size });
  }, cfg.ROSTER_MS);

  const port = opts.port || cfg.PORT, host = opts.host || cfg.HOST;
  server.listen(port, host, () => {
    console.log('');
    console.log('  LAST LIGHT — global band online');
    console.log('  play:        http://localhost:' + port);
    console.log('  LAN friends: http://<your-ip>:' + port);
    console.log('  world db:    ' + store.file + ' · universe seed ' + store.data.meta.useed);
    console.log('');
  });

  const stop = () => {
    clearInterval(hb); clearInterval(snap); clearInterval(ros);
    store.flush();
    try { server.close(); } catch (e) {}
  };
  process.on('SIGINT', () => { stop(); process.exit(0); });
  process.on('SIGTERM', () => { stop(); process.exit(0); });
  return { server, wss, store, world, stop };
}

if (require.main === module) start();
module.exports = { start, buildGame };
