/* ═══════════════════════════════════════════════════════════════
   LAST LIGHT — proximity voice (MP.voice)
   Real microphone audio over WebRTC peer-to-peer links. The server only
   relays signaling (offer/answer/ICE); audio flows directly between pilots.
   Distance attenuation: the game calls MP.voice.update(name, dist, sameSys)
   every frame for every peer; links auto-form within voice range and tear
   down after leaving it. Mute toggle persists.
   ═══════════════════════════════════════════════════════════════ */
(function () {
'use strict';
var MP = window.MP;
if (!MP) return;

function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

var ICE = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
var RANGE = 6000;                    // must match MP.cfg.voiceRange
var DROP_MS = 6000;                  // tear down after this long out of range

var V = MP.voice = {
  enabled: lsGet('lastlight.mp.mic') !== '0',   // user wants mic
  muted: false,
  state: 'idle',                     // idle | requesting | on | denied | off
  peers: {}                          // name -> {pc, gain, lastNear, remote}
};

var actx = null, localStream = null;

function audioCtx() {
  if (!actx) {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    actx = new AC();
  }
  if (actx.state === 'suspended') { try { actx.resume(); } catch (e) {} }
  return actx;
}

/* ---------- microphone ---------- */
V.requestMic = function () {
  if (V.state === 'on' || V.state === 'requesting') return Promise.resolve(true);
  if (!V.enabled) { V.state = 'off'; return Promise.resolve(false); }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    V.state = 'denied';
    return Promise.resolve(false);
  }
  V.state = 'requesting';
  return navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } })
    .then(function (stream) {
      localStream = stream;
      V.state = 'on';
      // attach mic to any links already up (they were receive-only until now)
      for (var n in V.peers) addMicTrack(V.peers[n].pc);
      MP.fireHook && MP.fireHook('voice', V.state);
      return true;
    })
    .catch(function () {
      V.state = 'denied';
      return false;
    });
};

function addMicTrack(pc) {
  if (!localStream || !pc || !pc.addTrack) return;
  try {
    localStream.getAudioTracks().forEach(function (tr) {
      try { pc.addTrack(tr, localStream); } catch (e) {}
    });
  } catch (e) {}
}

V.setMuted = function (m) {
  V.muted = !!m;
  if (localStream) {
    localStream.getAudioTracks().forEach(function (tr) { tr.enabled = !V.muted; });
  }
};
V.toggleMute = function () { V.setMuted(!V.muted); return V.muted; };
V.setEnabled = function (on) {
  V.enabled = !!on;
  lsSet('lastlight.mp.mic', on ? '1' : '0');
  if (on) { V.requestMic(); }
  else {
    V.state = 'off';
    if (localStream) { localStream.getTracks().forEach(function (tr) { tr.stop(); }); localStream = null; }
    for (var n in V.peers) stopPeer(n);
  }
};

/* ---------- peer links ---------- */
function initiator(name) { return !!MP.id && MP.id < name; }   // deterministic: both sides agree

function startPeer(name) {
  if (V.peers[name]) return;
  var pc;
  try { pc = new RTCPeerConnection(ICE); } catch (e) { return; }
  var entry = V.peers[name] = { pc: pc, gain: 0, lastNear: Date.now(), remote: false };
  addMicTrack(pc);
  pc.onicecandidate = function (ev) {
    if (ev.candidate) MP.voiceSend(name, { k: 'ice', c: ev.candidate });
  };
  pc.ontrack = function (ev) {
    entry.remote = true;
    var ctx = audioCtx();
    if (!ctx) return;
    try {
      var src = ctx.createMediaStreamSource(ev.streams[0]);
      var g = ctx.createGain();
      g.gain.value = 0;
      src.connect(g); g.connect(ctx.destination);
      entry.gainNode = g;
    } catch (e) {}
  };
  pc.onconnectionstatechange = function () {
    if (pc.connectionState === 'failed' || pc.connectionState === 'closed') stopPeer(name);
  };
  if (initiator(name)) {
    pc.createOffer().then(function (offer) {
      return pc.setLocalDescription(offer);
    }).then(function () {
      MP.voiceSend(name, { k: 'offer', sdp: pc.localDescription });
    }).catch(function () { stopPeer(name); });
  }
}

function stopPeer(name) {
  var e = V.peers[name];
  if (!e) return;
  delete V.peers[name];
  try { e.pc.close(); } catch (err) {}
}

/* incoming signaling from the server relay */
MP.on('voiceSignal', function (m) {
  var from = m.from, d = m.d || {};
  if (d.k === 'offer') {
    var e = V.peers[from];
    if (!e) {
      e = V.peers[from] = { pc: null, gain: 0, lastNear: Date.now(), remote: false };
      try { e.pc = new RTCPeerConnection(ICE); } catch (err) { delete V.peers[from]; return; }
      addMicTrack(e.pc);
      e.pc.onicecandidate = function (ev) { if (ev.candidate) MP.voiceSend(from, { k: 'ice', c: ev.candidate }); };
      e.pc.ontrack = function (ev) {
        e.remote = true;
        var ctx = audioCtx();
        if (!ctx) return;
        try {
          var src = ctx.createMediaStreamSource(ev.streams[0]);
          var g = ctx.createGain(); g.gain.value = 0;
          src.connect(g); g.connect(ctx.destination);
          e.gainNode = g;
        } catch (err) {}
      };
      e.pc.onconnectionstatechange = function () {
        if (e.pc.connectionState === 'failed' || e.pc.connectionState === 'closed') stopPeer(from);
      };
    }
    e.pc.setRemoteDescription(new RTCSessionDescription(d.sdp)).then(function () {
      return e.pc.createAnswer();
    }).then(function (ans) {
      return e.pc.setLocalDescription(ans);
    }).then(function () {
      MP.voiceSend(from, { k: 'answer', sdp: e.pc.localDescription });
    }).catch(function () { stopPeer(from); });
  } else if (d.k === 'answer') {
    var a = V.peers[from];
    if (a && a.pc && a.pc.signalingState !== 'stable') {
      a.pc.setRemoteDescription(new RTCSessionDescription(d.sdp)).catch(function () { stopPeer(from); });
    }
  } else if (d.k === 'ice') {
    var p = V.peers[from];
    if (p && p.pc && d.c) {
      try { p.pc.addIceCandidate(new RTCIceCandidate(d.c)).catch(function () {}); } catch (err) {}
    }
  }
});

/* ---------- per-frame update (called by the game) ---------- */
V.update = function (name, dist, sameSys) {
  var inRange = sameSys && dist < RANGE;
  var e = V.peers[name];
  if (inRange) {
    if (!e) startPeer(name);
    else e.lastNear = Date.now();
  }
  if (e) {
    if (!inRange && Date.now() - e.lastNear > DROP_MS) { stopPeer(name); return; }
    var g = inRange ? Math.max(0, Math.min(1, 1 - dist / RANGE)) : 0;
    g = g * g * (3 - 2 * g);                       // smoothstep falloff
    if (e.gainNode) {
      try { e.gainNode.gain.value = V.muted ? 0 : g; } catch (err) {}
    }
  }
};

/* teardown everything (called on disconnect) */
MP.on('net', function (m) {
  if (!m.on) {
    for (var n in V.peers) stopPeer(n);
  }
});

})();
