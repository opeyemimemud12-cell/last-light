'use strict';
/* Message protocol — one JSON message per WebSocket frame.
   Client -> Server: hello, st, chat, bcn, bcnMsg, bld, bldDel, bldTxt, voice, ping
   Server -> Client: welcome, needAuth, snap, roster, chat, join, leave, bcn, bcnMsg,
                     bld, bldDel, bldTxt, mom, voice, pong, err, bye
   All mutations are owner-checked; every string is sanitized; every rate is capped. */
const mothers = require('./mothers');

function sane(s, max) {
  return String(s == null ? '' : s).replace(/[<>\u0000-\u001f\u007f]/g, '').trim().slice(0, max);
}
function num(v) { const n = Number(v); return isFinite(n) ? n : 0; }
function vec(a, max, n) {
  if (!Array.isArray(a)) return null;
  const o = [];
  for (let i = 0; i < n; i++) {
    const x = num(a[i]);
    if (Math.abs(x) > max) return null;
    o.push(x);
  }
  return o;
}

class Protocol {
  constructor(cfg, auth, world, store) {
    this.cfg = cfg; this.auth = auth; this.world = world; this.store = store;
  }
  attach(ws) {
    ws.mp = { authed: false, name: null, token: null, alive: true, lastSt: 0, lastChat: 0, lastBuild: 0 };
  }
  handle(ws, m, api) {
    const c = ws.mp;
    if (!c || !m || typeof m.t !== 'string') return;
    switch (m.t) {
      case 'hello': return this.hello(ws, m, api);
      case 'st': return this.state(ws, m, api);
      case 'chat': return this.chat(ws, m, api);
      case 'bcn': return this.beacon(ws, m, api);
      case 'bcnMsg': return this.beaconMsg(ws, m, api);
      case 'bld': return this.build(ws, m, api);
      case 'bldDel': return this.buildDel(ws, m, api);
      case 'bldTxt': return this.buildTxt(ws, m, api);
      case 'voice': return this.voiceRelay(ws, m, api);
      case 'ping': if (c.authed) api.send(ws, { t: 'pong' }); return;
      default: return;
    }
  }
  hello(ws, m, api) {
    const cfg = this.cfg, c = ws.mp;
    if (c.authed) return;
    let name = null, token = null;
    if (typeof m.token === 'string' && m.token.length >= 8 && m.token.length <= 64) {
      const t = this.auth.check(m.token);
      if (t) { name = t.n; token = m.token; }
      else if (!m.name) { api.send(ws, { t: 'needAuth', m: 'TOKEN EXPIRED — SIGN IN AGAIN' }); return; }
    }
    if (!name) {
      name = sane(String(m.name || '').toUpperCase(), 12);
      if (!cfg.NAME_RE.test(name)) { api.send(ws, { t: 'err', m: 'CALLSIGN: 2-12 CHARS · A-Z 0-9 . _ -' }); return; }
      const pass = typeof m.pass === 'string' ? m.pass.slice(0, cfg.PASS_MAX) : '';
      const u = this.auth.user(name);
      if (u) {
        if (!this.auth.verify(name, pass)) { api.send(ws, { t: 'err', m: 'CALLSIGN REGISTERED — WRONG PASSWORD' }); return; }
      } else {
        this.auth.register(name, pass);
      }
      token = this.auth.issue(name);
    }
    this.auth.touch(name);
    // one live session per callsign: replace the old connection
    const old = this.world.get(name);
    if (old && old.ws && old.ws !== ws && old.ws.readyState === 1) {
      api.send(old.ws, { t: 'bye', m: 'SESSION REPLACED BY A NEW CONNECTION' });
      try { old.ws.close(); } catch (e) {}
      this.world.remove(name);
    }
    c.authed = true; c.name = name; c.token = token;
    this.world.add({ name, ws, sys: 'Sol', p: [0, 0, 0], q: [0, 0, 0, 1], spd: 0, mode: 'space', seen: Date.now() });
    mothers.ensure(this.store.data, cfg);
    const db = this.store.data;
    api.send(ws, {
      t: 'welcome', id: name, token, useed: db.meta.useed || cfg.USEED,
      online: this.world.players.size, mothers: db.mothers,
      beacons: db.beacons, builds: db.builds,
      chat: db.chat.slice(-40), motd: cfg.MOTD
    });
    api.broadcastOthers(ws, { t: 'join', n: name });
    api.broadcastAll({ t: 'roster', list: this.world.list(), online: this.world.players.size });
    console.log('[net] +', name, '·', this.world.players.size, 'online');
  }
  state(ws, m, api) {
    const c = ws.mp;
    if (!c.authed) return;
    const now = Date.now();
    if (now - c.lastSt < this.cfg.ST_MIN_MS) return;
    c.lastSt = now;
    const p = vec(m.p, this.cfg.POS_MAX, 3), q = vec(m.q, 2, 4);
    if (!p || !q) return;
    const sys = sane(m.sys, 24) || 'Sol';
    const spd = Math.min(Math.abs(num(m.spd)), 1e12);
    const mode = m.mode === 'surface' ? 'surface' : 'space';
    this.world.setState(c.name, { sys, p, q, spd, mode });
    const seen = this.store.data.meta.seenSys;
    if (sys && seen.indexOf(sys) < 0 && seen.length < 500) { seen.push(sys); this.store.mark(); }
  }
  chat(ws, m, api) {
    const c = ws.mp;
    if (!c.authed) return;
    const now = Date.now();
    if (now - c.lastChat < this.cfg.CHAT_CD) return;
    c.lastChat = now;
    const msg = sane(m.m, this.cfg.MSG_MAX);
    if (!msg) return;
    const entry = { t: Date.now(), who: c.name, m: msg };
    const chat = this.store.data.chat;
    chat.push(entry);
    while (chat.length > this.cfg.MAX_CHAT) chat.shift();
    this.store.mark();
    api.broadcastAll({ t: 'chat', who: entry.who, m: entry.m, at: entry.t });
  }
  beacon(ws, m, api) {
    const c = ws.mp;
    if (!c.authed) return;
    const now = Date.now();
    if (now - c.lastBuild < this.cfg.BUILD_CD) return;
    c.lastBuild = now;
    const id = sane(m.id, 24), part = sane(m.part, 16);
    const pos = vec(m.posU, this.cfg.POS_MAX, 3);
    if (!id || this.cfg.PARTS.indexOf(part) < 0 || !pos) { api.send(ws, { t: 'err', m: 'BAD BEACON' }); return; }
    const db = this.store.data;
    const mine = db.beacons.reduce((a, b) => a + (b.who === c.name ? 1 : 0), 0);
    if (db.beacons.length >= this.cfg.MAX_BEACONS || mine >= this.cfg.MAX_BEACONS_PLY) {
      api.send(ws, { t: 'err', m: 'BEACON QUOTA REACHED' }); return;
    }
    const b = { id, who: c.name, part, msg: sane(m.msg, 60), posU: pos };
    const i = db.beacons.findIndex(x => x.id === id);
    if (i >= 0) {
      if (db.beacons[i].who !== c.name) return;
      db.beacons[i] = b;
    } else db.beacons.push(b);
    this.store.mark();
    api.broadcastOthers(ws, { t: 'bcn', b });
  }
  beaconMsg(ws, m, api) {
    const c = ws.mp;
    if (!c.authed) return;
    const id = sane(m.id, 24), msg = sane(m.msg, 60);
    const b = this.store.data.beacons.find(x => x.id === id);
    if (!b || b.who !== c.name) return;
    b.msg = msg;
    this.store.mark();
    api.broadcastAll({ t: 'bcnMsg', id, msg });
  }
  build(ws, m, api) {
    const c = ws.mp;
    if (!c.authed) return;
    const now = Date.now();
    if (now - c.lastBuild < this.cfg.BUILD_CD) return;
    c.lastBuild = now;
    const id = sane(m.id, 24), part = sane(m.part, 16);
    const mode = m.mode === 'surface' ? 'surface' : 'space';
    const p = vec(m.p, this.cfg.POS_MAX, 3);
    if (!id || this.cfg.PARTS.indexOf(part) < 0 || !p) { api.send(ws, { t: 'err', m: 'BAD STRUCTURE' }); return; }
    const db = this.store.data;
    const mine = db.builds.reduce((a, b) => a + (b.owner === c.name ? 1 : 0), 0);
    if (db.builds.length >= this.cfg.MAX_BUILDS || mine >= this.cfg.MAX_BUILDS_PLY) {
      api.send(ws, { t: 'err', m: 'BUILD QUOTA REACHED' }); return;
    }
    const b = {
      id, part, mode, body: sane(m.body, 32), p,
      ry: num(m.ry) % 6.2832, txt: sane(m.txt, 60), msg: sane(m.msg, 60),
      owner: c.name, t: Date.now()
    };
    const i = db.builds.findIndex(x => x.id === id);
    if (i >= 0) {
      if (db.builds[i].owner !== c.name) return;
      db.builds[i] = b;
    } else db.builds.push(b);
    this.store.mark();
    api.broadcastOthers(ws, { t: 'bld', b });
  }
  buildDel(ws, m, api) {
    const c = ws.mp;
    if (!c.authed) return;
    const id = sane(m.id, 24);
    const db = this.store.data;
    const i = db.builds.findIndex(x => x.id === id && x.owner === c.name);
    if (i < 0) return;
    db.builds.splice(i, 1);
    this.store.mark();
    api.broadcastOthers(ws, { t: 'bldDel', id });
  }
  buildTxt(ws, m, api) {
    const c = ws.mp;
    if (!c.authed) return;
    const id = sane(m.id, 24);
    const db = this.store.data;
    const b = db.builds.find(x => x.id === id && x.owner === c.name);
    if (b) {
      b.txt = sane(m.txt, 60); b.msg = sane(m.msg, 60);
      this.store.mark();
      api.broadcastAll({ t: 'bldTxt', id, txt: b.txt, msg: b.msg });
      return;
    }
    const bc = db.beacons.find(x => x.id === id && x.who === c.name);
    if (bc) {
      bc.msg = sane(m.msg, 60);
      this.store.mark();
      api.broadcastAll({ t: 'bcnMsg', id, msg: bc.msg });
    }
  }
  voiceRelay(ws, m, api) {
    const c = ws.mp;
    if (!c.authed) return;
    const to = sane(m.to, 12);
    const d = m.d;
    if (!to || !d || typeof d !== 'object') return;
    const target = this.world.get(to);
    if (target && target.ws && target.ws.readyState === 1) {
      api.send(target.ws, { t: 'voice', from: c.name, d });
    }
  }
}
module.exports = { Protocol };
