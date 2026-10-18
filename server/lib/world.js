'use strict';
/* Live world — online pilots and their last reported ship state.
   Interest management: snapshots only carry peers in the same star system. */
class World {
  constructor() { this.players = new Map(); }
  add(p) { this.players.set(p.name, p); }
  get(name) { return this.players.get(name) || null; }
  remove(name) { this.players.delete(name); }
  setState(name, st) {
    const p = this.players.get(name);
    if (!p) return;
    p.sys = st.sys; p.p = st.p; p.q = st.q; p.spd = st.spd; p.mode = st.mode;
    p.seen = Date.now();
  }
  peersIn(sys, except) {
    const out = [];
    for (const p of this.players.values()) if (p.name !== except && p.sys === sys) out.push(p);
    return out;
  }
  list() {
    const out = [];
    for (const p of this.players.values()) out.push({ n: p.name, sys: p.sys });
    return out;
  }
}
module.exports = { World };
