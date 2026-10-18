/* ═══════════════════════════════════════════════════════════════
   LAST LIGHT — source part 1/10: p01-boot.js
   BOOT — error shields, THREE import, renderer, scene, camera, lights
   NOTE: all parts share one closure; tools/build.js concatenates
   p01..p10 in order into client/js/game.js (byte-identical).
   ═══════════════════════════════════════════════════════════════ */
window.addEventListener('error',function(e){var f=document.getElementById('fatal');if(f){f.style.display='flex';document.getElementById('fmsg').textContent=''+(e.message||e.error)+'\n'+(e.filename||'')+' @line '+(e.lineno||'?');}});
window.addEventListener('unhandledrejection',function(e){var f=document.getElementById('fatal');if(!f)return;if(e.reason&&/pointer lock|PointerLock|NotAllowedError/i.test(''+(e.reason.message||e.reason.name||e.reason)))return;f.style.display='flex';document.getElementById('fmsg').textContent='PROMISE: '+((e.reason&&e.reason.message)||e.reason);});
(async()=>{try{
let THREE;
try{THREE=await import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js');}
catch(e){THREE=await import('https://unpkg.com/three@0.160.0/build/three.module.js');}
window.THREE=THREE;
const $=id=>document.getElementById(id);
$('stip').textContent='renderer…';
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(1);renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.16;
document.body.appendChild(renderer.domElement);
const SAVEKEY='lastlight.save',SETKEY='lastlight.set',US=1/8;
let SET={v:.7,sens:1,q:2,rs:1,sd:1,fov:72,useed:777};
try{const s=JSON.parse(localStorage.getItem(SETKEY)||'{}');if(s)SET=Object.assign(SET,s);}catch(e){}
const scene=new THREE.Scene();
const cam=new THREE.PerspectiveCamera(SET.fov||72,innerWidth/innerHeight,.08,2.6e6);
const AMB=new THREE.AmbientLight(0x5a6a84,.8);scene.add(AMB);
const AMB0=new THREE.Color(0x5a6a84);
const SUNL=new THREE.DirectionalLight(0xfff2dd,1.9);scene.add(SUNL);scene.add(SUNL.target);
const HEMI=new THREE.HemisphereLight(0x88aacc,0x22201a,0);scene.add(HEMI);
addEventListener('resize',()=>{cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
const clockR=new THREE.Clock();
const V3=(x,y,z)=>new THREE.Vector3(x,y,z);
const TMP=V3(0,0,0),TMP2=V3(0,0,0),TMP3=V3(0,0,0),TMQ=new THREE.Quaternion(),QT2=new THREE.Quaternion(),TMM=new THREE.Matrix4(),EUL=new THREE.Euler();
const GOV={k:1,acc:0,n:0,low:0,high:0};
