/* ═══════════════════════════════════════════════════════════════
   LAST LIGHT — source part 9/10: p09-net.js
   NET + WARP + STATIONS + CONSTRUCTION + LIFE SUPPORT
   NOTE: all parts share one closure; tools/build.js concatenates
   p01..p10 in order into client/js/game.js (byte-identical).
   ═══════════════════════════════════════════════════════════════ */
/*==================== PART 7B — GLOBAL SERVER SIM · WARP · STATIONS · CONSTRUCTION · LIFE SUPPORT ====================*/
/*------ NET: REAL GLOBAL BAND — a WebSocket relay server (js/mp/00-mp-core.js + 01-mp-voice.js)
   owns accounts, chat, beacons, structures and mothership schedules. This layer feeds the
   local ship state at 10 Hz, renders remote pilots, and applies world events into the same
   structures the single-player game already uses. Offline play stays fully playable. ------*/
const NET={on:false,id:null,skin:null,world:{v:1,players:{},chat:[],beacons:[],builds:[],mothers:[]},lastSave:0};
function netSave(){}                                  // the server persists now
function netCount(){return NET.on&&window.MP?Math.max(1,window.MP.online):0;}
function hslHex(h,s,l){h=((h%360)+360)%360;s/=100;l/=100;
 const k=n=>(n+h/30)%12,a=s*Math.min(l,1-l);
 const f=n=>l-a*Math.max(-1,Math.min(k(n)-3,Math.min(9-k(n),1)));
 const t=x=>Math.round(x*255).toString(16).padStart(2,'0');
 return '#'+t(f(0))+t(f(8))+t(f(4));}
function mkSkin(name){const h=hashId(name||'PILOT');
 return{suit:hslHex(h,52,38),trim:hslHex(h*7,70,55),visor:hslHex(h*3,80,60),emblem:h%6,name:(name||'PILOT').toUpperCase()};}
function drawSkin(cv,skin){const x=cv.getContext('2d'),W=cv.width,H=cv.height;
 x.fillStyle='#060a0e';x.fillRect(0,0,W,H);
 const u=Math.min(W,H)/10;
 x.fillStyle=skin.trim;x.fillRect(u*3,u*1.4,u*4,u*8);
 x.fillStyle=skin.suit;x.fillRect(u*2.2,u*2.2,u*5.6,u*6.6);
 x.fillStyle=skin.trim;x.fillRect(u*2.2,u*4.6,u*5.6,u*.7);
 x.fillStyle=skin.suit;x.fillRect(u*1.1,u*2.5,u,u*4);x.fillRect(u*7.9,u*2.5,u,u*4);
 x.fillStyle=skin.trim;x.fillRect(u*1.1,u*6.2,u,u*.9);x.fillRect(u*7.9,u*6.2,u,u*.9);
 x.fillStyle=skin.suit;x.beginPath();x.arc(u*5,u*1.9,u*1.9,0,7);x.fill();
 x.fillStyle=skin.visor;x.beginPath();x.arc(u*5.35,u*1.9,u*1.15,0,7);x.fill();
 x.fillStyle='#ffd9a0';x.font='bold '+Math.round(u*.95)+'px Consolas';x.textAlign='center';x.textBaseline='middle';
 x.fillText(['▲','◆','✦','◈','✚','◉'][skin.emblem%6],u*5,u*6.4);
 x.fillStyle='#5d7688';x.font='bold '+Math.round(u*.42)+'px Consolas';
 x.fillText((skin.name||'PILOT').slice(0,12),u*5,u*9.2);}
let NETHOOKS=false;
function netEvents(){                                  // wire server events into the game (once)
 if(NETHOOKS||!window.MP)return;NETHOOKS=true;
 const M=window.MP;
 M.on('welcome',m=>{
  NET.on=true;NET.id=m.id;NET.skin=mkSkin(m.id);FL.netName=m.id;
  NET.world.chat=M.chat;NET.world.beacons=M.beacons;NET.world.builds=M.builds;NET.world.mothers=M.mothers;
  if(m.motd)FL.log.push({t:T.t,m:'RX: '+m.motd});
  sfx('tele');toast('CONNECTED — GLOBAL BAND ONLINE · '+(m.online||1)+' PILOTS',1);
  if($('netp').style.display==='flex')fillNetPanel();
  if(typeof m.useed==='number'&&m.useed!==SET.useed){
   SET.useed=m.useed;try{localStorage.setItem(SETKEY,JSON.stringify(SET));}catch(e){}
   toast('UNIVERSE SEED SYNCED WITH SERVER — RELOADING…',1);
   setTimeout(()=>location.reload(),2000);}});
 M.on('net',m=>{
  if(!m.on){NET.on=false;netTear();
   toast(m.status==='lost'?'LINK LOST — RECONNECTING…':'BAND OFFLINE'+(m.reason?' — '+m.reason:''),1);
   if($('netp').style.display==='flex')fillNetPanel();}});
 M.on('netErr',m=>{toast('BAND: '+m.m,1);sfx('deny');if($('netp').style.display==='flex')fillNetPanel();});
 M.on('needAuth',()=>{if($('netp').style.display==='flex')fillNetPanel();});
 M.on('chat',m=>{
  toast('['+m.who+'] '+String(m.m).toUpperCase().slice(0,58));sfx('radio');
  if(TERM==='com')renderTerm();});
 M.on('join',m=>{toast('◆ '+m.n+' ON THE BAND');});
 M.on('leave',m=>{toast('◆ '+m.n+' LEFT THE BAND');});
 M.on('mom',()=>{if(TERM==='dock')renderTerm();});
 M.on('bld',b=>{                                       // another pilot builds where we stand
  if(MODE==='surface'&&LAND&&b.body===LAND.b&&PARTS[b.part]&&!FL.builds.some(x=>x.id===b.id))surfSpawn(b);});
 M.on('bldDel',id=>{
  for(let i=SURFBLD.length-1;i>=0;i--){const b=SURFBLD[i];
   if(b.id===id){if(b._hit){const j=HITS.indexOf(b._hit);if(j>=0)HITS.splice(j,1);}
    if(b._g)SURFG.remove(b._g);if(PARTS[b.part]&&PARTS[b.part].lamp)BLD_NL--;
    SURFBLD.splice(i,1);}}});
 M.on('bldTxt',m=>{
  for(const b of SURFBLD)if(b.id===m.id){b.txt=m.txt;b.msg=m.msg;
   if(b._g&&b._g.userData.signCv)drawSign(b._g,m.txt||m.msg||'');}});
 M.on('bcnMsg',m=>{
  for(const b of SURFBLD)if(b.id===m.id){b.msg=m.msg;
   if(b._g&&b._g.userData.signCv)drawSign(b._g,m.msg||'');}});}
netEvents();
function netTear(){
 for(const k in PEERG){if(PEERG[k]&&NETA)NETA.remove(PEERG[k]);peerDispose(PEERG[k]);delete PEERG[k];}
 $('voice').style.display='none';SRFX.prox=false;}
function netConnect(name,pass,url){
 name=(name||'').trim().toUpperCase().slice(0,12);
 if(!name){toast('ENTER A CALLSIGN FIRST');sfx('deny');return false;}
 if(!window.MP){toast('MULTIPLAYER MODULE MISSING — USE THE FULL BUILD');sfx('deny');return false;}
 netEvents();
 if(window.MP.voice&&window.MP.voice.enabled)window.MP.voice.requestMic();   // user gesture = this click
 window.MP.connect(url||'',name,pass||'');
 toast('CONTACTING RELAY…');
 return true;}
function netDisconnect(){
 if(window.MP)window.MP.disconnect();
 NET.on=false;netTear();toast('BAND OFFLINE');}
let NETA=null,PEERG={};
const SRFX={airlock:false,o2:false,prox:false,dock:false,hud:false};
function peerDispose(g){if(!g||!g.traverse)return;
 g.traverse(o=>{
  if(o.geometry&&o.geometry.dispose)o.geometry.dispose();
  if(o.material){const ms=Array.isArray(o.material)?o.material:[o.material];
   ms.forEach(m=>{if(m.map&&m.map!==GLOW&&m.map.dispose)m.map.dispose();if(m.dispose)m.dispose();});}});}
function peerShip(name){                                // remote pilot vessel, skinned from their callsign
 const skin=mkSkin(name);
 const g=new THREE.Group();
 const c1=new THREE.Color(skin.suit),c2=new THREE.Color(skin.trim);
 g.add(new THREE.Mesh(new THREE.BoxGeometry(2.6,1,5.4),new THREE.MeshLambertMaterial({color:c1})));
 const fin=new THREE.Mesh(new THREE.BoxGeometry(.3,2,1.6),new THREE.MeshLambertMaterial({color:c2}));fin.position.set(0,1,1.4);g.add(fin);
 const wing=new THREE.Mesh(new THREE.BoxGeometry(6.5,.24,1.8),new THREE.MeshLambertMaterial({color:c2}));wing.position.set(0,-.2,.8);g.add(wing);
 const eng=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:0x7fd4ff,transparent:true,opacity:.9,blending:THREE.AdditiveBlending}));eng.position.set(0,0,3.1);eng.scale.setScalar(2.2);g.add(eng);
 const lab=makeLabel(name,7,1.1,'#9fe8ff');lab.position.y=2.4;g.add(lab);
 const stb=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:0xffffff,transparent:true,opacity:.8,blending:THREE.AdditiveBlending}));stb.position.y=1.6;stb.scale.setScalar(.7);g.add(stb);
 g.userData={name,stb,eng};
 return g;}
function netTick(dt){
 if(!window.MP)return;
 const M=window.MP;
 if(!NET.on)return;
 M.tick(dt,{p:[SP.pos.x,SP.pos.y,SP.pos.z],q:[SP.q.x,SP.q.y,SP.q.z,SP.q.w],sys:FL.sys||'Sol',spd:Math.min(SP.spd||0,1e9),mode:MODE});
 let near=null,nd=1e18;                                // proximity voice + chip (space & surface)
 for(const n in M.peers){
  const b=M.peerLast(n);if(!b)continue;
  const same=b.sys===FL.sys;
  const d=same?Math.hypot(b.p[0]-SP.pos.x,b.p[1]-SP.pos.y,b.p[2]-SP.pos.z):1e18;
  if(M.voice)M.voice.update(n,d,same);
  if(d<nd){nd=d;near=n;}}
 SRFX.prox=!!(near&&nd<3000);
 const vEl=$('voice');
 if(M.voice&&M.voice.state==='on'){
  vEl.style.display='block';
  if(near&&nd<6000)vEl.innerHTML='<b>◉ VOICE</b> · '+near+' · '+(nd*8).toFixed(0)+' km'+(M.voice.muted?' · <span style="color:#ff8a75">MUTED</span>':'');
  else vEl.innerHTML='<b>◉ VOICE</b> · MIC LIVE — NO PILOTS IN RANGE [V]';}
 else if(M.voice&&M.voice.state==='denied'){vEl.style.display='block';vEl.innerHTML='<b>◉ VOICE</b> · MIC BLOCKED — ALLOW IT AND RECONNECT';}
 else vEl.style.display='none';}
function netVisualTick(){
 if(!window.MP)return;
 const M=window.MP;
 if(!NET.on){if(NETA)NETA.visible=false;return;}
 if(!NETA){NETA=new THREE.Group();scene.add(NETA);}
 NETA.visible=MODE==='space';
 if(!NETA.visible)return;
 const tNow=(window.performance&&performance.now)?performance.now():Date.now();
 for(const k in PEERG)if(!M.peers[k]){NETA.remove(PEERG[k]);peerDispose(PEERG[k]);delete PEERG[k];}
 for(const n in M.peers){
  const st=M.peerAt(n,tNow);if(!st)continue;
  let g=PEERG[n];
  if(!g){g=peerShip(n);PEERG[n]=g;NETA.add(g);}
  g.position.set(st.p[0]-SP.pos.x,st.p[1]-SP.pos.y,st.p[2]-SP.pos.z);
  g.quaternion.set(st.q[0],st.q[1],st.q[2],st.q[3]);
  const d=g.position.length();
  g.visible=d<8e8;
  if(g.userData.stb)g.userData.stb.material.opacity=(Math.sin(T.t*4+hashId(n))>0.7)?.9:.06;
  if(g.userData.eng)g.userData.eng.scale.setScalar(1.6+Math.min(3.4,(st.spd||0)*.02));}}
/*------ TRUE HYPER JUMP — warp tunnel ------*/
const WRP={on:false,ph:'',t:0,dur:6.5,sys:null,pay:0,ms:false,label:''};
function buildWarpFX(){if(WRP.streak)return;
 const N=900,pos=new Float32Array(N*3);
 for(let i=0;i<N;i++){const a=Math.random()*6.283,r=18+Math.pow(Math.random(),.5)*240;
  pos[i*3]=Math.cos(a)*r;pos[i*3+1]=Math.sin(a)*r;pos[i*3+2]=(Math.random()*2-1)*2600;}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));
 WRP.streak=new THREE.Points(g,new THREE.PointsMaterial({color:0xbfe0ff,size:2.6,sizeAttenuation:false,transparent:true,opacity:.9,depthWrite:false}));
 WRP.streak.frustumCulled=false;WRP.streak.visible=false;WRP.streak.renderOrder=-8;scene.add(WRP.streak);}
function warpTargetStar(sysKey){return BODY.find(b=>b.sys===sysKey&&b.t==='star'&&!b.par);}
function warpStart(sysKey,label,mothership){
 const st=warpTargetStar(sysKey);
 if(!st){toast('NO CHARTED STAR THERE');sfx('deny');return false;}
 const fromG=SYSTEMS[FL.sys]?SYSTEMS[FL.sys].gal:'orion',toG=SYSTEMS[sysKey].gal;
 if(!mothership){
  if(!POW.amp){H.chg=0;sfx('deny');toast('HYPERDRIVE AMP OFFLINE — OVERHEAD GUARDED SWITCH');return false;}
  if(POW.rea.water<20){H.chg=0;sfx('deny');POW.rea.on=false;POW.rea.scram=20*86400;toast('REACTOR SCRAM — STABILITY TOO LOW. 20 GAME DAYS OR 1 EXOTIC MATTER.',1);sfx('boom');return false;}
  if(fromG!==toG&&INV.exo<1){H.chg=0;sfx('deny');toast('INTERGALACTIC JUMP NEEDS 1 EXOTIC MATTER — CROSSING THE VOID IS NOT FREE',1);return false;}}
 WRP.on=true;WRP.ph='chg';WRP.t=0;WRP.sys=sysKey;WRP.ms=!!mothership;WRP.label=label||'HYPER JUMP';
 WRP.fromG=fromG;WRP.toG=toG;
 H.chg=0;H.on=false;
 SHK.t=2.2;SHK.amp=1.1;sfx('warp');
 const el=$('warp');el.style.display='block';
 el.querySelector('.wt').textContent=WRP.label+' — '+SYSTEMS[sysKey].name;
 toast((mothership?'MOTHERSHIP ':'')+'WARP SEQUENCE INITIATED — '+SYSTEMS[sysKey].name,1);
 return true;}
function warpUpdate(dt){
 WRP.t+=dt;
 const el=$('warp'),ws=el.querySelector('.ws');
 if(WRP.ph==='chg'){
  const k=WRP.t/2.2;
  setLoop('hyp',.1+k*.4,180+k*420);
  if(cam.fov){cam.fov=(SET.fov||72)+k*14;cam.updateProjectionMatrix();}
  ws.textContent='CHARGING WARP COILS '+Math.round(k*100)+'%';
  if(WRP.t>=2.2){
   if(!WRP.ms){POW.rea.water=clamp(POW.rea.water-20,0,100);
    if(WRP.fromG!==WRP.toG){INV.exo=Math.max(0,INV.exo-1);toast('1 EXOTIC MATTER SPENT — PUNCHING BETWEEN GALAXIES',1);}}
   WRP.ph='jump';WRP.t=0;
   const st=warpTargetStar(WRP.sys);
   WRP.pay=st.posU.distanceTo(SP.pos);
   $('fade').style.transition='opacity .22s';$('fade').style.opacity=1;
   sfx('boom');}}
 else if(WRP.ph==='jump'){
  if(WRP.t>=.3){WRP.ph='tunnel';WRP.t=0;WRP.streak.visible=true;
   $('fade').style.opacity=0;}}
 else if(WRP.ph==='tunnel'){
  const k=clamp(WRP.t/WRP.dur,0,1);
  setLoop('hyp',.5,420+k*900);
  ws.textContent='WARP FIELD '+Math.round(k*100)+'% · '+(WRP.ms?'PASSENGER BERTH 12 · ':'')+fmtK(WRP.pay*8*k)+' CROSSED';
  const pa=WRP.streak.geometry.attributes.position;
  for(let i=0;i<pa.count;i++){let z=pa.getZ(i)+dt*(2600+k*9000);if(z>2600)z-=5200;pa.setZ(i,z);}
  pa.needsUpdate=true;
  if(cam.fov){cam.fov=(SET.fov||72)+14-k*10;cam.updateProjectionMatrix();}
  if(WRP.t>=WRP.dur){WRP.ph='arrive';WRP.t=0;
   $('fade').style.transition='opacity .22s';$('fade').style.opacity=1;sfx('warpin');}}
 else if(WRP.ph==='arrive'){
  if(WRP.t>=.3){
   const st=warpTargetStar(WRP.sys);
   const dir=V3(Math.random()-.5,Math.random()*.2-.02,Math.random()-.5).normalize();
   if(WRP.ms){const dst=STATIONS.find(s2=>s2.sys===WRP.sys);
    if(dst)SP.pos.copy(dst.posU).addScaledVector(dir,dst.r*4+30);
    else SP.pos.copy(st.posU).addScaledVector(dir,st.r*US*3.4);}
   else SP.pos.copy(st.posU).addScaledVector(dir,st.r*US*3.4);
   TMM.lookAt(SP.pos,st.posU,V3(0,1,0));SP.q.setFromRotationMatrix(TMM);shipAxes();
   SP.spd=600;SP.thr=0;FL.sys=WRP.sys;
   WRP.on=false;WRP.streak.visible=false;
   el.style.display='none';
   $('fade').style.transition='opacity 2.5s';$('fade').style.opacity=0;
   if(cam.fov){cam.fov=SET.fov||72;cam.updateProjectionMatrix();}
   setLoop('hyp',0);SHK.t=1;SHK.amp=.7;H.cd=20;
   const distLy=WRP.pay*8/9.46e12;
   toast('ARRIVED — '+SYSTEMS[WRP.sys].name+' · '+(distLy>=.1?distLy.toFixed(1)+' LIGHT-YEARS CROSSED':fmtK(WRP.pay*8)+' CROSSED')+(WRP.ms?' · MOTHERSHIP RELEASED THE KESTREL':''),1);
   FL.log.push({t:T.t,m:'WARP ARRIVAL: '+SYSTEMS[WRP.sys].name});
   saveGame(true);}}}
/*------ STATIONS · DOCKING · ECONOMY ------*/
const COMMB={water:2,ice:3,ore:5,metal:14,parts:32,exo:130,food:9};
let DOCKED=null,STKTAB='market';
function stnPrice(st,k){const r=mulberry32(st.seed+hashId(k));const f=.65+r()*.9;return Math.max(1,Math.round(COMMB[k]*f));}
function buildStations(){
 for(const st of STATIONS){
  if(st.grp)continue;
  const g=new THREE.Group();
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(st.r*.42,st.r*.52,st.r*1.7,10),new THREE.MeshLambertMaterial({color:0x9aa8b5})));
  const hub=new THREE.Mesh(new THREE.SphereGeometry(st.r*.34,12,10),new THREE.MeshLambertMaterial({color:0xc9d4de,emissive:0x223044}));g.add(hub);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(st.r*.95,st.r*.13,10,36),new THREE.MeshLambertMaterial({color:0x7d8a99}));
  ring.rotation.x=Math.PI/2;g.add(ring);g.userData.ring=ring;
  for(let i=0;i<4;i++){const w=new THREE.Mesh(new THREE.BoxGeometry(st.r*2.6,st.r*.05,st.r*.7),new THREE.MeshLambertMaterial({color:0x2a4a8a,emissive:0x0a1830}));
   w.position.set(Math.cos(i*Math.PI/2)*st.r*1.5,0,Math.sin(i*Math.PI/2)*st.r*1.5);w.rotation.y=-i*Math.PI/2;g.add(w);}
  for(let i=0;i<3;i++){const arm=new THREE.Mesh(new THREE.CylinderGeometry(st.r*.05,st.r*.05,st.r*.9,6),new THREE.MeshLambertMaterial({color:0x5a6a78}));
   arm.position.set(Math.cos(i*2.09)*st.r*.62,st.r*.4,Math.sin(i*2.09)*st.r*.62);arm.rotation.z=.6;g.add(arm);}
  const bc=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:0x7dffa8,transparent:true,blending:THREE.AdditiveBlending}));
  bc.position.y=st.r*1.15;bc.scale.setScalar(st.r*.8);g.add(bc);g.userData.bcn=bc;
  const lab=makeLabel(st.name,st.r*2.8,st.r*.36,'#9fd8ff');lab.position.y=st.r*1.6;g.add(lab);
  st.grp=g;UNI.add(g);}}
function stationTick(dt){
 for(const st of STATIONS){
  if(!st.grp)continue;
  const d=SP.pos.distanceTo(st.posU);st.dist=d;
  st.grp.position.copy(st.posU).sub(SP.pos);
  st.grp.visible=MODE==='space'&&d<9e7;
  st.grp.rotation.y+=dt*.12;
  if(st.grp.userData.ring)st.grp.userData.ring.rotation.z+=dt*.3;
  if(st.grp.userData.bcn)st.grp.userData.bcn.material.opacity=.4+.6*Math.abs(Math.sin(T.t*1.4+st.ang));}
 SRFX.dock=!!DOCKED;
 if(MODE!=='space'||TERM||PAUSED||BLDG.on)return;
 let ns=null,nd=1e18;
 for(const st of STATIONS){if(st.sys!==FL.sys)continue;if(st.dist<nd){nd=st.dist;ns=st;}}
 if(!ns||nd>14)return;
 const pr=$('pr');
 if(DOCKED){pr.style.display='block';pr.innerHTML='<b>DOCKED — '+DOCKED.name+'</b> · <b>[T]</b> STATION MENU · <b>[F]</b> UNDOCK';}
 else if(SP.spd<45){pr.style.display='block';pr.innerHTML='<b>'+ns.name+'</b> — RANGE '+nd.toFixed(1)+' u · <b>[F]</b> DOCK';}
 else{pr.style.display='block';pr.innerHTML='<b>'+ns.name+'</b> — SLOW BELOW 45 u/s TO DOCK';}}
function nearestStation(){let best=null,bd=1e18;
 for(const st of STATIONS){if(st.sys!==FL.sys)continue;const d=st.dist!==undefined?st.dist:1e18;if(d<bd){bd=d;best=st;}}
 return best?{st:best,d:bd}:null;}
function tryDock(st){
 if(MODE!=='space'||DOCKED||WRP.on){sfx('deny');return;}
 if(SP.pos.distanceTo(st.posU)>14||SP.spd>60){sfx('deny');toast('TOO FAST OR TOO FAR — SLOW DOWN AND CLOSE IN');return;}
 DOCKED=st;SP.spd=0;SP.thr=0;sfx('dock');SHK.t=.6;SHK.amp=.3;
 toast('DOCKED — '+st.name+' · WELCOME ABOARD, '+ (NET.on?NET.id:'TRAVELER'),1);
 openTerm('station');}
function undockStation(silent){
 if(!DOCKED)return;
 const st=DOCKED;DOCKED=null;
 shipAxes();
 SP.pos.addScaledVector(SP.rt,st.r*3.4+10);
 SP.spd=14;
 if(!silent){sfx('dock');toast('UNDOCKED — CLEAR THE STRUCTURE');}}
function trade(k,n,buy){
 if(!DOCKED)return;
 const p=stnPrice(DOCKED,k);
 if(buy){const c=p*n;if(FL.cr<c){sfx('deny');toast('NOT ENOUGH CREDITS');return;}
  FL.cr-=c;INV[k]=(INV[k]||0)+n;sfx('cash');toast('BOUGHT '+n+' '+k.toUpperCase()+' — '+c+' CR');}
 else{const q=Math.min(n==='all'?Math.floor(INV[k]||0):n,Math.floor(INV[k]||0));
  if(q<1){sfx('deny');return;}
  INV[k]-=q;FL.cr+=p*q;sfx('cash');toast('SOLD '+q+' '+k.toUpperCase()+' — +'+(p*q)+' CR');}
 renderTerm();}
function stationSrv(srv){
 if(!DOCKED)return;
 const pay=c=>{if(FL.cr<c){sfx('deny');toast('NOT ENOUGH CREDITS');return false;}FL.cr-=c;sfx('cash');return true;};
 if(srv==='hull'){if(SYSD.hull>=100){toast('HULL ALREADY SOUND');return;}if(pay(60)){SYSD.hull=100;toast('YARD CREWS — HULL 100%');}}
 else if(srv==='water'){if(pay(30)){POW.rea.water=100;toast('REACTOR TANK FILLED');}}
 else if(srv==='rations'){if(pay(45)){INV.food+=10;toast('10 RATIONS LOADED');}}
 else if(srv==='parts'){if(pay(120)){INV.parts+=5;toast('5 SPARE PARTS LOADED');}}
 renderTerm();}
function fmtMS(at){const s=Math.max(0,Math.floor((at-Date.now())/1000));
 return s>90?Math.floor(s/60)+' min':s+' s';}
function boardMothership(ms){
 if(!DOCKED){sfx('deny');return;}
 if(FL.cr<40){sfx('deny');toast('PASSAGE COSTS 40 CR — SELL SOMETHING FIRST');return;}
 if(!SYSTEMS[ms.to]){sfx('deny');return;}
 FL.cr-=40;
 closeTerm(false);
 DOCKED=null;
 warpStart(ms.to,ms.name,true);}

/*------ CONSTRUCTION — build mode, parts library, signs, permissions ------*/
const BLDG={on:false,part:'wall',rot:0,ghost:null,ok:false,px:0,py:0,pz:0};
const PARTS={
 wall:{n:'WALL',cost:{m:2},cat:'STRUCTURE',solid:1},
 win:{n:'WINDOW WALL',cost:{m:2,p:1},cat:'STRUCTURE',solid:1},
 floor:{n:'PLATFORM',cost:{m:1},cat:'STRUCTURE'},
 stairs:{n:'STAIRS',cost:{m:2},cat:'STRUCTURE'},
 door:{n:'DOOR',cost:{m:2,p:1},cat:'ACCESS',door:1},
 gate:{n:'BIG GATE',cost:{m:4,p:2},cat:'ACCESS',door:1,w:1},
 airlock:{n:'AIRLOCK',cost:{m:5,p:3},cat:'ACCESS',door:1,airlock:1},
 counter:{n:'COUNTER',cost:{m:1},cat:'FURNITURE'},
 table:{n:'TABLE',cost:{m:2},cat:'FURNITURE'},
 chair:{n:'CHAIR',cost:{m:1},cat:'FURNITURE'},
 cot:{n:'COT',cost:{m:2,p:1},cat:'FURNITURE'},
 lamp:{n:'LAMP',cost:{p:1},cat:'SYSTEMS',lamp:1},
 solar:{n:'SOLAR PANEL',cost:{p:2,m:1},cat:'SYSTEMS',solar:1},
 sign:{n:'SIGN',cost:{p:1},cat:'SYSTEMS',sign:1},
 beacon:{n:'BEACON',cost:{p:2,e:1},cat:'SYSTEMS',beacon:1},
 printer:{n:'PART PRINTER',cost:{m:4,p:4},cat:'SYSTEMS',printer:1}};
const SURFBLD=[];let BLD_NL=0,SIGNEDIT=null;
function costStr(c){const p=[];if(c.m)p.push(c.m+' METAL');if(c.p)p.push(c.p+' PARTS');if(c.e)p.push(c.e+' EXO');return p.join(' + ')||'FREE';}
function canAfford(c){return(!c.m||INV.metal>=c.m)&&(!c.p||INV.parts>=c.p)&&(!c.e||INV.exo>=c.e);}
function partMesh(part,b){
 const g=new THREE.Group();
 const mtWall=new THREE.MeshLambertMaterial({color:0x8a97a5});
 const mtTrim=new THREE.MeshLambertMaterial({color:0x5a6a78});
 const mtGlass=new THREE.MeshLambertMaterial({color:0x9fd8ff,transparent:true,opacity:.45});
 const mtAmb=new THREE.MeshLambertMaterial({color:0xc98f4e,emissive:0x352008});
 const box=(w,h,d,m,x,y,z)=>{const mm=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);mm.position.set(x,y,z);g.add(mm);return mm;};
 if(part==='wall')box(2,2.4,.18,mtWall,0,1.2,0);
 else if(part==='win'){box(2,2.4,.18,mtWall,0,1.2,0);box(1.6,1.1,.22,mtGlass,0,1.5,0);}
 else if(part==='floor')box(2,.16,2,mtTrim,0,.08,0);
 else if(part==='stairs'){for(let i=0;i<6;i++)box(1.4,.4,.42,mtWall,0,.2+i*.38,-i*.42);}
 else if(part==='door'){box(.16,2.4,.5,mtTrim,-.55,1.2,0);box(.16,2.4,.5,mtTrim,.55,1.2,0);g.userData.slideL=box(.5,2.2,.14,mtWall,-.26,1.15,0);g.userData.slideR=box(.5,2.2,.14,mtWall,.26,1.15,0);box(.9,.16,.5,mtTrim,0,2.42,0);}
 else if(part==='gate'){box(.2,3,.6,mtTrim,-1.2,1.5,0);box(.2,3,.6,mtTrim,1.2,1.5,0);g.userData.slideL=box(1.1,2.8,.16,mtWall,-.58,1.45,0);g.userData.slideR=box(1.1,2.8,.16,mtWall,.58,1.45,0);box(2.4,.2,.6,mtTrim,0,3.05,0);}
 else if(part==='airlock'){box(.2,2.6,2.6,mtTrim,-1,1.3,0);box(.2,2.6,2.6,mtTrim,1,1.3,0);box(2.2,.2,2.6,mtTrim,0,2.65,0);
  g.userData.slideL=box(.5,2.4,.16,mtWall,-.27,1.25,-1.2);g.userData.slideR=box(.5,2.4,.16,mtWall,.27,1.25,-1.2);
  g.userData.slideL2=box(.5,2.4,.16,mtWall,-.27,1.25,1.2);g.userData.slideR2=box(.5,2.4,.16,mtWall,.27,1.25,1.2);}
 else if(part==='counter')box(2,.9,.8,mtWall,0,.45,0);
 else if(part==='table'){box(1.6,.1,1,mtTrim,0,.78,0);box(.12,.78,.12,mtTrim,-.6,.39,-.35);box(.12,.78,.12,mtTrim,.6,.39,-.35);box(.12,.78,.12,mtTrim,-.6,.39,.35);box(.12,.78,.12,mtTrim,.6,.39,.35);}
 else if(part==='chair'){box(.5,.08,.5,mtTrim,0,.48,0);box(.5,.6,.08,mtTrim,0,.86,-.22);box(.08,.48,.08,mtTrim,-.2,.24,-.2);box(.08,.48,.08,mtTrim,.2,.24,-.2);box(.08,.48,.08,mtTrim,-.2,.24,.2);box(.08,.48,.08,mtTrim,.2,.24,.2);}
 else if(part==='cot'){box(.9,.16,2,mtTrim,0,.42,0);box(.9,.12,.5,new THREE.MeshLambertMaterial({color:0x7dffa8}),0,.52,-.6);box(.1,.42,.1,mtTrim,-.38,.21,-.85);box(.1,.42,.1,mtTrim,.38,.21,-.85);box(.1,.42,.1,mtTrim,-.38,.21,.85);box(.1,.42,.1,mtTrim,.38,.21,.85);}
 else if(part==='lamp'){box(.1,2.2,.1,mtTrim,0,1.1,0);const bulb=box(.44,.3,.44,new THREE.MeshLambertMaterial({color:0xc98f4e,emissive:0xffb347,emissiveIntensity:1}),0,2.3,0);
  const li=new THREE.PointLight(0xffd9a0,1.5,14,1.5);li.position.set(0,2.25,0);g.add(li);g.userData.light=li;}
 else if(part==='solar'){box(.14,1.4,.14,mtTrim,0,.7,0);const pn=box(2.4,.08,1.4,new THREE.MeshLambertMaterial({color:0x2a4a8a,emissive:0x0a1830}),0,1.5,0);pn.rotation.x=-.42;}
 else if(part==='sign'){box(1.8,1.1,.1,mtTrim,0,1.5,0);box(.12,1,.12,mtTrim,-.6,.5,0);box(.12,1,.12,mtTrim,.6,.5,0);
  const cv=document.createElement('canvas');cv.width=256;cv.height=160;
  const tx=new THREE.CanvasTexture(cv);tx.colorSpace=THREE.SRGBColorSpace;
  const pl=new THREE.Mesh(new THREE.PlaneGeometry(1.7,1),new THREE.MeshBasicMaterial({map:tx,transparent:true}));
  pl.position.set(0,1.5,.07);g.add(pl);g.userData.signCv=cv;g.userData.signTex=tx;
  drawSign(g,b&&b.txt?b.txt:'');}
 else if(part==='beacon'){box(.14,2.6,.14,mtTrim,0,1.3,0);box(.5,.5,.5,mtAmb,0,2.7,0);box(.05,1.6,.05,mtTrim,0,3.6,0);
  const bc=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:0x7dffa8,transparent:true,blending:THREE.AdditiveBlending}));
  bc.position.set(0,4.4,0);bc.scale.setScalar(2.6);g.add(bc);g.userData.bcn=bc;
  g.userData.msg=(b&&b.msg)||'';}
 else if(part==='printer'){box(1.4,1.1,1,mtWall,0,.55,0);box(1,.1,.7,mtTrim,0,1.15,0);box(.3,.5,.3,mtAmb,-.4,1.4,0);}
 return g;}
function drawSign(g,txt){
 if(!g.userData.signCv)return;
 const cv=g.userData.signCv,x=cv.getContext('2d');
 x.fillStyle='#0a1208';x.fillRect(0,0,256,160);
 x.strokeStyle='#2f6f4f';x.lineWidth=4;x.strokeRect(6,6,244,148);
 x.fillStyle='#7dffa8';x.font='bold 22px Consolas';x.textAlign='center';x.textBaseline='middle';
 const words=(txt||'').slice(0,60).split(' ');let line='',lines=[];
 for(const w of words){if((line+' '+w).trim().length>16){lines.push(line.trim());line=w;}else line+=' '+w;}
 if(line.trim())lines.push(line.trim());lines=lines.slice(0,5);
 lines.forEach((l,i)=>x.fillText(l,128,80+(i-(lines.length-1)/2)*30));
 g.userData.signTex.needsUpdate=true;}
function hitGrp(g,label,prompt,act){
 let s=V3(2.3,2.8,2.3),c=null;
 try{g.updateMatrixWorld(true);
  const bb=new THREE.Box3().setFromObject(g);
  s.subVectors(bb.max,bb.min);c=V3().addVectors(bb.max,bb.min).multiplyScalar(.5);}catch(e){c=V3(0,1.3,0);}
 const hb=new THREE.Mesh(new THREE.BoxGeometry(Math.max(.05,s.x),Math.max(.05,s.y),Math.max(.05,s.z)),HITMAT);
 const eg=new THREE.LineSegments(new THREE.EdgesGeometry(hb.geometry),EDGEMAT);eg.visible=false;hb.add(eg);
 hb.userData={label,prompt,act,edge:eg};
 g.add(hb);
 try{hb.position.copy(g.worldToLocal(c.clone()));}catch(e){hb.position.set(0,1.3,0);}
 HITS.push(hb);return hb;}
function bldMine(b){return b.owner===NET.id||(b.owner==='YOU'&&!NET.on)||(!NET.on&&(b.owner===FL.netName||!b.owner));}
function wirePartHit(b,g){
 const P=PARTS[b.part];if(!P)return;
 const mine=bldMine(b);
 if(P.door)b._hit=hitGrp(g,'AUTO DOOR',mine?'AUTO — WALK UP':'LOCKED',()=>{if(!mine){sfx('deny');toast('LOCKED — BUILT BY '+(b.owner||'?'));}else toast('AUTOMATIC — JUST WALK THROUGH');});
 else if(P.sign)b._hit=hitGrp(g,'SIGN',mine?'EDIT TEXT':'READ',()=>{if(!mine){toast('SIGN READS: "'+(b.txt||'…')+'"');return;}SIGNEDIT=b;openTerm('sign');});
 else if(P.beacon)b._hit=hitGrp(g,'BEACON',mine?'SET MESSAGE':'READ',()=>{if(!mine){toast('BEACON: '+(b.msg||'…'));return;}SIGNEDIT=b;openTerm('sign');});
 else if(P.printer)b._hit=hitGrp(g,'PART PRINTER',mine?'PRINT PART (4 METAL)':'LOCKED',()=>{if(!mine){sfx('deny');toast('LOCKED — BUILT BY '+(b.owner||'?'));return;}
  if(INV.metal<4){sfx('deny');toast('NEED 4 METAL');return;}
  INV.metal-=4;FABQ.push({n:'PRINTING PART',t:0});sfx('beep');toast('PART PRINTING — CHECK REFINERY QUEUE');});
 else if(P.lamp)b._hit=hitGrp(g,'LAMP','TOGGLE',()=>{if(g.userData.light){g.userData.light.visible=!g.userData.light.visible;sfx('sw');}});
 else if(P.solar)b._hit=hitGrp(g,'SOLAR PANEL','STATUS',()=>{toast('SOLAR OUTPUT '+(MODE==='surface'&&LF.dayF>.3?Math.round(LF.dayF*100)+'%':'0% — NO SUN'));});
 b._mine=mine;}
function surfSpawn(b){
 const g=partMesh(b.part,b);
 g.position.set(b.p[0],b.p[1],b.p[2]);g.rotation.y=b.ry||0;
 SURFG.add(g);b._g=g;
 wirePartHit(b,g);
 if(PARTS[b.part].lamp)BLD_NL++;
 SURFBLD.push(b);}
function spawnSurfBuilds(){
 clearSurfBuilds();
 if(!LAND)return;
 const seen={};
 for(const b of FL.builds){
  if(b.mode!=='surface'||b.body!==LAND.b||!PARTS[b.part])continue;
  seen[b.id]=1;surfSpawn(b);}
 if(NET.on&&NET.world)for(const b of NET.world.builds){   // other pilots' bases, server-persisted
  if(seen[b.id]||b.mode!=='surface'||b.body!==LAND.b||!PARTS[b.part])continue;
  surfSpawn(b);}}
function clearSurfBuilds(){
 for(const b of SURFBLD){
  if(b._g){SURFG.remove(b._g);b._g=null;}
  if(b._hit){const i=HITS.indexOf(b._hit);if(i>=0)HITS.splice(i,1);b._hit=null;}}
 SURFBLD.length=0;BLD_NL=0;}
function bldToggle(){
 if(MODE!=='surface'||PL.seated||PL.mode==='rover'){sfx('deny');toast('BUILD MODE WORKS ON FOOT, ON A SURFACE');return;}
 BLDG.on=!BLDG.on;sfx('click');
 $('bld').style.display=BLDG.on?'block':'none';
 if(BLDG.on){bldPanel();bldGhostMake();toast('BUILD MODE — LMB PLACE · R ROTATE · X DEMOLISH · B EXIT',1);}
 else{if(BLDG.ghost){scene.remove(BLDG.ghost);BLDG.ghost=null;}}}
function bldPanel(){
 let h='<div class="brow">';
 const cats={};for(const k in PARTS)(cats[PARTS[k].cat]=cats[PARTS[k].cat]||[]).push(k);
 for(const c in cats){h+='<span id="gcat">'+c+'</span>';
  for(const k of cats[c]){const P=PARTS[k];
   h+='<span class="bslot'+(BLDG.part===k?' on':'')+(canAfford(P.cost)?'':' dis')+'" data-bp="'+k+'">'+P.n+'<br><span style="color:#7d8a7a;font-size:9px">'+costStr(P.cost)+'</span></span>';}}
 h+='</div><div class="bhint">METAL '+Math.floor(INV.metal)+' · PARTS '+Math.floor(INV.parts)+' · EXO '+Math.floor(INV.exo)+' — LMB PLACE · R ROTATE · X DEMOLISH (50% REFUND) · B EXIT</div>';
 $('bld').innerHTML=h;
 $('bld').querySelectorAll('[data-bp]').forEach(el=>el.onclick=()=>{BLDG.part=el.dataset.bp;sfx('click');bldPanel();bldGhostMake();});}
function bldGhostMake(){
 if(BLDG.ghost){scene.remove(BLDG.ghost);BLDG.ghost=null;}
 const g=partMesh(BLDG.part,null);
 g.traverse(o=>{if(o.material){o.material=o.material.clone();o.material.transparent=true;o.material.opacity=.42;}if(o.isLight)o.visible=false;});
 BLDG.ghost=g;scene.add(g);}
function bldGhostTick(){
 if(!BLDG.ghost||!TER)return;
 const dir=TMP3.set(0,0,-1).applyQuaternion(cam.quaternion);
 let bx=0,by=0,bz=0,found=false;
 for(let d=2.5;d<55;d+=1.1){
  const px=cam.position.x+dir.x*d,py=cam.position.y+dir.y*d,pz=cam.position.z+dir.z*d;
  if(py<=TER.h(px,pz)+1.1){bx=Math.round(px*2)/2;bz=Math.round(pz*2)/2;by=TER.h(bx,bz);found=true;break;}}
 if(!found){BLDG.ghost.visible=false;BLDG.ok=false;return;}
 const ok=canAfford(PARTS[BLDG.part].cost)&&!(PARTS[BLDG.part].lamp&&BLD_NL>=6);
 BLDG.ok=ok;BLDG.px=bx;BLDG.py=by;BLDG.pz=bz;
 BLDG.ghost.visible=true;
 BLDG.ghost.position.set(bx,by,bz);BLDG.ghost.rotation.y=BLDG.rot;
 BLDG.ghost.traverse(o=>{if(o.material&&o.material.color)o.material.color.setHex(ok?0x7dffa8:0xff5a5a);});}
function bldPlace(){
 if(!BLDG.on||!BLDG.ok){sfx('deny');return;}
 const P=PARTS[BLDG.part];
 if(!canAfford(P.cost)){sfx('deny');toast('INSUFFICIENT MATERIALS');bldPanel();return;}
 if(P.lamp&&BLD_NL>=6){sfx('deny');toast('LAMP LIMIT REACHED (6) — POWER BUDGET');return;}
 INV.metal-=P.cost.m||0;INV.parts-=P.cost.p||0;INV.exo-=P.cost.e||0;
 const b={id:'b'+Date.now().toString(36)+Math.floor(Math.random()*99),part:BLDG.part,mode:'surface',body:LAND.b,
  p:[BLDG.px,BLDG.py,BLDG.pz],ry:BLDG.rot,owner:NET.on?NET.id:(FL.netName||'YOU'),txt:'',msg:'',t:Date.now()};
 FL.builds.push(b);
 const g=partMesh(b.part,b);g.position.set(b.p[0],b.p[1],b.p[2]);g.rotation.y=b.ry;
 SURFG.add(g);b._g=g;wirePartHit(b,g);SURFBLD.push(b);
 if(NET.on&&window.MP)window.MP.bldPlace({id:b.id,part:b.part,mode:'surface',body:b.body,p:b.p,ry:b.ry,txt:'',msg:''});
 if(P.lamp)BLD_NL++;
 sfx('build');bldPanel();saveGame(true);}
function bldDemolish(){
 if(!BLDG.on)return;
 let best=null,bd=1e9;
 for(const b of SURFBLD){if(!b._g||!b._mine)continue;
  const d=b._g.position.distanceTo(PL.pos);if(d<bd){bd=d;best=b;}}
 if(!best||bd>7){sfx('deny');toast('NO OWN STRUCTURE IN REACH (7 m)');return;}
 const P=PARTS[best.part];
 INV.metal+=Math.floor((P.cost.m||0)*.5);INV.parts+=Math.floor((P.cost.p||0)*.5);INV.exo+=Math.floor((P.cost.e||0)*.5);
 if(P.lamp)BLD_NL--;
 if(best._hit){const i=HITS.indexOf(best._hit);if(i>=0)HITS.splice(i,1);}
 if(best._g)SURFG.remove(best._g);
 const j=FL.builds.indexOf(best);if(j>=0)FL.builds.splice(j,1);
 const k=SURFBLD.indexOf(best);if(k>=0)SURFBLD.splice(k,1);
 if(NET.on&&window.MP)window.MP.bldDel(best.id);
 sfx('build');toast(P.n+' DEMOLISHED — 50% REFUND');bldPanel();saveGame(true);}
function bldTick(dt){
 if(BLDG.on&&BLDG.ghost)bldGhostTick();
 for(const b of SURFBLD){
  if(!b._g)continue;const P=PARTS[b.part],g=b._g;
  if(P.door){
   const near=g.position.distanceTo(PL.pos)<(P.w?3.6:2.8);
   g.userData.dop=lerp(g.userData.dop||0,near?1:0,Math.min(1,dt*3.5));
   const o=g.userData.dop,W=P.w?1.14:.78;
   if(g.userData.slideL)g.userData.slideL.position.x=-.26-W*o;
   if(g.userData.slideR)g.userData.slideR.position.x=.26+W*o;
   if(g.userData.slideL2)g.userData.slideL2.position.x=-.27-W*o;
   if(g.userData.slideR2)g.userData.slideR2.position.x=.27+W*o;}
  else if(P.solar){if(MODE==='surface'&&LF.dayF>.3&&pwr('main'))POW.batt=clamp(POW.batt+dt*.4,0,100);}
  else if(P.beacon&&g.userData.bcn)g.userData.bcn.material.opacity=.5+.5*Math.sin(T.t*3+hashId(b.id));}}
/*------ deep-space builds ------*/
const SBG=new THREE.Group();scene.add(SBG);
function spaceBuildList(){
 const out=[],seen={};
 for(const b of FL.builds)if(b.mode==='space'&&PARTS[b.part]){out.push(b);seen[b.id]=1;}
 if(NET.on&&NET.world)for(const b of NET.world.beacons){if(!seen[b.id])out.push(b);}
 return out;}
function spaceBuildTick(){
 SBG.visible=MODE==='space';
 if(MODE!=='space')return;
 for(const b of spaceBuildList()){
  if(!b._g){b._g=partMesh(b.part||'beacon',b);SBG.add(b._g);
   if(PARTS[b.part||'beacon']&&(PARTS[b.part||'beacon'].sign||PARTS[b.part||'beacon'].beacon)){
    const mine=bldMine(b)||(b.who&&b.who===NET.id);
    hitGrp(b._g,PARTS[b.part||'beacon'].beacon?'BEACON':'SIGN',mine?'SET MESSAGE':'READ',()=>{toast((b.who||b.owner||'UNKNOWN')+' — "'+(b.msg||b.txt||'…')+'"');sfx('radio');});}}
  if(b._g){b._g.position.set(b.posU[0]-SP.pos.x,b.posU[1]-SP.pos.y,b.posU[2]-SP.pos.z);
   const d=b._g.position.length();b._g.visible=d<2e6;}}}
function deploySpace(part){
 if(MODE!=='space'){sfx('deny');toast('DEPLOY ONLY IN OPEN SPACE');return;}
 const P=PARTS[part];
 if(!canAfford(P.cost)){sfx('deny');toast('INSUFFICIENT MATERIALS');return;}
 shipAxes();
 const off=90+FL.builds.filter(b=>b.mode==='space').length*26;
 const jx=(Math.random()*2-1)*30,jy=(Math.random()*2-1)*12;
 const px=SP.pos.x+SP.fwd.x*off+SP.rt.x*jx,py=SP.pos.y+SP.fwd.y*off+SP.rt.y*jy,pz=SP.pos.z+SP.fwd.z*off+SP.rt.z*jy;
 INV.metal-=P.cost.m||0;INV.parts-=P.cost.p||0;INV.exo-=P.cost.e||0;
 const b={id:'s'+Date.now().toString(36),part,mode:'space',posU:[px,py,pz],ry:Math.random()*6.28,owner:NET.on?NET.id:(FL.netName||'YOU'),txt:'',msg:'',t:Date.now()};
 FL.builds.push(b);sfx('build');toast(P.n+' DEPLOYED OFF THE BOW — IT STAYS HERE FOREVER');
 saveGame(true);
 if(NET.on&&window.MP)window.MP.beaconPlace(b.id,part,[px,py,pz],'');}
/*------ radio beacons in range ------*/
const RADIOH={};let RADIOT=0;
function radioTick(dt){
 RADIOT+=dt;if(RADIOT<.5)return;RADIOT=0;
 const near=[];
 if(MODE==='space'){
  for(const b of spaceBuildList()){
   const p=b.posU;if(!p)continue;
   const d=Math.hypot(p[0]-SP.pos.x,p[1]-SP.pos.y,p[2]-SP.pos.z);
   if(d<2500&&(b.msg||b.txt))near.push({who:b.who||b.owner||'UNKNOWN',msg:b.msg||b.txt,d:d*8});}}
 else{
  for(const b of SURFBLD){if(!PARTS[b.part].beacon||!b.msg||!b._g)continue;
   const d=b._g.position.distanceTo(PL.pos);
   if(d<650)near.push({who:b.owner,msg:b.msg,d:d});}}
 const el=$('radio');
 if(near.length){near.sort((a,b2)=>a.d-b2.d);const n=near[0];
  el.style.display='block';
  el.innerHTML='<b>◉ RADIO — '+Math.round(n.d)+' km</b> · '+n.who+': "'+String(n.msg).slice(0,60)+'"';
  if(!RADIOH[n.who+n.msg]){RADIOH[n.who+n.msg]=1;sfx('squelch');}}
 else el.style.display='none';}
/*------ life support: per-compartment O2 · wiring · alarms ------*/
function zoneOf(z){return z<-3.5?'coc':z<4.5?'liv':z<10.5?'eng':'gar';}
const ZNAMES={coc:'COCKPIT',liv:'LIVING',eng:'ENGINEERING',gar:'GARAGE'};
function airlockOpenToVac(){
 if(MODE==='space')return rampOpen();
 if(MODE==='surface'&&LF.body&&(LF.body.at||0)<25)return rampOpen();
 return false;}
function o2Sim(dt){
 if(!FL.o2)return;
 SRFX.airlock=airlockOpenToVac();
 if(SRFX.airlock){
  FL.o2.gar=clamp(FL.o2.gar-dt*7,0,100);
  if(!doorOpenAt(10.5)){FL.o2.eng=clamp(FL.o2.eng-dt*2.5,0,100);FL.o2.liv=clamp(FL.o2.liv-dt*1.5,0,100);FL.o2.coc=clamp(FL.o2.coc-dt*1,0,100);}}
 const avg=(FL.o2.coc+FL.o2.liv+FL.o2.eng+FL.o2.gar)/4;
 const mix=Math.min(1,dt*.6);
 FL.o2.coc=lerp(FL.o2.coc,avg,mix);FL.o2.liv=lerp(FL.o2.liv,avg,mix);
 FL.o2.eng=lerp(FL.o2.eng,avg,mix);FL.o2.gar=lerp(FL.o2.gar,avg,mix);
 if(pwr('life')&&SYSD.lif>20){const r=dt*1.1*(FL.alloc?FL.alloc.life:1);
  FL.o2.coc=clamp(FL.o2.coc+r,0,100);FL.o2.liv=clamp(FL.o2.liv+r,0,100);
  FL.o2.eng=clamp(FL.o2.eng+r,0,100);FL.o2.gar=clamp(FL.o2.gar+r,0,100);}
 SRFX.o2=(FL.o2.coc<40||FL.o2.liv<40||FL.o2.eng<40||FL.o2.gar<40);
 if(PL.inside){VIT.cab=FL.o2[zoneOf(PL.pos.z)];
  if(VIT.cab>40)VIT.suit=clamp(VIT.suit+dt*5,0,100);}}
function wireHas(s,d){return (FL.wire||[]).some(w=>w.s===s&&w.d===d);}
const WSRCS=[['airlock','AIRLOCK OPEN'],['o2','O2 LOW'],['prox','PILOT PROXIMITY'],['dock','DOCKED/UNDOCKED']];
const WSNKS=[['lights','ALARM LIGHTS'],['siren','SIREN'],['hud','HUD WARNING'],['floods','EXT FLOODS']];
let ALARM={on:false};
function alarmTick(){
 const alarm=(SRFX.o2&&wireHas('o2','lights'))||(SRFX.airlock&&wireHas('airlock','lights'))||(SRFX.prox&&wireHas('prox','lights'));
 const siren=(SRFX.o2&&wireHas('o2','siren'))||(SRFX.airlock&&wireHas('airlock','siren'))||(SRFX.dock&&wireHas('dock','siren'));
 SRFX.hud=(SRFX.o2&&wireHas('o2','hud'))||(SRFX.airlock&&wireHas('airlock','hud'));
 setLoop('siren',siren?.3:0);
 ALARM.on=alarm||siren;
 const t=performance.now()*.007;
 for(const L of LIGHTS){
  if(L.userData.baseC===undefined)L.userData.baseC=L.color.clone();
  if(alarm){L.visible=true;L.intensity=(Math.sin(t)>0)?1.5:.15;L.color.setHex(0xff3020);}
  else L.color.copy(L.userData.baseC);}}
/*------ new terminal renders ------*/
function renderStation(b){
 if(!DOCKED){b.innerHTML='<div class="dim">NOT DOOCKED.</div>';return;}
 let h='<div class="row"><span class="tab'+(STKTAB==='market'?' on':'')+'" data-stk="market">MARKET</span><span class="tab'+(STKTAB==='serv'?' on':'')+'" data-stk="serv">SERVICES</span><span class="tab'+(STKTAB==='mom'?' on':'')+'" data-stk="mom">MOTHERSHIP</span></div>';
 h+='<div class="amb">DOCKED — '+DOCKED.name+' · CREDITS <b>'+Math.round(FL.cr)+' CR</b> · '+(NET.on?'BAND ONLINE — '+netCount()+' PILOTS':'LOCAL BAND')+'</div>';
 if(STKTAB==='market'){
  h+='<table><tr><th>COMMODITY</th><th>HOLD</th><th>PRICE</th><th>BUY</th><th>SELL</th></tr>';
  for(const k in COMMB){const p=stnPrice(DOCKED,k);
   h+='<tr><td>'+k.toUpperCase()+'</td><td>'+Math.floor(INV[k]||0)+'</td><td>'+p+' CR</td>'
    +'<td><button class="btn" data-buy="'+k+'">×1</button> <button class="btn" data-buy5="'+k+'">×5</button></td>'
    +'<td><button class="btn" data-sell="'+k+'">×1</button> <button class="btn" data-sell5="'+k+'">×5</button> <button class="btn" data-sella="'+k+'">ALL</button></td></tr>';}
  h+='</table><div class="dim">PRICES VARY BY STATION — MINE WHERE IT\'S CHEAP, SELL WHERE IT\'S RICH.</div>';}
 else if(STKTAB==='serv'){
  h+='<div class="row"><button class="btn" data-srv="hull">REPAIR HULL — 60 CR</button><button class="btn" data-srv="water">FILL REACTOR TANK — 30 CR</button></div>';
  h+='<div class="row"><button class="btn" data-srv="rations">BUY 10 RATIONS — 45 CR</button><button class="btn" data-srv="parts">BUY 5 PARTS — 120 CR</button></div>';
  h+='<div class="dim">CREDITS EARNED: SELL ORE, METAL, EXOTIC MATTER AT THE MARKET TAB.</div>';}
 else{
  const moms=NET.on&&NET.world?NET.world.mothers:[];
  h+='<h3>MOTHERSHIP DEPARTURES</h3><table><tr><th>VESSEL</th><th>ROUTE</th><th>DEPARTS</th><th></th></tr>';
  if(moms.length)for(const ms of moms)
   h+='<tr><td>'+ms.name+'</td><td>'+SYSTEMS[ms.from].name+' → '+SYSTEMS[ms.to].name+'</td><td>'+fmtMS(ms.at)+'</td><td><button class="btn" data-mom="'+ms.name+'">BOARD (40 CR)</button></td></tr>';
  else h+='<tr><td colspan="4" class="dim">CONNECT TO THE GLOBAL BAND (MAIN MENU ▸ MULTIPLAYER) TO SEE SCHEDULES.</td></tr>';
  h+='</table><div class="dim">MOTHERSHIPS FERRY SHIPS WITHOUT HYPERDRIVES ACROSS THE UNIVERSE — NO EXOTIC MATTER NEEDED.</div>';}
 h+='<div class="row"><button class="btn" id="undockb">UNDOCK — [F]</button></div>';
 b.innerHTML=h;
 b.querySelectorAll('[data-stk]').forEach(t=>t.onclick=()=>{STKTAB=t.dataset.stk;sfx('click');renderTerm();});
 b.querySelectorAll('[data-buy]').forEach(x=>x.onclick=()=>trade(x.dataset.buy,1,true));
 b.querySelectorAll('[data-buy5]').forEach(x=>x.onclick=()=>trade(x.dataset.buy5,5,true));
 b.querySelectorAll('[data-sell]').forEach(x=>x.onclick=()=>trade(x.dataset.sell,1,false));
 b.querySelectorAll('[data-sell5]').forEach(x=>x.onclick=()=>trade(x.dataset.sell5,5,false));
 b.querySelectorAll('[data-sella]').forEach(x=>x.onclick=()=>trade(x.dataset.sella,'all',false));
 b.querySelectorAll('[data-srv]').forEach(x=>x.onclick=()=>stationSrv(x.dataset.srv));
 b.querySelectorAll('[data-mom]').forEach(x=>x.onclick=()=>{const ms=(NET.world.mothers||[]).find(m=>m.name===x.dataset.mom);if(ms)boardMothership(ms);});
 $('undockb').onclick=()=>{undockStation();closeTerm();};}
function fillNetPanel(){
 netEvents();
 const p=$('netp'),MP=window.MP;
 let h='<div class="inner"><h2>GLOBAL BAND</h2>';
 const st=MP?MP.status:'off';
 if(NET.on&&MP)h+='<div class="grn">ONLINE — '+NET.id+' · '+netCount()+' PILOTS IN THE BLACK · RTT '+(MP.rtt==null?'—':MP.rtt+' ms')+'<br>ONE SHARED UNIVERSE — BASES, SIGNS &amp; BEACONS PERSIST FOR EVERYONE</div>';
 else if(MP&&st==='connecting')h+='<div class="amb">CONTACTING RELAY…</div>';
 else if(MP&&st==='lost')h+='<div class="red">LINK LOST — RECONNECTING…</div>';
 else if(MP&&st==='error')h+='<div class="red">'+(MP.lastErr||'CONNECTION FAILED')+'</div>';
 else h+='<div class="dim">OFFLINE — SINGLE PILOT. REGISTER A CALLSIGN TO JOIN THE LIVE BAND.</div>';
 h+='<div class="row"><input type="text" id="nurl" style="flex:1" placeholder="SERVER (BLANK = THIS HOST)" value="'+(MP?String(MP.server).replace(/^wss?:\/\//i,'').replace(/\/ws$/,''):'')+'"></div>';
 h+='<div class="row"><input type="text" id="ncall" maxlength="12" placeholder="CALLSIGN" style="flex:1" value="'+(NET.id||FL.netName||'')+'">'
  +'<input type="password" id="npass" maxlength="24" placeholder="PASSWORD (OPTIONAL)" style="flex:1"></div>';
 h+='<div class="row" style="align-items:flex-start;gap:14px"><canvas id="skinpv" width="120" height="160"></canvas>'
  +'<div class="dim" style="flex:1">YOUR SKIN IS GROWN FROM YOUR CALLSIGN — NO TWO PILOTS MATCH. REAL PILOTS FLY, CHAT, TALK AND BUILD ON ONE SHARED SERVER. PROXIMITY VOICE AWAKENS WHEN SHIPS PASS WITHIN 48,000 KM · [V] MUTES YOUR MIC.</div></div>';
 h+='<div class="row"><button class="mbtn" id="ncon">'+(NET.on?'RECONNECT':'CONNECT')+'</button>'
  +(NET.on?'<button class="mbtn" id="ndisc">DISCONNECT</button>':'')
  +'<button class="mbtn" id="nmic">MIC: '+(MP&&MP.voice&&MP.voice.state==='on'?'LIVE':'OFF')+'</button>'
  +'<button class="mbtn" id="nclose">CLOSE</button></div>';
 if(NET.on&&MP&&MP.roster&&MP.roster.length){
  h+='<h3 style="color:#7dffa8;letter-spacing:2px;margin:4px 0">PILOTS ONLINE ('+MP.roster.length+')</h3><div style="max-height:110px;overflow-y:auto">';
  for(const r of MP.roster)h+='<div class="dim">◆ '+r.n+' — '+(SYSTEMS[r.sys]?SYSTEMS[r.sys].name:r.sys)+(r.n===NET.id?' · YOU':'')+'</div>';
  h+='</div>';}
 h+='<div class="dim">'+(NET.on?'GLOBAL CHAT: COMMS TERMINAL [M] · PROXIMITY VOICE AUTOMATIC · MOTHERSHIP SCHEDULES AT ANY STATION':'RUN THE SERVER (npm start), CONNECT, AND FRIENDS JOIN THE SAME UNIVERSE FROM THE SAME NETWORK — OR ANYWHERE, IF YOU HOST IT.')+'</div></div>';
 p.innerHTML=h;
 const pv=$('skinpv');
 const upd=()=>{try{drawSkin(pv,mkSkin(($('ncall').value||'PILOT').toUpperCase()));}catch(e){}};
 $('ncall').oninput=upd;upd();
 $('ncon').onclick=()=>{netConnect($('ncall').value,$('npass').value,$('nurl').value);fillNetPanel();};
 if($('ndisc'))$('ndisc').onclick=()=>{netDisconnect();fillNetPanel();};
 if($('nmic'))$('nmic').onclick=()=>{const V=MP&&MP.voice;if(!V)return;
  V.setEnabled(V.state!=='on');
  if(V.state==='requesting')V.requestMic().then(()=>{if($('netp').style.display==='flex')fillNetPanel();});
  fillNetPanel();};
 $('nclose').onclick=()=>{p.style.display='none';
  if(PAUSED){try{const pl=renderer.domElement.requestPointerLock();if(pl&&pl.catch)pl.catch(()=>{});}catch(_){}}};}
function renderSign(b){
 const isB=!!SIGNEDIT;
 let h='<h3>'+(isB?(PARTS[SIGNEDIT.part]&&PARTS[SIGNEDIT.part].beacon?'BEACON BROADCAST':'SIGN EDITOR'):'SIGN')+'</h3>';
 h+='<div class="row"><input type="text" id="sgin" maxlength="60" style="flex:1" value="'+(isB?String(SIGNEDIT.txt||SIGNEDIT.msg||'').replace(/"/g,'&quot;'):'')+'" placeholder="YOUR WORDS, PERSISTING FOREVER"></div>';
 h+='<div class="row"><button class="btn" id="sgok">TRANSMIT — SAVE FOREVER</button></div>';
 h+='<div class="dim">CREATOR TEXT PERSISTS ON THE SERVER. BEACONS BROADCAST TO ANYONE WITHIN RADIO RANGE.</div>';
 b.innerHTML=h;
 $('sgok').onclick=()=>{
  const v=$('sgin').value.trim().slice(0,60);
  if(!isB)return;
  if(PARTS[SIGNEDIT.part]&&PARTS[SIGNEDIT.part].beacon)SIGNEDIT.msg=v;else SIGNEDIT.txt=v;
  if(SIGNEDIT._g&&SIGNEDIT._g.userData.signCv)drawSign(SIGNEDIT._g,v);
  if(NET.on&&window.MP)window.MP.bldTxt(SIGNEDIT.id,SIGNEDIT.txt||'',SIGNEDIT.msg||'');
  saveGame(true);sfx('radio');toast('TRANSMITTED — SAVED TO THE WORLD');closeTerm();};}
