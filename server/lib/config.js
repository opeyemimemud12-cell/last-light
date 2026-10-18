'use strict';
/* LAST LIGHT server — configuration. Override the port with PORT=... env. */
module.exports = {
  PORT: parseInt(process.env.PORT || '8080', 10),
  HOST: process.env.HOST || '0.0.0.0',
  PROTO: 1,                    // protocol version
  SNAP_MS: 100,                // snapshot broadcast interval (10 Hz)
  ROSTER_MS: 5000,             // full roster refresh
  ST_MIN_MS: 30,               // min interval between state messages (anti-flood)
  CHAT_CD: 1200,               // chat cooldown ms
  BUILD_CD: 400,               // build/beacon place cooldown ms
  MAX_CHAT: 80,                // chat history kept server-side
  MAX_BEACONS: 400,            // global beacon cap
  MAX_BEACONS_PLY: 40,         // per-pilot beacon cap
  MAX_BUILDS: 4000,            // global structure cap
  MAX_BUILDS_PLY: 400,         // per-pilot structure cap
  NAME_RE: /^[A-Z0-9][A-Z0-9._-]{1,11}$/,
  PASS_MAX: 64,
  TOKEN_TTL: 30 * 86400 * 1000,
  USEED: parseInt(process.env.USEED || '777', 10),  // canonical universe seed (all clients grow the same galaxy)
  SYS_KEYS: ['Sol', 'Proxima', 'AlphaCen', 'Barnard', 'Sirius', 'Vega'],
  PARTS: ['wall', 'win', 'floor', 'stairs', 'door', 'gate', 'airlock', 'counter', 'table', 'chair', 'cot', 'lamp', 'solar', 'sign', 'beacon', 'printer'],
  POS_MAX: 1e18,               // universe coordinate sanity cap
  MSG_MAX: 120,                // chat message length
  WS_MAX_BYTES: 262144,
  MOTD: 'LAST LIGHT GLOBAL BAND — A REAL SERVER. REAL PILOTS FLY, BUILD AND BROADCAST HERE. CHAT FROM THE COMMS TERMINAL. VOICE WHEN SHIPS PASS CLOSE.'
};
