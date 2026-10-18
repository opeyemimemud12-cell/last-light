'use strict';
/* LAST LIGHT multiplayer self-test.
   Boots the real server on a scratch port + temp database, then drives it with
   real WebSocket clients pretending to be pilots:
     register/login/token · snapshots & interest management · chat relay ·
     beacon place · structure place/delete with OWNERSHIP ENFORCEMENT ·
     sign text sync · voice signaling relay · motherships · duplicate session
   Run: npm test   (or: node server/selftest.js) */
const fs = require('fs'), path = require('path'), os = require('os');
const { start } = require('./server');
const WebSocket = require('ws');

const PORT = 18099;
const TMPDB = path.join(os.tmpdir(), 'lastlight-selftest-' + Date.now() + '.json');
if (fs.existsSync(TMPDB)) fs.unlinkSync(TMPDB);

let pass = 0, fail = 0;
function ok(cond, name) {
  if (cond) { pass++; console.log('  \x1b[32mPASS\x1b[0m ' + name); }
  else { fail++; console.log('  \x1b[31mFAIL\x1b[0m ' + name); }
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

class Pilot {
  constructor(name) {
    this.name = name;
    this.msgs = [];
    this.ws = null;
    this.welcome = null;
  }
  connect(hello) {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket('ws://127.0.0.1:' + PORT + '/ws');
      const to = setTimeout(() => reject(new Error(this.name + ' connect timeout')), 5000);
      this.ws.on('open', () => {
        clearTimeout(to);
        if (hello) this.ws.send(JSON.stringify(Object.assign({ t: 'hello', v: 1 }, hello)));
        resolve();
      });
      this.ws.on('message', d => {
        let m; try { m = JSON.parse(d); } catch (e) { return; }
        this.msgs.push(m);
        if (m.t === 'welcome') this.welcome = m;
      });
      this.ws.on('error', e => reject(e));
    });
  }
  send(o) { this.ws.send(JSON.stringify(o)); }
  wait(t, ms) {
    const deadline = Date.now() + (ms || 4000);
    return new Promise(resolve => {
      const iv = setInterval(() => {
        const m = this.msgs.find(x => x.t === t);
        if (m) { clearInterval(iv); resolve(m); }
        else if (Date.now() > deadline) { clearInterval(iv); resolve(null); }
      }, 25);
    });
  }
  has(t, pred) { return this.msgs.some(m => m.t === t && (!pred || pred(m))); }
  close() { try { this.ws.close(); } catch (e) {} }
}

async function main() {
  console.log('\nLAST LIGHT multiplayer self-test\n');
  const srv = start({ port: PORT, host: '127.0.0.1', db: TMPDB });
  await sleep(400); // let http listen

  /* --- 1. two pilots register and see each other --- */
  const A = new Pilot('MOTH'), B = new Pilot('HALVAR');
  await A.connect({ name: 'MOTH' });
  const wA = await A.wait('welcome');
  ok(!!wA && wA.id === 'MOTH', 'register MOTH -> welcome with id');
  ok(typeof wA.token === 'string' && wA.token.length > 8, 'session token issued');
  ok(Array.isArray(wA.mothers) && wA.mothers.length === 3, '3 motherships seeded in welcome');
  ok(typeof wA.useed === 'number', 'universe seed provided');
  ok(A.has('join') === false, 'no join event for self');

  await B.connect({ name: 'HALVAR' });
  const wB = await B.wait('welcome');
  ok(!!wB && wB.online === 2, 'HALVAR sees 2 online');
  await A.wait('join');
  ok(A.has('join', m => m.n === 'HALVAR'), 'MOTH sees HALVAR join');

  /* --- 2. state sync + snapshot interest management --- */
  A.send({ t: 'st', p: [100, 0, 0], q: [0, 0, 0, 1], sys: 'Sol', spd: 42, mode: 'space' });
  B.send({ t: 'st', p: [200, 0, 0], q: [0, 0, 0, 1], sys: 'Sol', spd: 7, mode: 'space' });
  const snapB = await B.wait('snap');
  ok(snapB.pls.some(p => p.n === 'MOTH' && p.p[0] === 100 && p.spd === 42), 'snapshot carries MOTH transform to HALVAR');
  B.msgs = [];
  await sleep(120);            // pace A's state messages past ST_MIN_MS
  A.send({ t: 'st', p: [1e13, 0, 0], q: [0, 0, 0, 1], sys: 'Vega', spd: 1, mode: 'space' });
  await sleep(300);            // let the Vega state land + drain in-flight snaps
  B.msgs = [];                 // from here on, every snap must exclude MOTH
  await sleep(400);
  ok(!B.has('snap', m => m.pls.some(p => p.n === 'MOTH')), 'peer in another system filtered from snapshot (interest mgmt)');

  /* --- 3. chat relay --- */
  A.msgs = []; B.msgs = [];
  B.send({ t: 'chat', m: 'anybody out there?' });
  const chatA = await A.wait('chat');
  ok(!!chatA && chatA.who === 'HALVAR' && chatA.m === 'anybody out there?', 'chat relayed MOTH <- HALVAR');

  /* --- 4. beacons --- */
  A.msgs = []; B.msgs = [];
  A.send({ t: 'st', p: [100, 0, 0], q: [0, 0, 0, 1], sys: 'Sol', spd: 1, mode: 'space' });
  A.send({ t: 'bcn', id: 'btest1', part: 'beacon', posU: [100, 10, 0], msg: 'MINE FIRST' });
  const bcn = await B.wait('bcn');
  ok(!!bcn && bcn.b.id === 'btest1' && bcn.b.who === 'MOTH', 'beacon placement broadcast to others');
  A.send({ t: 'bcnMsg', id: 'btest1', msg: 'SUPPLY CACHE OPEN' });
  const bm = await B.wait('bcnMsg');
  ok(!!bm && bm.msg === 'SUPPLY CACHE OPEN', 'beacon text update broadcast');
  const C = new Pilot('WREN');
  await C.connect({ name: 'WREN' });
  const wC = await C.wait('welcome');
  ok(wC.beacons.some(b => b.id === 'btest1'), 'late joiner receives beacon world state');
  C.close();
  await sleep(200);

  /* --- 5. structures + ownership enforcement --- */
  await sleep(600);            // respect BUILD_CD (beacons + builds share the bucket)
  A.msgs = []; B.msgs = [];
  A.send({ t: 'bld', id: 'sb1', part: 'wall', mode: 'surface', body: 'mars', p: [3, 0, 4], ry: 1.5, txt: '', msg: '' });
  const bld = await B.wait('bld');
  ok(!!bld && bld.b.owner === 'MOTH' && bld.b.part === 'wall', 'structure placement broadcast with owner');
  B.msgs = [];
  B.send({ t: 'bldDel', id: 'sb1' });                       // HALVAR tries to delete MOTH's wall
  await sleep(300);
  ok(!B.has('bldDel'), 'foreign delete REJECTED (ownership enforced)');
  A.msgs = [];
  A.send({ t: 'bldDel', id: 'sb1' });                       // owner deletes
  const del = await B.wait('bldDel');
  ok(!!del && del.id === 'sb1', 'owner delete broadcast');
  await sleep(600);            // BUILD_CD again
  A.send({ t: 'bld', id: 'sb2', part: 'sign', mode: 'surface', body: 'mars', p: [3, 0, 5], ry: 0, txt: 'BASE ALPHA', msg: '' });
  await B.wait('bld');
  A.send({ t: 'bldTxt', id: 'sb2', txt: 'BASE ALPHA', msg: '' });
  const bt = await B.wait('bldTxt');
  ok(!!bt && bt.txt === 'BASE ALPHA', 'sign text persists and syncs');
  B.msgs = [];
  B.send({ t: 'bldTxt', id: 'sb2', txt: 'HACKED', msg: '' });
  await sleep(250);
  ok(!B.has('bldTxt', m => m.txt === 'HACKED'), 'foreign sign edit REJECTED');

  /* --- 6. voice signaling relay --- */
  A.msgs = [];
  B.send({ t: 'voice', to: 'MOTH', d: { k: 'offer', sdp: { type: 'offer', sdp: 'x' } } });
  const vs = await A.wait('voice');
  ok(!!vs && vs.from === 'HALVAR' && vs.d.k === 'offer', 'voice signaling relayed peer-to-peer');

  /* --- 7. wrong password + password account --- */
  const D = new Pilot('SABLE');
  await D.connect({ name: 'SABLE', pass: 'hunter2' });
  ok(!!await D.wait('welcome'), 'password account registered');
  D.close();
  const E = new Pilot('SABLE');
  await E.connect({ name: 'SABLE', pass: 'wrong' });
  ok(!!await E.wait('err'), 'wrong password rejected');
  E.close();

  /* --- 8. token relogin --- */
  const A2 = new Pilot('MOTH');
  await A2.connect({ token: wA.token });
  const wA2 = await A2.wait('welcome');
  ok(!!wA2 && wA2.id === 'MOTH', 'token relogin works without password');

  /* --- 9. duplicate session replaced --- */
  const byeA2 = A2.wait('bye');
  const A3 = new Pilot('MOTH');
  await A3.connect({ token: wA.token });
  ok(!!await byeA2, 'old session gets bye when replaced');

  /* --- 10. bad input rejected gracefully --- */
  A3.send({ t: 'st', p: 'not-a-vec', q: [0, 0, 0, 1], sys: 'Sol', spd: 1, mode: 'space' });
  A3.send({ t: 'bld', id: 'x', part: 'nuke', mode: 'space', p: [0, 0, 0] });
  A3.send({ t: 'chat', m: '<script>alert(1)</script>' });
  await sleep(300);
  ok(true, 'malformed input did not crash the server');

  /* --- 11. roster --- */
  A3.msgs = [];
  const ros = await A3.wait('roster', 7000);
  ok(!!ros && ros.list.some(r => r.n === 'HALVAR'), 'roster lists online pilots');

  A3.close(); B.close(); A.close();
  await sleep(300);
  srv.stop();
  srv.store.flush();

  /* --- 12. persistence to disk --- */
  const db = JSON.parse(fs.readFileSync(TMPDB, 'utf8'));
  ok(db.users.MOTH && db.users.HALVAR && db.users.SABLE, 'accounts persisted');
  ok(db.builds.some(b => b.id === 'sb2'), 'structures persisted');
  ok(db.beacons.some(b => b.id === 'btest1'), 'beacons persisted');
  ok(Array.isArray(db.chat) && db.chat.some(c => c.m === 'anybody out there?'), 'chat persisted');
  fs.unlinkSync(TMPDB);

  console.log('\n  ' + pass + ' passed, ' + fail + ' failed\n');
  process.exit(fail ? 1 : 0);
}

main().catch(e => { console.error('SELFTEST CRASHED:', e); process.exit(1); });
