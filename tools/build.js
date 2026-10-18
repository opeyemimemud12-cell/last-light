#!/usr/bin/env node
'use strict';
/* LAST LIGHT — build tool.
   The game source lives in client/src/game/p01..p10 (they share one closure,
   so they are always shipped concatenated). This tool:
     node tools/build.js                 -> client/js/game.js
     node tools/build.js --standalone    -> also client/dist/last-light-standalone.html
   The server (server/server.js) runs the same concat automatically on start,
   so you normally never need to call this manually. */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'client', 'src', 'game');

const files = fs.readdirSync(SRC).filter(f => /^p\d{2}-.*\.js$/.test(f)).sort();
if (files.length !== 10) throw new Error('expected 10 source parts, got ' + files.length);
const parts = [];
for (const f of files) {
  const t = fs.readFileSync(path.join(SRC, f), 'utf8');
  const i = t.indexOf('═══ */\n');
  if (i < 0) throw new Error(f + ': source header marker missing (file corrupted?)');
  parts.push(t.slice(i + '═══ */\n'.length));
}
const js = parts.join('\n');
fs.mkdirSync(path.join(ROOT, 'client', 'js'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'client', 'js', 'game.js'), js);

if (process.argv.includes('--standalone')) {
  let html = fs.readFileSync(path.join(ROOT, 'client', 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(ROOT, 'client', 'css', 'style.css'), 'utf8');
  const mp1 = fs.readFileSync(path.join(ROOT, 'client', 'js', 'mp', '00-mp-core.js'), 'utf8');
  const mp2 = fs.readFileSync(path.join(ROOT, 'client', 'js', 'mp', '01-mp-voice.js'), 'utf8');
  html = html.replace('<link rel="stylesheet" href="css/style.css">', '<style>\n' + css.trim() + '\n</style>');
  html = html.replace('<script src="js/mp/00-mp-core.js"></script>', '<script>\n' + mp1 + '\n</script>');
  html = html.replace('<script src="js/mp/01-mp-voice.js"></script>', '<script>\n' + mp2 + '\n</script>');
  html = html.replace('<script src="js/game.js"></script>', '<script>\n' + js + '\n</script>');
  fs.mkdirSync(path.join(ROOT, 'client', 'dist'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'client', 'dist', 'last-light-standalone.html'), html);
  console.log('build ok: game.js %d bytes + standalone single-file build', js.length);
} else {
  console.log('build ok: game.js %d bytes from %d parts', js.length, files.length);
}
