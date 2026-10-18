# LAST LIGHT — Multiplayer

Deep space survival simulator, now a **real multi-file project with actual multiplayer**: a Node.js relay server owns one shared, persistent universe. Pilots register callsigns, see each other's ships fly in real time, talk over proximity voice, chat on the global band, plant beacons, and build bases that persist for everyone.

Single-player still works — offline is the same game, untouched.

---

## Quick start

```bash
npm install        # one dependency: ws
npm start          # starts the relay server on http://localhost:8080
```

Open **http://localhost:8080** in your browser → **MULTIPLAYER** → type a **CALLSIGN** → **CONNECT**.

Start a new expedition (the game auto-reconnects your saved callsign next time). Open a second browser tab/window as another callsign — you'll see each other's ships outside your window within seconds.

## Playing with friends

- **Same LAN:** they browse to `http://<your-ip>:8080` (the server prints hints on start). Allow port 8080 through your firewall.
- **Over the internet:** host `server/` on any Node box (VPS, container, Raspberry Pi…) and have friends connect to `http://<host>:8080`. The client also accepts a full server URL in the MULTIPLAYER panel (e.g. `myserver.example.com:8080`).
- Voice chat needs a **secure context** for microphone access: `localhost`, `127.0.0.1`, `file://`, or HTTPS. For public hosting put the server behind a TLS reverse proxy (Caddy/nginx) — plain HTTP + mic doesn't mix.
- One session per callsign: connecting again replaces the old session.

## What's real here

| System | How it works |
|---|---|
| **Accounts** | Callsign + optional password (scrypt-hashed), 30-day session tokens, auto-relogin |
| **Ship sync** | Your ship's position/orientation/speed/system streams at 10 Hz; remote ships interpolate 140 ms in the past — no jitter |
| **Interest management** | You only receive transforms of pilots **in your star system**; the roster shows everyone |
| **Shared universe** | The server owns the canonical **universe seed** — every client grows the identical 4-galaxy, 62-system universe |
| **Proximity voice** | Real WebRTC microphone audio, peer-to-peer; the server only relays signaling. Volume falls off with distance (48,000 km); links form when ships pass close, tear down when they part. `[V]` mutes you |
| **Global band** | Text chat from the COMMS terminal, relayed to every pilot, 80-message history |
| **Beacons & signage** | Deep-space beacons and structure signs broadcast your text to everyone — stored in the server database, persist forever |
| **Base building** | Every placed structure syncs to the server; other pilots see your bases when they land on the same world; **only the owner can edit/demolish** (enforced server-side) |
| **Motherships** | 3 ferry vessels on rotating interstellar routes — scheduled and rotated server-side, boardable at stations |
| **Persistence** | `server/data/db.json` — accounts, chat, beacons, structures, motherships; debounced atomic writes |

## Project layout

```
last-light-mp/
├── package.json
├── server/                  # the relay — plain Node + ws, zero frameworks
│   ├── server.js            #   HTTP static + WebSocket + 10 Hz snapshot loop
│   ├── selftest.js          #   29-check integration test (npm test)
│   ├── lib/
│   │   ├── config.js        #   ports, rates, quotas, part whitelist, universe seed
│   │   ├── store.js         #   JSON persistence (atomic, debounced)
│   │   ├── auth.js          #   scrypt accounts + session tokens
│   │   ├── world.js         #   online pilots, per-system interest management
│   │   ├── protocol.js      #   message routing, sanitizing, rate limits, ownership
│   │   └── mothers.js       #   mothership ferry scheduler
│   └── data/db.json         #   the world database (created on first run)
└── client/
    ├── index.html           # shell (DOM + HUD)
    ├── css/style.css
    ├── src/game/            # GAME SOURCE — 10 parts, in load order
    │   ├── p01-boot.js      #   THREE import, renderer, scene
    │   ├── p02-state.js     #   data, save system, synth audio
    │   ├── p03-universe.js  #   shaders, planet meshes
    │   ├── p04-galaxies.js  #   procedural universe v2 (4 galaxies, 483 bodies)
    │   ├── p05-interior.js  #   KL-9 Kestrel interior
    │   ├── p06-terminals.js #   NAV/SCAN/SYS/COM/dock/sign MFDs
    │   ├── p07-player.js    #   input, movement, tools, rover
    │   ├── p08-flight.js    #   flight model, terrain, landing
    │   ├── p09-net.js       #   NET facade + warp + stations + building + life support
    │   └── p10-loop.js      #   sims, HUD, intro, main loop
    ├── js/
    │   ├── mp/
    │   │   ├── 00-mp-core.js    # transport, sessions, peers, interpolation
    │   │   └── 01-mp-voice.js   # WebRTC proximity voice
    │   └── game.js          # BUILT: concat of src/game/p01..p10 (auto on server start)
    └── dist/
        └── last-light-standalone.html   # single-file build (npm run build)
```

**Why is the game concatenated?** The game is one `(async()=>{…})()` closure — closures cannot span files at runtime. The source is genuinely split into 10 ordered part files; the server (or `tools/build.js`) stitches them byte-identically into `js/game.js` on start. Edit the parts, restart, done — no bundler, no build step to remember.

## Scripts

| Command | What it does |
|---|---|
| `npm start` | Server + auto-build → play at http://localhost:8080 |
| `npm test` | 29-check multiplayer integration test (boots a scratch server, drives it with real WebSocket clients: auth, snapshots, interest management, chat, beacons, builds, ownership enforcement, voice relay, persistence) |
| `npm run build` | Rebuild `js/game.js` + the single-file `dist/last-light-standalone.html` |

## Server admin

- `PORT=3000 npm start` — change port (default 8080)
- `USEED=42 npm start` — change the canonical universe seed (clients auto-adopt it and reload; default 777)
- `server/data/db.json` — the whole world; back it up, edit it (carefully), delete it for a fresh universe
- `GET /health` — `{"ok":true,"online":N}` for monitoring

## Controls (unchanged + new)

Everything from the single-player build, plus:

- **MULTIPLAYER panel** (main menu or ESC ▸ MULTIPLAYER): server URL, callsign, optional password, connect/disconnect, mic on/off, live pilot roster
- **[V]** — mute/unmute your microphone
- **[M]** → COMMS terminal — global band chat
- Ships passing within 48,000 km: proximity voice fades in automatically (chip top-right)

## Notes & limits

- Client currently reports its own structure refunds to the server (arcade-trust model) — positions/ownership are server-validated, inventories are not (yet).
- Survival stats (hull, O2, credits) remain per-pilot local saves in multiplayer; the shared database owns accounts, chat, beacons, structures, and motherships.
- First load needs internet for the three.js CDN (same as always).
