/* ═══════════════════════════════════════════════════════════════
   LAST LIGHT — source part 2/10: p02-state.js
   DATA, STATE, SAVE, AUDIO — helpers, palettes, bodies, save system, synth audio
   NOTE: all parts share one closure; tools/build.js concatenates
   p01..p10 in order into client/js/game.js (byte-identical).
   ═══════════════════════════════════════════════════════════════ */
/*==================== PART 2 — DATA, STATE, SAVE, AUDIO ====================*/
const clamp=(v,a,b)=>v<a?a:v>b?b:v, lerp=(a,b,t)=>a+(b-a)*t;
const fmtK=n=>n>=1e9?(n/1e9).toFixed(2)+'B km':n>=1e6?(n/1e6).toFixed(1)+'M km':n>=1e3?(n/1e3).toFixed(0)+'k km':n.toFixed(0)+' km';
const fmtT=s=>{s=Math.max(0,Math.floor(s));const d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60);return(d?d+'d ':'')+('0'+h).slice(-2)+':'+('0'+m).slice(-2);};
const fmtD=km=>km>=9.46e13?(km/9.46e12).toFixed(1)+' ly':fmtK(km);
const rnd=(a,b)=>a+Math.random()*(b-a);
const PAL={
 earth:{sea:'#0a3d70',lo:'#39662f',hi:'#8f7d55',pk:'#e9e9ec',at:'#5fb2ff',atI:1.15,skyD:[.36,.58,.92],amp:16,wind:.25,tg:['#2f5728','#4e7a3a','#8f7d55','#d8d8dc'],fog:.0016,sw:14,dr:22},
 terra:{sea:'#0d4a52',lo:'#7d5a35',hi:'#b0935c',pk:'#e4e8e4',at:'#7fe0c8',atI:1.0,skyD:[.42,.66,.82],amp:22,wind:.3,tg:['#6b4f2e','#8f7040','#b0935c','#e4e8e4'],fog:.0013,sw:16,dr:20},
 ocean:{sea:'#062f5e',lo:'#2e6a4a',hi:'#5f8f6a',pk:'#e8f0f4',at:'#68b8ff',atI:1.2,skyD:[.34,.56,.9],amp:12,wind:.35,tg:['#1d4a38','#2e6a4a','#5f8f6a','#cfe0e8'],fog:.0018,sw:15,dr:20},
 rock:{lo:'#4c4038',hi:'#7d685a',pk:'#b5a48f',at:'#9a9a9a',atI:0,skyD:[.5,.35,.28],amp:30,wind:.02,tg:['#3a3029','#5c4a3e','#7d685a','#b5a48f'],fog:0,sw:60,dr:70},
 desert:{lo:'#8a5a2e',hi:'#c98f4e',pk:'#e8d0a0',at:'#e8b070',atI:.35,skyD:[.75,.6,.4],amp:26,wind:.15,tg:['#6e4522','#8a5a2e','#c98f4e','#e8d0a0'],fog:.0009,sw:26,dr:30},
 ice:{lo:'#9fb4c4',hi:'#d8e8f0',pk:'#ffffff',at:'#bcd8ff',atI:.4,skyD:[.6,.7,.85],amp:24,wind:.12,tg:['#7d94a8','#9fb4c4','#d8e8f0','#ffffff'],fog:.0011,sw:10,dr:26},
 lava:{lo:'#2a1a14',hi:'#4c332a',pk:'#8a6a50',at:'#ff7030',atI:.5,skyD:[.45,.2,.1],amp:34,wind:.05,tg:['#1c100c','#3a241a','#4c332a','#6a4a34'],fog:.002,sw:40,dr:40},
 toxic:{lo:'#8f7a30',hi:'#c2ab4a',pk:'#e8d878',at:'#e8cf6a',atI:1.4,skyD:[.8,.7,.3],amp:20,wind:.1,tg:['#6a5a20','#8f7a30','#c2ab4a','#e8d878'],fog:.0035,sw:30,dr:25},
 gas:{lo:'#c2a068',hi:'#e8d0a0',pk:'#f8ecd8',at:'#f8e0b0',atI:.5,skyD:[.8,.7,.5],amp:0,wind:0,tg:['#c2a068','#e8d0a0'],fog:0,sw:0,dr:0}
};
const SYSTEMS={
 Sol:{name:'SOL',pos:[0,0,0],c:0xfff3d0},
 Proxima:{name:'PROXIMA CENTAURI',pos:[3.9e13,.6e13,-.5e13],c:0xff9a60},
 AlphaCen:{name:'ALPHA CENTAURI',pos:[4.06e13,.72e13,-.37e13],c:0xfff0d8},
 Barnard:{name:"BARNARD'S STAR",pos:[5.0e13,-1.5e13,2.4e13],c:0xff8858},
 Sirius:{name:'SIRIUS',pos:[3.1e13,5.1e13,-5.4e13],c:0xcfe0ff},
 Vega:{name:'VEGA',pos:[-1.55e14,9.2e13,1.38e14],c:0xdfe8ff}
};
const BDEF=[
 {sys:'Sol',id:'sol',name:'Sol',t:'star',r:696340,pal:'gas',rot:609,desc:'G-class star. Do not approach.',haz:'STELLAR CORONA — LETHAL'},
 {sys:'Sol',id:'mercury',name:'Mercury',t:'rock',r:2440,a:5.79e7,per:2112,rot:1407.6,pal:'rock',g:3.7,tk:440,res:{ore:2,exo:1},desc:'Scorched cratered metal world.',haz:'NO ATMOSPHERE · EXTREME HEAT'},
 {sys:'Sol',id:'venus',name:'Venus',t:'rock',r:6052,a:1.082e8,per:5412,rot:-5832,pal:'toxic',at:110,g:8.9,tk:737,res:{ore:1,exo:2},desc:'Sulfuric clouds, retrograde spin.',haz:'CRUSHING TOXIC ATMOSPHERE'},
 {sys:'Sol',id:'earth',name:'Earth',t:'rock',r:6371,a:1.496e8,per:8766,rot:23.93,pal:'earth',at:60,g:9.81,tk:288,res:{ice:3,org:3,ore:1},desc:'Home. Was home.',haz:'DESTROYED — DEBRIS FIELD'},
 {sys:'Sol',id:'luna',name:'Luna',t:'rock',par:'earth',r:1737,a:384400,per:655,rot:336,pal:'rock',g:1.62,tk:250,res:{ice:2,ore:3},desc:'Earth\'s moon. Long, dark nights.',haz:'NO ATMOSPHERE · 14-DAY NIGHT'},
 {sys:'Sol',id:'mars',name:'Mars',t:'rock',r:3390,a:2.279e8,per:16488,rot:24.62,pal:'desert',at:11,g:3.71,tk:210,res:{ice:2,ore:3,org:1},desc:'Red desert, thin CO2 air.',haz:'THIN ATMOSPHERE · COLD NIGHTS'},
 {sys:'Sol',id:'cinder',name:'Cinder',t:'rock',r:1150,a:2.1e7,per:610,rot:4.3,pal:'lava',g:2.1,tk:1050,res:{ore:4,exo:2},desc:'Molten dwarf skimming the sun. A day lasts 4.3 hours.',haz:'MOLTEN SURFACE · RADIATION'},
 {sys:'Sol',id:'jove',name:'Jove',t:'gas',r:69911,a:7.785e8,per:43330,rot:9.93,pal:'gas',ring:[126000,190000],g:24.8,tk:165,res:{exo:1},desc:'Banded gas giant with a faint ring.',haz:'NO SOLID SURFACE — DO NOT DESCEND'},
 {sys:'Proxima',id:'proxima',name:'Proxima Centauri',t:'star',r:107000,pal:'gas',rot:2900,desc:'Red dwarf flare star.',haz:'STELLAR CORONA — LETHAL'},
 {sys:'Proxima',id:'pb',name:'Proxima b',t:'rock',r:7160,a:7.3e6,per:271,rot:43,pal:'terra',at:45,g:10.2,tk:278,res:{ice:4,org:4,ore:2},desc:'Temperate world in the habitable zone. A second Earth.',haz:'MINOR TECTONIC ACTIVITY'},
 {sys:'Proxima',id:'ember',name:'Ember',t:'rock',par:'pb',r:1450,a:62000,per:96,rot:96,pal:'rock',g:1.8,tk:200,res:{ore:3,ice:1},desc:'Sun-scorched moon of Proxima b.',haz:'NO ATMOSPHERE'},
 {sys:'AlphaCen',id:'alpa',name:'Alpha Centauri A',t:'star',r:850000,pal:'gas',rot:5200,desc:'Yellow twin of the trinity.',haz:'STELLAR CORONA — LETHAL'},
 {sys:'AlphaCen',id:'alpb',name:'Alpha Centauri B',t:'star',par:'alpa',r:612000,a:3.5e9,per:4e5,rot:4400,pal:'gas',desc:'Orange dwarf in wide binary orbit.',haz:'STELLAR CORONA — LETHAL'},
 {sys:'AlphaCen',id:'alkere',name:'Alkere',t:'rock',r:7600,a:1.9e8,per:6800,rot:26,pal:'ocean',at:70,g:11,tk:291,res:{ice:3,org:3},desc:'Ocean world — island archipelagos, warm rains.',haz:'STORM SEAS'},
 {sys:'AlphaCen',id:'thessia',name:'Thessia',t:'rock',par:'alkere',r:1800,a:90000,per:150,rot:150,pal:'ice',g:2.4,tk:180,res:{ice:3,exo:1},desc:'Frozen moon over a blue sea.',haz:'NO ATMOSPHERE · COLD'},
 {sys:'Barnard',id:'barnard',name:"Barnard's Star",t:'star',r:103000,pal:'gas',rot:3200,desc:'Ancient red dwarf.',haz:'STELLAR CORONA — LETHAL'},
 {sys:'Barnard',id:'inger',name:'Inger',t:'rock',r:5900,a:8.4e7,per:390,rot:37,pal:'ice',at:18,g:8.2,tk:175,res:{ice:4,ore:2,exo:1},desc:'Glacier world under a red sun.',haz:'DEEP COLD · THIN AIR'},
 {sys:'Barnard',id:'skadi',name:'Skadi',t:'rock',par:'inger',r:900,a:45000,per:71,rot:71,pal:'ice',g:1.1,tk:90,res:{ice:2,exo:1},desc:'A snowball moon.',haz:'NO ATMOSPHERE · EXTREME COLD'},
 {sys:'Sirius',id:'sira',name:'Sirius A',t:'star',r:1190000,pal:'gas',rot:3800,desc:'Brightest star in Earth\'s old sky.',haz:'STELLAR CORONA — LETHAL'},
 {sys:'Sirius',id:'sirb',name:'Sirius B',t:'star',par:'sira',r:5850,a:1.5e9,per:1.2e5,rot:8500,pal:'rock',desc:'White dwarf — a dead star\'s ember.',haz:'SURFACE = 25000K. INSTANT DEATH'},
 {sys:'Sirius',id:'aster',name:'Aster',t:'rock',r:6200,a:5.2e8,per:9000,rot:19.4,pal:'desert',at:30,g:9,tk:335,res:{ore:4,exo:1,org:1},desc:'Hot ochre desert world.',haz:'HEAT · DUST STORMS'},
 {sys:'Vega',id:'vega',name:'Vega',t:'star',r:1460000,pal:'gas',rot:3060,desc:'Blue-white giant, 25 light years out.',haz:'STELLAR CORONA — LETHAL'},
 {sys:'Vega',id:'vegamir',name:'Vegamir',t:'rock',r:15500,a:1.1e9,per:12000,rot:14.7,pal:'ice',at:90,g:13.2,tk:95,res:{ice:5,exo:3},ring:[21000,40000],desc:'Ringed ice super-earth. Exotic matter motherlode.',haz:'EXTREME COLD · HIGH GRAVITY'},
 {sys:'Vega',id:'hale',name:'Hale',t:'rock',par:'vegamir',r:2100,a:220000,per:210,rot:210,pal:'rock',g:2.6,tk:130,res:{ore:3},desc:'Rocky moon inside the ring plane.',haz:'NO ATMOSPHERE · RING DEBRIS'}
];
/*------------ procedural deep-space anomalies (seeded chart) ------------*/
const ANOM={bh:[],neb:[],wh:[],voy:null};
(function(){
 const mk=(x,y,z)=>V3(x,y,z).multiplyScalar(US);
 ANOM.bh.push({name:'MAW OF KERR',pos:[6.2e14,-2.1e14,3.4e14],r:7.5e7,posU:mk(6.2e14,-2.1e14,3.4e14),
  desc:'Stellar-mass black hole. The accretion disk outshines entire moons.',haz:'EVENT HORIZON — DO NOT APPROACH'});
 ANOM.bh.push({name:'HOLLOW CROWN',pos:[-9.4e14,4.6e14,-7.7e14],r:5.2e7,posU:mk(-9.4e14,4.6e14,-7.7e14),
  desc:'A dead star wrapped in a cold ring of shattered light. Nothing that falls in reports back.',haz:'EVENT HORIZON — DO NOT APPROACH'});
 ANOM.neb.push({name:'CARINA VEIL',pos:[-2.2e14,5.5e13,1.6e14],R:7.5e13,c:'#ff5a8a',posU:mk(-2.2e14,5.5e13,1.6e14),
  desc:'Crimson emission nebula. Starbirth region, heavy radiation, sensor scatter.',haz:'SENSOR INTERFERENCE — REDUCED VISIBILITY'});
 ANOM.neb.push({name:'EMBER NURSERY',pos:[5.4e13,-3.2e13,7.8e13],R:6.2e13,c:'#ffb347',posU:mk(5.4e13,-3.2e13,7.8e13),
  desc:'Amber hydrogen clouds lit from within by infant stars.',haz:'SENSOR INTERFERENCE — REDUCED VISIBILITY'});
 ANOM.neb.push({name:'PALE MAELSTROM',pos:[-1.2e14,-6.4e13,-9.6e13],R:5.4e13,c:'#7fd4ff',posU:mk(-1.2e14,-6.4e13,-9.6e13),
  desc:'Cold blue cyclotron of gas and dust, slowly collapsing.',haz:'SENSOR INTERFERENCE — REDUCED VISIBILITY'});
 ANOM.wh.push({name:'CYAN GATE A',pos:[8.5e12,2.2e12,-4.1e12],link:1,c:'#7fd4ff',posU:mk(8.5e12,2.2e12,-4.1e12),
  desc:'Stable wormhole mouth. Fly in, come out somewhere else entirely.',haz:'TRAVEL GATE — FLIES BOTH WAYS'});
 ANOM.wh.push({name:'CYAN GATE B',pos:[-1.46e14,8.9e13,1.31e14],link:0,c:'#7fd4ff',posU:mk(-1.46e14,8.9e13,1.31e14),
  desc:'Stable wormhole mouth. Its twin hangs near Sol.',haz:'TRAVEL GATE — FLIES BOTH WAYS'});
 ANOM.wh.push({name:'AMBER GATE A',pos:[2.9e13,4.8e13,-5.8e13],link:3,c:'#ffb347',posU:mk(2.9e13,4.8e13,-5.8e13),
  desc:'Wormhole mouth near Sirius. The amber twin waits toward Barnard.',haz:'TRAVEL GATE — FLIES BOTH WAYS'});
 ANOM.wh.push({name:'AMBER GATE B',pos:[4.9e13,-1.9e13,2.9e13],link:2,c:'#ffb347',posU:mk(4.9e13,-1.9e13,2.9e13),
  desc:'Wormhole mouth. The amber twin waits near Sirius.',haz:'TRAVEL GATE — FLIES BOTH WAYS'});
 ANOM.voy={name:'VOYAGER 1',pos:[1.22e10,5.1e9,-2.05e10],posU:mk(1.22e10,5.1e9,-2.05e10),c:'#ffd9a0',
  desc:'Humanity\'s farthest reach. 1977 vintage, golden record still bolted on.',haz:'RARE RELIC — RECOVERABLE'};
 for(const n of ANOM.neb)n.col3=new THREE.Color(n.c);
})();
function freshFL(){return{v:12,t:0,mode:'space',sys:'Sol',p:[839,0,0],q:[0,0,0,1],spd:0,thr:0,
 land:null,
 pow:{brk:{main:true,life:true,eng:true,nav:true,lit:true},amp:false,heat:true,grav:true,rea:{on:true,water:100,scram:0},batt:100},
 sysd:{hull:100,eng:100,rea:100,lif:100,avo:100},
 inv:{water:8,food:4,ice:0,ore:0,exo:0,metal:0,parts:3},
 vit:{hp:100,suit:100,cab:100,hun:100,thi:100},
 flg:{intro:false,earthGone:false,goneT:0,won:false,roverOut:false},
 builds:[],cr:500,netName:null,
 o2:{coc:100,liv:100,eng:100,gar:100},
 wire:[{s:'airlock',d:'lights'},{s:'airlock',d:'siren'},{s:'o2',d:'lights'},{s:'o2',d:'siren'},{s:'o2',d:'hud'}],
 alloc:{eng:1,nav:1,life:1},
 scan:{},log:[],supQ:null,mark:null,hot:0,roverPwr:false};}
let FL=freshFL(),INV=FL.inv,VIT=FL.vit,POW=FL.pow,SYSD=FL.sysd,FLG=FL.flg;
const T={t:0,dt:0,rate:60};
const PL={pos:V3(0,0,6),vel:V3(0,0,0),yaw:Math.PI,pitch:0,seated:false,seatX:0,inside:true,onG:true,suitOn:false,hurtT:0};
const SP={pos:V3(839,0,0),q:new THREE.Quaternion(),spd:0,thr:0,fwd:V3(0,0,-1),up:V3(0,1,0),rt:V3(1,0,0)};
const H={chg:0,on:false,t:0,cd:0,heat:0};
const STK={x:0,y:0};
const CAMM='fp';let camMode='fp';
let MARK=null,TERM=null,HOVERED=null,PAUSED=false,DEAD=false,BOOTED=false,MENU=true,INTRO={on:false,t:0,ln:0,boom:false,done:true};
let COURSE=null,GEARST={d:0,tgt:0},FRAMEID=0,SDT=0;
const GEARLEGS=[],DBTN=[],NAVL=[],NAVS=[],ENGCONE=[],KEEP=new Set();
let STROBE=null,NEBHALO=null;
const EVT={next:300};const EVTS=[];
let LAND=null,LF={up:V3(0,1,0),east:V3(1,0,0),zn:V3(0,0,1),sun:V3(1,0,0),sinE:0,lst:12,temp:15,dayF:0,body:null,qw:null};
let TER=null,CACHE=null,SRF={wind:0,extL:false,navL:true,align:false,whcd:0,nebK:0,nebName:'',bhK:0};
let MODE='space';
function toast(m,a){const d=document.createElement('div');d.className='tmsg'+(a?' a':'');d.textContent=m;$('toast').appendChild(d);setTimeout(()=>d.remove(),4600);}
function saveGame(silent){FL.t=T.t;FL.mode=MODE;FL.p=[SP.pos.x,SP.pos.y,SP.pos.z];FL.q=[SP.q.x,SP.q.y,SP.q.z,SP.q.w];FL.spd=SP.spd;FL.thr=SP.thr;
 if(MODE==='surface'&&LAND){LAND.roverOut=ROVER.out;LAND.roverP=ROVER.out?[ROVER.wpos.x,ROVER.wpos.z,ROVER.head]:null;}
 FL.roverPwr=ROVER.rea;
 try{localStorage.setItem(SAVEKEY,JSON.stringify(FL));if(!silent)toast('GAME SAVED');}catch(e){toast('SAVE FAILED');}}
function loadGame(){try{const s=localStorage.getItem(SAVEKEY);if(!s)return false;const o=JSON.parse(s);if(o.v!==11&&o.v!==12)return false;
 if(o.v===11){o.v=12;o.builds=[];o.cr=500;o.netName=null;o.o2={coc:100,liv:100,eng:100,gar:100};
  o.wire=[{s:'airlock',d:'lights'},{s:'airlock',d:'siren'},{s:'o2',d:'lights'},{s:'o2',d:'siren'},{s:'o2',d:'hud'}];o.alloc={eng:1,nav:1,life:1};}
 FL=o;INV=FL.inv;VIT=FL.vit;POW=FL.pow;SYSD=FL.sysd;FLG=FL.flg;T.t=FL.t||0;MODE=FL.mode||'space';LAND=FL.land;
 SP.pos.set(FL.p[0],FL.p[1],FL.p[2]);SP.q.set(FL.q[0],FL.q[1],FL.q[2],FL.q[3]);SP.spd=FL.spd||0;SP.thr=FL.thr||0;
 MARK=FL.mark?bodyById(FL.mark):null;
 const ep=FL.earthPosKm;if(ep&&typeof ep.copy!=='function')FL.earthPosKm=V3(ep.x||0,ep.y||0,ep.z||0);if(!FL.earthPosKm)FL.earthPosKm=V3(0,0,0);
 return true;}catch(e){return false;}}
function bodyById(id){return BODY.find(b=>b.id===id);}
function bodyName(id){const b=bodyById(id);return b?b.name:id;}
/*------------ AUDIO ------------*/
const AU={on:false,v:.7};
AU.init=function(){if(AU.on)return;try{const C=window.AudioContext||window.webkitAudioContext;AU.ctx=new C();AU.mg=AU.ctx.createGain();AU.mg.gain.value=AU.v;AU.mg.connect(AU.ctx.destination);
 const nb=AU.ctx.createBuffer(1,AU.ctx.sampleRate*2,AU.ctx.sampleRate),d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;AU.noise=nb;AU.on=true;AU.lo={};}catch(e){}};
AU.setV=function(v){AU.v=v;if(AU.mg)AU.mg.gain.value=v;};
function aOsc(t,f){const o=AU.ctx.createOscillator();o.type=t;o.frequency.value=f;return o;}
function aGain(v){const g=AU.ctx.createGain();g.gain.value=v;return g;}
function aNoise(){const s=AU.ctx.createBufferSource();s.buffer=AU.noise;s.loop=true;return s;}
AU.loop=function(id,make){if(!AU.on)return null;if(!AU.lo[id])AU.lo[id]=make();return AU.lo[id];};
function setLoop(id,g,f){if(!AU.on)return;const l=AU.loop(id,()=>{const g0=aGain(0);g0.connect(AU.mg);const inner=makeLoops[id]();inner.connect(g0);return{g:g0};});if(l){l.g.gain.setTargetAtTime(g,AU.ctx.currentTime,.12);if(f&&l.f)l.f.frequency.setTargetAtTime(f,AU.ctx.currentTime,.1);}}
const makeLoops={
 eng:()=>{const o=aOsc('sawtooth',48);o.start();const n=aNoise();n.start();const lp=AU.ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=260;o.connect(lp);n.connect(lp);return lp;},
 rea:()=>{const o=aOsc('triangle',57);o.start();const o2=aOsc('sine',114);o2.start();const m=aGain(.5);o.connect(m);o2.connect(m);return m;},
 wind:()=>{const n=aNoise();n.start();const bp=AU.ctx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=460;bp.Q.value=.4;n.connect(bp);return bp;},
 hyp:()=>{const o=aOsc('sawtooth',170);o.start();const o2=aOsc('sawtooth',173.5);o2.start();const hp=AU.ctx.createBiquadFilter();hp.type='highpass';hp.frequency.value=240;const m=aGain(.5);o.connect(m);o2.connect(m);m.connect(hp);return hp;},
 drl:()=>{const o=aOsc('square',61);o.start();const n=aNoise();n.start();const bp=AU.ctx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=880;bp.Q.value=1.2;const m=aGain(.4);o.connect(m);n.connect(m);m.connect(bp);return bp;},
 pad:()=>{const o=aOsc('triangle',110);o.start();const o2=aOsc('triangle',164.8);o2.start();const o3=aOsc('triangle',220.6);o3.start();const lp=AU.ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=520;const m=aGain(1);o.connect(m);o2.connect(m);o3.connect(m);m.connect(lp);return lp;},
 alm:()=>{const o=aOsc('square',560);o.start();const m=aGain(.6);o.connect(m);return m;},
 rumble:()=>{const o=aOsc('sawtooth',34);o.start();const n=aNoise();n.start();const lp=AU.ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=110;const m=aGain(.5);o.connect(m);n.connect(m);m.connect(lp);return lp;},
 neb:()=>{const n=aNoise();n.start();const bp=AU.ctx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=200;bp.Q.value=.25;n.connect(bp);return bp;},
 siren:()=>{const o=aOsc('square',680);o.start();const l=aOsc('sine',2.4);l.start();const lg=aGain(320);l.connect(lg);lg.connect(o.frequency);const m=aGain(.35);o.connect(m);return m;},
 voc:()=>{const o1=aOsc('sawtooth',142);o1.start();const o2=aOsc('sine',196);o2.start();const l=aOsc('sine',5.2);l.start();const bp=AU.ctx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=720;bp.Q.value=2.4;const lg=aGain(340);l.connect(lg);lg.connect(bp.frequency);const m=aGain(.55);o1.connect(m);o2.connect(m);m.connect(bp);return bp;}
};
function sfx(n){if(!AU.on)return;const c=AU.ctx,t=c.currentTime;const env=(g,a,pk,d)=>{g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(pk,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+d);};
 const tone=(ty,f0,f1,pk,d)=>{const o=aOsc(ty,f0),g=aGain(0);o.connect(g);g.connect(AU.mg);if(f1)o.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+d);env(g,.005,pk,d);o.start(t);o.stop(t+d+.1);};
 const nz=(pk,d,fc)=>{const s=aNoise(),f=AU.ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=fc;const g=aGain(0);s.connect(f);f.connect(g);g.connect(AU.mg);env(g,.01,pk,d);s.start(t);s.stop(t+d+.1);};
 if(n==='click')tone('square',900,700,.1,.06);
 else if(n==='beep')tone('sine',740,740,.12,.14);
 else if(n==='sw'){tone('square',420,300,.09,.08);setTimeout(()=>sfx('click'),70);}
 else if(n==='deny')tone('sawtooth',130,90,.14,.22);
 else if(n==='pickup')tone('sine',540,860,.12,.12);
 else if(n==='thud'){nz(.2,.18,300);tone('sine',90,50,.2,.2);}
 else if(n==='door')nz(.14,.5,900);
 else if(n==='ramp'){tone('sawtooth',60,110,.1,1.6);nz(.1,1.6,400);}
 else if(n==='boom'){nz(.5,2.4,700);tone('sine',110,26,.5,2.2);}
 else if(n==='whoosh')nz(.3,.9,2400);
 else if(n==='hiss')nz(.16,.4,3800);
 else if(n==='heal')tone('sine',420,640,.1,.3);
 else if(n==='step'){nz(.04,.07,600);tone('triangle',rnd(280,430),200,.028,.06);}
 else if(n==='gear'){nz(.14,.3,500);tone('square',170,110,.12,.32);setTimeout(()=>{nz(.1,.22,300);},240);}
 else if(n==='tele'){tone('sine',200,940,.2,.7);setTimeout(()=>tone('sine',900,170,.18,.8),380);nz(.1,.9,1400);}
 else if(n==='ping')tone('sine',1180,1150,.15,.9);
 else if(n==='flare')tone('sawtooth',520,1500,.15,.8);
 else if(n==='flash'){nz(.4,2.6,260);tone('sine',72,28,.4,2.4);}
 else if(n==='hov')tone('sine',1250,1200,.045,.04);
 else if(n==='warp'){for(let i=0;i<3;i++)setTimeout(()=>tone('sawtooth',140+i*90,700+i*420,.2,1.8),i*150);nz(.18,2.2,900);}
 else if(n==='warpin'){nz(.45,1.8,600);tone('sine',900,60,.35,1.5);tone('sine',60,900,.28,1.9);}
 else if(n==='build'){nz(.16,.22,800);tone('square',220,140,.13,.2);}
 else if(n==='squelch'){nz(.07,.06,3400);tone('square',1500,900,.05,.05);}
 else if(n==='dock'){tone('sine',180,120,.22,.5);nz(.12,.5,400);setTimeout(()=>tone('sine',240,180,.18,.4),260);}
 else if(n==='cash'){tone('sine',880,880,.12,.1);setTimeout(()=>tone('sine',1320,1320,.12,.16),110);}
 else if(n==='radio'){tone('sine',740,740,.07,.08);setTimeout(()=>tone('sine',980,980,.07,.1),90);}}
function saveSet(){try{localStorage.setItem(SETKEY,JSON.stringify(SET));}catch(e){}}
