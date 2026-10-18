'use strict';
/* Persistent world store — a single JSON file (server/data/db.json) acting as
   the global database: accounts, chat, beacons, structures, motherships.
   Writes are debounced (3s) and atomic (tmp + rename). */
const fs = require('fs'), path = require('path');

class Store {
  constructor(file) {
    this.file = file;
    this.data = null;
    this.dirty = false;
    this._tm = null;
  }
  load() {
    try { this.data = JSON.parse(fs.readFileSync(this.file, 'utf8')); } catch (e) { this.data = null; }
    if (!this.data || typeof this.data !== 'object') this.data = {};
    if (!this.data.users || typeof this.data.users !== 'object') this.data.users = {};
    if (!Array.isArray(this.data.chat)) this.data.chat = [];
    if (!Array.isArray(this.data.beacons)) this.data.beacons = [];
    if (!Array.isArray(this.data.builds)) this.data.builds = [];
    if (!Array.isArray(this.data.mothers)) this.data.mothers = [];
    if (!this.data.meta || typeof this.data.meta !== 'object') this.data.meta = {};
    if (!Array.isArray(this.data.meta.seenSys)) this.data.meta.seenSys = [];
    if (!this.data.meta.tokens || typeof this.data.meta.tokens !== 'object') this.data.meta.tokens = {};
    return this.data;
  }
  mark() {
    this.dirty = true;
    if (this._tm) return;
    this._tm = setTimeout(() => { this._tm = null; this.flush(); }, 3000);
  }
  flush() {
    if (!this.dirty || !this.data) return;
    this.dirty = false;
    try {
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
      const tmp = this.file + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(this.data));
      fs.renameSync(tmp, this.file);
    } catch (e) { console.error('[store] flush failed:', e.message); }
  }
}
module.exports = { Store };
