/* ═══════════════════════════════════════════════════════════════
   LAST LIGHT — multiplayer core (window.MP)
   Game-agnostic layer: WebSocket transport, sessions/tokens, remote peer
   snapshots with interpolation, chat, beacons, builds, motherships, RTT.
   The game's NET facade (src/game/p09-net.js) drives this via MP.tick()
   and subscribes to events via MP.on(type, fn).
   No THREE, no game DOM — safe to load standalone.
   ═══════════════════════════════════════════════════════════════ */
(function () {
'use strict';
var MP = window.MP = {};

/* ---------- tiny storage wrapper (file:// and private-mode safe) ---------- */
function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
function lsDel(k) { try { localStorage.removeItem(k); } catch (e) {} }

MP.cfg = {
  proto: 1,
  sendMs: 100,        // ship state send rate (10 Hz)
  interpMs: 140,      // render peers 140 ms in the past for smooth interpolation
  maxBuf: 12,         // snapshot buffer per peer
  peerTTL: 6000,      // drop peers not seen for 6 s
  voiceRange: 6000    // universe units (~48,000 km) — matches proximity HUD chip
};

/* ---------- state ---------- */
MP.status = 'off';            // off | connecting | online | lost | error
MP.id = null;                 // my callsign (server-confirmed)
MP.online = 0;
MP.rtt = null;
MP.useed = null;
MP.server = lsGet('lastlight.mp.server') || '';
MP.peers = {};                // name -> { sys, buf:[{t,p,q,spd,sys,mode}], last }
MP.roster = [];               // [{n, sys}] — everyone online
MP.chat = [];                 // [{t, who, m}]
MP.beacons = [];              // server-side deep-space beacons / structures
MP.builds = [];               // server-side surface builds (all owners)
MP.mothers = [];              // mothership ferry schedule
MP.lastErr = '';

var ws = null;
var handlers = {};
var stAcc = 0;
var backoff = 1000, reconnectTm = null, wantOnline = false;
var pingAt = 0;

/* ---------- helpers ---------- */
function now() { return (window.performance && performance.now) ? performance.now() : Date.now(); }
function send(o) {
  if (ws && ws.readyState === 1) { try { ws.send(JSON.stringify(o)); } catch (e) {} }
}
MP.send = send;
MP.on = function (t, f) { (handlers[t] = handlers[t] || []).push(f); };
function fire(t, m) {
  var hs = handlers[t];
  if (!hs) return;
  for (var i = 0; i < hs.length; i++) { try { hs[i](m); } catch (e) { console.error('[MP] handler "' + t + '"', e); } }
}
function setStatus(s, reason) {
  MP.status = s;
  fire('net', { status: s, on: s === 'online', reason: reason || '' });
}
function defaultUrl() {
  if (MP.server) return MP.server;
  if (location.protocol === 'file:') return 'ws://localhost:8080/ws';
  return (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws';
}
function prunePeers() {
  var t = now(), dropped = [];
  for (var n in MP.peers) {
    if (t - MP.peers[n].last > MP.cfg.peerTTL) { dropped.push(n); delete MP.peers[n]; }
  }
  if (dropped.length) fire('peers', { dropped: dropped });
}

/* ---------- connect / disconnect ---------- */
MP.connect = function (url, name, pass) {
  var full = (url || '').trim() || defaultUrl();
  if (!/^wss?:\/\//i.test(full)) full = 'ws://' + full + '/ws';
  if (!/\/ws$/.test(full)) full += '/ws';
  wantOnline = true;
  MP.server = full;
  lsSet('lastlight.mp.server', full);
  MP.lastErr = '';
  openSocket(full, name, pass, lsGet('lastlight.mp.token') || '');
};

function openSocket(full, name, pass, token) {
  if (ws) { try { ws.close(); } catch (e) {} ws = null; }
  setStatus('connecting');
  var sock;
  try { sock = new WebSocket(full); } catch (e) { setStatus('error', 'BAD URL'); return; }
  ws = sock;
  var opened = false;
  sock.onopen = function () {
    opened = true;
    var hello = { t: 'hello', v: MP.cfg.proto };
    if (token) hello.token = token;
    if (name) { hello.name = name; if (pass) hello.pass = pass; }
    send(hello);
  };
  sock.onmessage = function (ev) {
    var m;
    try { m = JSON.parse(ev.data); } catch (e) { return; }
    route(m);
  };
  sock.onclose = function () {
    if (ws !== sock) return;               // replaced deliberately
    ws = null;
    MP.online = 0;
    if (wantOnline) {
      setStatus('lost', 'CONNECTION LOST');
      scheduleReconnect(full, name, pass, token);
    } else {
      setStatus('off', 'DISCONNECTED');
    }
    fire('peers', { dropped: Object.keys(MP.peers) });
    MP.peers = {};
  };
  sock.onerror = function () {
    if (!opened) { ws = null; setStatus('error', 'SERVER UNREACHABLE'); fire('peers', { dropped: Object.keys(MP.peers) }); MP.peers = {}; }
  };
}

function scheduleReconnect(full, name, pass, token) {
  if (reconnectTm) return;
  reconnectTm = setTimeout(function () {
    reconnectTm = null;
    if (!wantOnline || (ws && ws.readyState <= 1)) return;
    openSocket(full, name, pass, token);
  }, backoff);
  backoff = Math.min(backoff * 2, 8000);
}

MP.disconnect = function () {
  wantOnline = false;
  if (reconnectTm) { clearTimeout(reconnectTm); reconnectTm = null; }
  backoff = 1000;
  if (ws) { try { ws.close(); } catch (e) {} ws = null; }
  MP.peers = {};
  MP.online = 0;
  setStatus('off', 'DISCONNECTED');
};

MP.logout = function () {           // forget session token (switch callsign)
  lsDel('lastlight.mp.token');
  MP.disconnect();
};

/* ---------- server -> client routing ---------- */
function route(m) {
  switch (m.t) {
    case 'welcome':
      backoff = 1000;
      MP.id = m.id;
      MP.useed = m.useed;
      MP.online = m.online || 1;
      if (m.token) lsSet('lastlight.mp.token', m.token);
      MP.chat = (m.chat || []).map(function (c) { return { t: c.at || c.t2 || Date.now(), who: c.who, m: c.m }; });
      MP.beacons = m.beacons || [];
      MP.builds = m.builds || [];
      MP.mothers = m.mothers || [];
      MP.roster = (m.roster || []).slice();
      setStatus('online');
      fire('welcome', m);
      break;
    case 'needAuth':
      lsDel('lastlight.mp.token');
      wantOnline = false;
      setStatus('off', 'NEED AUTH');
      fire('needAuth', m);
      break;
    case 'snap':
      MP.online = m.online || 0;
      var t = now(), seen = {};
      for (var i = 0; i < m.pls.length; i++) {
        var e = m.pls[i];
        seen[e.n] = 1;
        var P = MP.peers[e.n];
        if (!P) P = MP.peers[e.n] = { buf: [] };
        P.sys = e.sys;
        P.last = t;
        P.buf.push({ t: t, p: e.p, q: e.q, spd: e.spd, sys: e.sys, mode: e.mode });
        if (P.buf.length > MP.cfg.maxBuf) P.buf.shift();
      }
      for (var n in MP.peers) if (!seen[n]) delete MP.peers[n];
      fire('snap', m);
      break;
    case 'roster':
      MP.roster = m.list || [];
      MP.online = m.online || MP.roster.length;
      fire('roster', m);
      break;
    case 'chat':
      MP.chat.push({ t: m.at || Date.now(), who: m.who, m: m.m });
      if (MP.chat.length > 60) MP.chat.shift();
      fire('chat', { who: m.who, m: m.m });
      break;
    case 'join': fire('join', { n: m.n }); MP.online++; break;
    case 'leave': fire('leave', { n: m.n }); MP.online = Math.max(0, MP.online - 1); delete MP.peers[m.n]; break;
    case 'bcn':
      if (!MP.beacons.some(function (b) { return b.id === m.b.id; })) {
        MP.beacons.push(m.b);
        fire('bcn', m.b);
      }
      break;
    case 'bcnMsg':
      for (var j = 0; j < MP.beacons.length; j++) if (MP.beacons[j].id === m.id) { MP.beacons[j].msg = m.msg; break; }
      fire('bcnMsg', m);
      break;
    case 'bld':
      if (!MP.builds.some(function (b) { return b.id === m.b.id; })) {
        MP.builds.push(m.b);
        fire('bld', m.b);
      }
      break;
    case 'bldDel':
      MP.builds = MP.builds.filter(function (b) { return b.id !== m.id; });
      fire('bldDel', { id: m.id });
      break;
    case 'bldTxt':
      for (var k = 0; k < MP.builds.length; k++) if (MP.builds[k].id === m.id) { MP.builds[k].txt = m.txt; MP.builds[k].msg = m.msg; break; }
      fire('bldTxt', m);
      break;
    case 'mom':
      MP.mothers = m.list || [];
      fire('mom', MP.mothers);
      break;
    case 'voice':
      fire('voiceSignal', { from: m.from, d: m.d });
      break;
    case 'pong':
      if (pingAt) { MP.rtt = Math.round(now() - pingAt); pingAt = 0; }
      break;
    case 'err':
      MP.lastErr = m.m || 'ERROR';
      wantOnline = false;
      if (ws) { try { ws.close(); } catch (e) {} }
      setStatus('error', MP.lastErr);
      fire('netErr', { m: MP.lastErr });
      break;
    case 'bye':
      wantOnline = false;
      setStatus('off', m.m || 'REPLACED');
      fire('replaced', m);
      break;
  }
}

/* ---------- per-frame pump (called by the game loop) ---------- */
/* state = {p:[x,y,z], q:[x,y,z,w], sys, spd, mode} or null */
MP.tick = function (dt, state) {
  if (MP.status !== 'online') return;
  stAcc += dt * 1000;
  if (stAcc >= MP.cfg.sendMs && state) {
    stAcc = 0;
    send({ t: 'st', p: state.p, q: state.q, sys: state.sys, spd: state.spd, mode: state.mode });
  }
  if (!pingAt) { pingAt = now(); send({ t: 'ping' }); }
  prunePeers();
};

/* ---------- interpolated peer transform ---------- */
function lerpN(a, b, f) { return a + (b - a) * f; }
function qslerp(a, b, f) {
  var ax = a[0], ay = a[1], az = a[2], aw = a[3];
  var bx = b[0], by = b[1], bz = b[2], bw = b[3];
  var dot = ax * bx + ay * by + az * bz + aw * bw;
  if (dot < 0) { bx = -bx; by = -by; bz = -bz; bw = -bw; dot = -dot; }
  if (dot > 0.9995) {
    return [lerpN(ax, bx, f), lerpN(ay, by, f), lerpN(az, bz, f), lerpN(aw, bw, f)];
  }
  var th = Math.acos(Math.max(-1, Math.min(1, dot))), s = Math.sin(th);
  if (s < 1e-6) return [ax, ay, az, aw];
  var wa = Math.sin((1 - f) * th) / s, wb = Math.sin(f * th) / s;
  return [ax * wa + bx * wb, ay * wa + by * wb, az * wa + bz * wb, aw * wa + bw * wb];
}
/* returns {p,q,spd,sys,mode} sampled interpMs in the past, or null */
MP.peerAt = function (name, tNow) {
  var P = MP.peers[name];
  if (!P || !P.buf.length) return null;
  var t = tNow - MP.cfg.interpMs;
  var buf = P.buf;
  if (buf.length === 1 || t <= buf[0].t) return buf[0];
  for (var i = buf.length - 1; i > 0; i--) {
    if (buf[i - 1].t <= t) {
      var a = buf[i - 1], b = buf[i];
      var f = (t - a.t) / Math.max(1, b.t - a.t);
      f = Math.max(0, Math.min(1, f));
      return {
        p: [lerpN(a.p[0], b.p[0], f), lerpN(a.p[1], b.p[1], f), lerpN(a.p[2], b.p[2], f)],
        q: qslerp(a.q, b.q, f),
        spd: lerpN(a.spd, b.spd, f), sys: b.sys, mode: b.mode
      };
    }
  }
  return buf[buf.length - 1];
};
/* most recent snapshot (no interpolation) — for voice distance */
MP.peerLast = function (name) {
  var P = MP.peers[name];
  return P && P.buf.length ? P.buf[P.buf.length - 1] : null;
};

/* ---------- outbound game actions ---------- */
MP.chatSend = function (m) { send({ t: 'chat', m: String(m || '').slice(0, 120) }); };
MP.beaconPlace = function (id, part, posU, msg) {
  send({ t: 'bcn', id: id, part: part, posU: posU, msg: msg || '' });
};
MP.beaconMsg = function (id, msg) { send({ t: 'bcnMsg', id: id, msg: msg }); };
MP.bldPlace = function (b) { send({ t: 'bld', id: b.id, part: b.part, mode: b.mode, body: b.body || '', p: b.p, ry: b.ry || 0, txt: b.txt || '', msg: b.msg || '' }); };
MP.bldDel = function (id) { send({ t: 'bldDel', id: id }); };
MP.bldTxt = function (id, txt, msg) { send({ t: 'bldTxt', id: id, txt: txt || '', msg: msg || '' }); };
MP.voiceSend = function (to, d) { send({ t: 'voice', to: to, d: d }); };

})();
