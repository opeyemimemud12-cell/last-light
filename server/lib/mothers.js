'use strict';
/* Mothership ferry scheduler — 3 vessels on rotating interstellar routes.
   Routes are seeded from the hand-authored core systems and grow to include
   every system pilots actually visit. Departure rotation runs server-side. */
const NAMES = ['ARGO', 'LONG NOW', 'PEREGRINE'];

function sysPool(db, cfg) {
  const set = new Set(cfg.SYS_KEYS);
  for (const s of (db.meta.seenSys || [])) set.add(s);
  return [...set];
}

function ensure(db, cfg) {
  if (db.mothers && db.mothers.length) return db.mothers;
  const keys = cfg.SYS_KEYS.slice();
  const r = () => keys[Math.floor(Math.random() * keys.length)];
  db.mothers = NAMES.map(nm => {
    const a = r();
    let b = a, g = 0;
    while (b === a && g++ < 20) b = r();
    return { name: 'M/S ' + nm, from: a, to: b, at: Date.now() + (4 + Math.random() * 9) * 60000 };
  });
  return db.mothers;
}

/* Rotate routes whose arrival window has passed. Returns the new list when
   something changed, otherwise null. */
function tick(db, cfg) {
  let ch = false;
  const pool = sysPool(db, cfg);
  if (!pool.length) return null;
  for (const ms of db.mothers) {
    if (Date.now() > ms.at + 9 * 60000) {
      let b = ms.to, g = 0;
      while (b === ms.to && g++ < 20) b = pool[Math.floor(Math.random() * pool.length)];
      ms.from = ms.to; ms.to = b;
      ms.at = Date.now() + (6 + Math.random() * 8) * 60000;
      ch = true;
    }
  }
  return ch ? db.mothers : null;
}
module.exports = { ensure, tick, sysPool };
