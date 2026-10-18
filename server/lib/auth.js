'use strict';
/* Accounts — callsigns with optional passwords (scrypt), 30-day session tokens.
   The token index lives in meta.tokens: { token: {n: name, at: issued} }. */
const crypto = require('crypto');

function scrypt(pass, salt) {
  return crypto.scryptSync(String(pass), salt, 32).toString('hex');
}

class Auth {
  constructor(store, cfg) {
    this.store = store;
    this.cfg = cfg;
  }
  user(name) { return this.store.data.users[name] || null; }
  register(name, pass) {
    const u = { first: Date.now(), last: Date.now(), visits: 1 };
    if (pass) {
      const salt = crypto.randomBytes(16).toString('hex');
      u.pass = { salt, h: scrypt(pass, salt) };
    }
    this.store.data.users[name] = u;
    this.store.mark();
    return u;
  }
  verify(name, pass) {
    const u = this.user(name);
    if (!u) return false;
    if (!u.pass) return String(pass || '') === '';
    if (!pass) return false;
    try {
      const a = Buffer.from(u.pass.h, 'hex'), b = Buffer.from(scrypt(pass, u.pass.salt), 'hex');
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    } catch (e) { return false; }
  }
  touch(name) {
    const u = this.user(name);
    if (u) { u.last = Date.now(); u.visits = (u.visits || 0) + 1; this.store.mark(); }
  }
  issue(name) {
    const tok = crypto.randomBytes(24).toString('hex');
    const T = this.store.data.meta.tokens;
    T[tok] = { n: name, at: Date.now() };
    this.prune(T);
    this.store.mark();
    return tok;
  }
  check(tok) {
    const T = this.store.data.meta.tokens;
    if (!T || !T[tok]) return null;
    const e = T[tok];
    if (Date.now() - e.at > this.cfg.TOKEN_TTL) { delete T[tok]; this.store.mark(); return null; }
    return e;
  }
  revoke(tok) {
    const T = this.store.data.meta.tokens;
    if (T && T[tok]) { delete T[tok]; this.store.mark(); }
  }
  prune(T) {
    const now = Date.now();
    for (const k in T) if (now - T[k].at > this.cfg.TOKEN_TTL) delete T[k];
  }
}
module.exports = { Auth };
