/* ═══════════════════════════════════════════════════════════════
   LAST LIGHT — source part 7/10: p07-player.js
   INPUT, PLAYER, TOOLS, ROVER — movement, EVA, view models, rover
   NOTE: all parts share one closure; tools/build.js concatenates
   p01..p10 in order into client/js/game.js (byte-identical).
   ═══════════════════════════════════════════════════════════════ */
/*==================== PART 6 — INPUT, PLAYER, TOOLS, ROVER ====================*/
PL.mode='walk';PL.inside=true;
const KEYS={};let JDOWN=false,MB1=false;
const EXT={th:.6,ph:.32,dist:16,drag:false};
function initInput(){
 addEventListener('keydown',e=>{
  if(e.code==='Tab'){e.preventDefault();}
  const tg=e.target;
  if(tg&&((tg.tagName==='INPUT'&&tg.type!=='range')||tg.tagName==='TEXTAREA'||tg.tagName==='SELECT'||tg.isContentEditable)){if(e.code==='Escape')tg.blur();return;}
  if(!BOOTED)return;
  KEYS[e.code]=true;
  if(e.code==='Escape'){if(TERM)closeTerm();else if(!MENU&&!document.pointerLockElement)togglePause();return;}
  if(PAUSED||DEAD||INTRO.on&&!INTRO.done)return;
  if(e.code==='KeyE'){
   if(TERM){closeTerm();return;}
   if(PL.mode==='rover'){exitRover();return;}
   if(PL.seated){standUp();return;}
   if(HOVERED)useCurrent();return;}
  if(TERM)return;
  if(e.code==='KeyM'){openTerm('nav');return;}
  if(e.code==='Tab'){openTerm('inv');return;}
  if(e.code==='KeyC'){camMode=camMode==='ext'?'fp':'ext';sfx('click');toast(camMode==='ext'?'EXTERNAL CAMERA':'COCKPIT VIEW');return;}
  if(e.code==='KeyG'&&PL.mode!=='rover'){toggleGear();return;}
  if(e.code==='KeyN'&&PL.mode!=='rover'){SRF.align=!SRF.align;sfx('beep');toast(SRF.align?'AUTO-ALIGN ENGAGED — COURSE '+(COURSE?COURSE.name:'NOT SET'):'AUTO-ALIGN OFF');dashSync();return;}
  if(e.code==='KeyB'&&PL.mode!=='rover'){bldToggle();return;}
 if(e.code==='KeyV'){if(NET.on&&window.MP&&window.MP.voice&&window.MP.voice.state==='on'){const mu=window.MP.voice.toggleMute();sfx('sw');toast(mu?'MIC MUTED':'MIC LIVE');}else{sfx('deny');toast(NET.on?'MIC OFF — ENABLE IT IN MULTIPLAYER PANEL':'VOICE NEEDS THE BAND ONLINE');}return;}
  if(e.code==='KeyR'&&BLDG.on){BLDG.rot=(BLDG.rot+Math.PI/2)%(Math.PI*2);sfx('click');return;}
  if(e.code==='KeyX'&&BLDG.on){bldDemolish();return;}
  if(e.code==='KeyF'&&MODE==='space'&&!WRP.on){if(DOCKED)undockStation();
   else{const ns=nearestStation();if(ns&&ns.d<14&&SP.spd<60)tryDock(ns.st);else{sfx('deny');toast('NO STATION IN DOCK RANGE');}}return;}
  if(e.code==='KeyT'&&DOCKED){openTerm('station');return;}
  if(PL.mode==='rover'){
   if(e.code==='KeyL'){ROVER.lit=!ROVER.lit;sfx('sw');}
   if(e.code==='KeyB'){ROVER.rea=!ROVER.rea;sfx('sw');toast(ROVER.rea?'ROVER REACTOR ON':'ROVER REACTOR OFF');}
   if(e.code==='Space'){ROVER.spd=0;}
   return;}
  if(e.code.startsWith('Digit')){const n=+e.code.slice(5);if(n>=1&&n<=5){VM.set(n-1);sfx('click');}return;}
  if(e.code==='KeyX'&&PL.seated){SP.thr=0;sfx('click');}
  if(e.code==='KeyJ'){if(H.on){dropHyper();}else JDOWN=true;}
  if(e.code==='Space'&&PL.inside&&PL.onG&&!PL.seated){PL.vel.y=POW.grav?4.4:2.2;PL.onG=false;}
 });
 addEventListener('keyup',e=>{KEYS[e.code]=false;if(e.code==='KeyJ'){JDOWN=false;hyperRelease();}});
 renderer.domElement.addEventListener('mousedown',e=>{
  if(!BOOTED||MENU||PAUSED||DEAD||e.button!==0)return;
  MB1=true;
  if(TERM)return;
  const inIntro=INTRO.on&&!INTRO.done;
  if(!inIntro&&HOVERED){useCurrent();return;}
  if(camMode==='ext'&&document.pointerLockElement!==renderer.domElement){EXT.drag=true;return;}
  if(document.pointerLockElement!==renderer.domElement){try{const pl=renderer.domElement.requestPointerLock();if(pl&&pl.catch)pl.catch(()=>{});}catch(_){}return;}
  if(BLDG.on){if(BLDG.ok)bldPlace();else sfx('deny');return;}
  if(!inIntro&&VM.cur===1)scannerPing();});
 addEventListener('mouseup',e=>{if(e.button===0){MB1=false;EXT.drag=false;}});
 addEventListener('mousemove',e=>{
  if(!BOOTED||MENU||PAUSED||DEAD)return;
  if(camMode==='ext'&&(EXT.drag||document.pointerLockElement===renderer.domElement)){EXT.th-=e.movementX*.005;EXT.ph=clamp(EXT.ph-e.movementY*.005,-1.2,1.35);return;}
  if(document.pointerLockElement===renderer.domElement){
   const s=.0022*SET.sens;
   if(PL.seated){STK.x=clamp(STK.x+e.movementX*.0016,-1,1);STK.y=clamp(STK.y+e.movementY*.0016,-1,1);}
   else{PL.yaw-=e.movementX*s;PL.pitch=clamp(PL.pitch-e.movementY*s,-1.5,1.5);}}});
 addEventListener('wheel',e=>{if(camMode==='ext')EXT.dist=clamp(EXT.dist*(e.deltaY>0?1.12:.9),7,400);});
 document.addEventListener('pointerlockchange',()=>{
  if(document.pointerLockElement)return;
  if(BOOTED&&!MENU&&!PAUSED&&!DEAD&&!TERM&&!(INTRO.on&&!INTRO.done))togglePause();});
}
function togglePause(){PAUSED=!PAUSED;
 $('pause').style.display=PAUSED?'flex':'none';
 if(PAUSED){sfx('beep');if(document.pointerLockElement)document.exitPointerLock();}
 else{sfx('click');try{const pl=renderer.domElement.requestPointerLock();if(pl&&pl.catch)pl.catch(()=>{});}catch(_){}}}
$('pres').onclick=togglePause;
$('psave').onclick=()=>{saveGame();sfx('beep');};
$('pload').onclick=()=>{if(loadGame()){PAUSED=false;$('pause').style.display='none';resumeState();toast('STATE LOADED — SYSTEMS RESTORED');sfx('beep');}else{toast('NO SAVE FOUND');sfx('deny');}};
$('psetb').onclick=()=>{const p=$('pset');p.style.display=p.style.display==='block'?'none':'block';sfx('click');};
$('pctl').onclick=()=>{const p=$('plist');p.style.display=p.style.display==='block'?'none':'block';};
$('pnet').onclick=()=>{fillNetPanel();$('netp').style.display='flex';};
$('pmenu').onclick=()=>{saveGame(true);location.reload();};
$('pnew').onclick=()=>{if(confirm('ABANDON CURRENT SAVE AND START OVER?')){localStorage.removeItem(SAVEKEY);location.reload();}};
$('dload').onclick=()=>{if(loadGame()){DEAD=false;$('death').style.display='none';resumeState();}else{toast('NO SAVE FOUND');}};
$('dnew').onclick=()=>{localStorage.removeItem(SAVEKEY);location.reload();};
$('wcont').onclick=()=>{$('winov').style.display='none';};
/*--------- sit / stand ---------*/
function sitDown(x){
 if(PL.mode==='rover')exitRover();
 PL.seated=true;PL.seatX=x;PL.inside=true;closeTerm();clearHover();sfx('thud');
 toast('PILOT MODE — W/S THROTTLE · MOUSE STICK · J HYPERSPEED · E STAND');}
function standUp(){
 PL.seated=false;STK.x=0;STK.y=0;
 if(MODE==='space'&&SP.thr>0)toast('AUTOPILOT HOLD — SHIP UNDERWAY AT '+Math.round(SP.thr*100)+'% THROTTLE · E TO RETURN',1);
 else SP.thr=0;
 PL.pos.set(PL.seatX+.72,0,-6.1);PL.vel.set(0,0,0);HVX=HVZ=0;PL.yaw=Math.PI;PL.pitch=0;
 sfx('thud');}
/*--------- ground sampling ---------*/
function groundAt(x,z){
 if(MODE==='surface'){
  const l=shipToLocal(V3(x,10,z),TMP3);
  if(Math.abs(l.x)<2.4&&l.z<21.7&&l.z>-8.2&&(l.z<13.95||rampOpen())){
   const fl=l.z<13.95?0:-(l.z-14)*.18;
   return SHIPG.position.y+fl;}
  return TER.h(x,z);}
 return 0;}
/*--------- player update ---------*/
let WALKPH=0,HVX=0,HVZ=0,STEPA=0;
const ROVERC={x1:.18,x2:1.72,z1:10.9,z2:13.4};
function collList(){return ROVER.out?COLL:COLL.concat([ROVERC]);}
function playerUpdate(dt){
 if(PL.seated||PL.mode==='rover'||INTRO.on||TERM)return;
 let sp=(KEYS.ShiftLeft||KEYS.ShiftRight)?5.4:3.1;
 const g=MODE==='surface'?(LF.body.g||9.8):(POW.grav?9.81:1.4);
 if(PL.inside){
  const l=TMP3.copy(PL.pos);
  let mx=0,mz=0;
  if(KEYS.KeyW)mz-=1;if(KEYS.KeyS)mz+=1;if(KEYS.KeyA)mx-=1;if(KEYS.KeyD)mx+=1;
  const len=Math.hypot(mx,mz)||1;mx/=len;mz/=len;
  const sy=Math.sin(PL.yaw),cy=Math.cos(PL.yaw);
  const kk=1-Math.exp(-dt*13);
  HVX+=((sy*mz+cy*mx)*sp-HVX)*kk;HVZ+=((cy*mz-sy*mx)*sp-HVZ)*kk;
  let dx=HVX*dt, dz=HVZ*dt;
  let nx=l.x+dx,nz=l.z+dz;
  nx=clamp(nx,-1.78,1.78);
  const canRamp=MODE==='surface'&&rampOpen();
  for(const D of DOORS){
   if(D.open<.75){
    if(l.z<D.z&&nz>=D.z-.28)nz=D.z-.28;
    if(l.z>D.z&&nz<=D.z+.28)nz=D.z+.28;}}
  if(nz<-7.72)nz=-7.72;
  if(canRamp){if(nz>21.5)nz=21.5;}
  else if(nz>13.82)nz=13.82;
  for(const c of collList()){
   if(nx>c.x1-.28&&nx<c.x2+.28&&nz>c.z1-.28&&nz<c.z2+.28){
    const pushX=(nx<(c.x1+c.x2)/2)?c.x1-.28:c.x2+.28;
    const pushZ=(nz<(c.z1+c.z2)/2)?c.z1-.28:c.z2+.28;
    if(Math.abs(nx-pushX)<Math.abs(nz-pushZ))nx=pushX;else nz=pushZ;}}
  let fl=0;
  if(canRamp&&nz>13.95)fl=-(nz-14)*.18;
  PL.vel.y-=g*dt;let ny=l.y+PL.vel.y*dt;
  if(ny<=fl){if(l.y-fl>.05&&PL.vel.y<-3.2)sfx('thud');ny=fl;PL.vel.y=0;PL.onG=true;}else PL.onG=false;
  PL.pos.set(nx,ny,nz);
  if(MODE==='surface'&&nz>=21.4&&canRamp){goOutside();}
  WALKPH+=Math.hypot(dx,dz)*3.4;
  if(PL.onG){STEPA+=Math.hypot(dx,dz);const str=(KEYS.ShiftLeft||KEYS.ShiftRight)?1.3:.92;if(STEPA>str){STEPA=0;sfx('step');}}
 }else{
  let mx=0,mz=0;
  if(KEYS.KeyW)mz-=1;if(KEYS.KeyS)mz+=1;if(KEYS.KeyA)mx-=1;if(KEYS.KeyD)mx+=1;
  const len=Math.hypot(mx,mz)||1;mx/=len;mz/=len;
  const sy=Math.sin(PL.yaw),cy=Math.cos(PL.yaw);
  const wl=TER.wl;
  const inWater=wl!==null&&PL.pos.y-1.4<wl;
  if(inWater)sp*=.55;
  const kk=1-Math.exp(-dt*13);
  HVX+=((sy*mz+cy*mx)*sp-HVX)*kk;HVZ+=((cy*mz-sy*mx)*sp-HVZ)*kk;
  PL.pos.x+=HVX*dt;
  PL.pos.z+=HVZ*dt;
  PL.vel.y-=g*dt;
  PL.pos.y+=PL.vel.y*dt;
  for(const b of SURFBLD){
   if(!b._g||!PARTS[b.part]||!PARTS[b.part].solid)continue;
   const wx=b._g.position.x,wz=b._g.position.z;
   if(PL.pos.x>wx-1.15&&PL.pos.x<wx+1.15&&PL.pos.z>wz-1.15&&PL.pos.z<wz+1.15){
    const dx=PL.pos.x-wx,dz=PL.pos.z-wz;
    if(Math.abs(dx)>Math.abs(dz))PL.pos.x=dx>0?wx+1.15:wx-1.15;
    else PL.pos.z=dz>0?wz+1.15:wz-1.15;}}
  let gy=TER.h(PL.pos.x,PL.pos.z);
  if(inWater&&gy<wl)gy=wl;
  if(PL.pos.y<=gy){PL.pos.y=gy;PL.vel.y=0;PL.onG=true;}else PL.onG=false;
  if(PL.onG&&KEYS.Space)PL.vel.y=4.4;
  const dShip=Math.hypot(PL.pos.x,PL.pos.z);
  if(dShip>700){const k=700/dShip;PL.pos.x*=k;PL.pos.z*=k;
   if(T.t-(SRF.tetherT||0)>5){SRF.tetherT=T.t;toast('TETHER LIMIT — TURN BACK',1);}}
  const l=shipToLocal(PL.pos,TMP3);
  if(l.z<21.45&&rampOpen()&&Math.abs(l.x)<2.3)goInside();
  WALKPH+=Math.hypot(mx,mz)*3.4;
  if(PL.onG){STEPA+=Math.hypot(HVX,HVZ)*dt;const str=(KEYS.ShiftLeft||KEYS.ShiftRight)?1.35:.95;if(STEPA>str){STEPA=0;sfx('step');}}
  VIT.suit=clamp(VIT.suit-dt*.24,0,100);
  if(VIT.suit<=0)hurt(dt*4,'OXYGEN DEPRIVATION');
  const tt=LF.temp;
  if(tt<-40&&dShip>60)hurt(dt*.35,'HYPOTHERMIA');
  if(tt>55&&dShip>60)hurt(dt*.5,'HEAT STROKE');
 }
}
function goOutside(){PL.inside=false;PL.suitOn=true;HVX=HVZ=0;PL.pos.copy(localToShip(PL.pos,TMP2));toast('EVA — SUIT O2 DRAINING · RETURN TO REPLENISH');sfx('hiss');}
function goInside(){PL.inside=true;PL.suitOn=false;HVX=HVZ=0;PL.pos.copy(shipToLocal(PL.pos,TMP2));toast('AIRLOCK CYCLED — WELCOME HOME');sfx('hiss');}
function hurt(n,cause){VIT.hp=clamp(VIT.hp-n,0,100);PL.hurtT=.4;LASTHIT=cause;
 if(VIT.hp<=0)die(cause);}
let LASTHIT='';
function die(cause){
 if(DEAD)return;DEAD=true;
 if(document.pointerLockElement)document.exitPointerLock();
 $('dcause').innerHTML=(cause||'UNKNOWN')+'<br><span class="dim" style="color:#887">Mission clock '+fmtT(T.t)+' · '+(MODE==='surface'?('LANDED ON '+LF.body.name):'IN FLIGHT')+'</span>';
 $('death').style.display='flex';sfx('boom');setLoop('eng',0);setLoop('hyp',0);setLoop('drl',0);}
/*--------- view models ---------*/
const VM={g:new THREE.Group(),cur:0,models:[],lamp:null,drillSpin:0};
cam.add(VM.g);scene.add(cam);
VM.g.position.set(.34,-.3,-.62);
function buildVM(){
 const mm=c=>new THREE.MeshLambertMaterial({color:c});
 const mk=(fn)=>{const g=new THREE.Group();fn(g);g.visible=false;VM.g.add(g);VM.models.push(g);return g;};
 mk(g=>{});
 mk(g=>{const b=new THREE.Mesh(new THREE.BoxGeometry(.07,.05,.16),mm(0x3a5a4a));g.add(b);
  const s=new THREE.Mesh(new THREE.PlaneGeometry(.05,.035),new THREE.MeshBasicMaterial({color:0x2aff88}));s.position.set(0,.03,0);g.add(s);
  const a=new THREE.Mesh(new THREE.CylinderGeometry(.004,.004,.1,5),mm(0x888));a.position.set(0,.05,.04);g.add(a);});
 mk(g=>{const b=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,.26,10),mm(0x554433));b.rotation.x=Math.PI/2;g.add(b);
  const h=new THREE.Mesh(new THREE.BoxGeometry(.06,.1,.06),mm(0x333));h.position.set(0,-.08,.06);g.add(h);
  const bit=new THREE.Mesh(new THREE.CylinderGeometry(.012,.03,.14,6),mm(0xb8a888));bit.rotation.x=Math.PI/2;bit.position.set(0,0,-.19);g.add(bit);g.userData.bit=bit;});
 mk(g=>{const h=new THREE.Mesh(new THREE.CylinderGeometry(.018,.022,.5,7),mm(0x7a5a30));g.add(h);
  const hd=new THREE.Mesh(new THREE.BoxGeometry(.3,.05,.05),mm(0x555));hd.position.y=.25;g.add(hd);});
 mk(g=>{const b=new THREE.Mesh(new THREE.CylinderGeometry(.03,.035,.2,8),mm(0x444));b.rotation.x=.3;g.add(b);
  const hd=new THREE.Mesh(new THREE.CylinderGeometry(.05,.03,.06,8),mm(0xffd9a0));hd.position.set(0,.05,-.08);g.add(hd);});
 VM.lamp=new THREE.SpotLight(0xfff2d0,0,34,.55,.5,1.3);VM.lamp.position.set(0,.1,0);VM.lamp.target.position.set(0,0,-10);VM.lamp.visible=false;
 VM.g.add(VM.lamp);VM.g.add(VM.lamp.target);
 VM.set=(i)=>{VM.cur=i;for(let k=0;k<VM.models.length;k++)VM.models[k].visible=(k===i);
  if(VM.lamp){VM.lamp.intensity=(i===4)?2.6:0;VM.lamp.visible=(i===4);}
  FL.hot=i;drawHotbar();};
 VM.set(0);}
function vmUpdate(dt){
 if(PL.mode==='rover'||camMode==='ext'){VM.g.visible=false;return;}
 VM.g.visible=true;
 const bob=Math.sin(WALKPH)*0.014;
 VM.g.position.set(.34,-.3+bob,-.62);
 const dr=VM.models[2];
 if(dr&&dr.visible&&MB1&&!TERM&&MODE==='surface'&&!PL.inside){
  dr.userData.bit.rotation.z+=dt*40;VM.g.position.x+=rnd(-.004,.004);VM.g.position.y+=rnd(-.004,.004);}}
/*--------- mining / scanner ---------*/
let MINEP=0,SCANBUF=0;
function toolUpdate(dt){
 if(TERM||PAUSED)return;
 if(MB1&&VM.cur===2&&MODE==='surface'&&!PL.inside&&PL.mode==='walk'&&!PL.seated){
  const r=LF.body.res||{},buff=(T.t-SCANBUF<90)?1.3:1;
  let got=null;
  if(r.ore&&Math.random()<dt*.85*buff*(r.ore*.4)){INV.ore+=1;got='ORE';}
  else if(r.ice&&Math.random()<dt*.9*buff*(r.ice*.4)){INV.ice+=1;got='ICE';}
  else if(r.exo&&Math.random()<dt*.16*buff*r.exo){INV.exo+=1;got='EXOTIC MATTER';}
  if(got){sfx('pickup');toast('+1 '+got);}
  setLoop('drl',.4);}
 else if(MB1&&VM.cur===3&&MODE==='surface'&&!PL.inside&&PL.mode==='walk'&&!PL.seated){
  const r=LF.body.res||{};
  if(r.ore&&Math.random()<dt*1.2){INV.ore+=1;sfx('pickup');toast('+1 ORE');}
  setLoop('drl',.25);}
 else setLoop('drl',0);}
function scannerPing(){
 if(MODE!=='surface'||PL.inside){toast('SCANNER: USE PLANETSIDE, OUTSIDE THE HULL');return;}
 SCANBUF=T.t;sfx('beep');
 const r=LF.body.res||{};
 toast('GROUND SCAN — '+resStr(LF.body));
 if(r.exo)toast('EXOTIC TRACE CONFIRMED — DRILL HERE',1);}
/*--------- rover ---------*/
function enterRover(){
 if(MODE!=='surface'){toast('ROVER IS GARAGED IN FLIGHT');return;}
 if(!ROVER.out){if(!rampOpen()){toast('DEPLOY THE RAMP FIRST');sfx('deny');return;}
  ROVER.wpos.copy(localToShip(V3(-.9,0,20.2),TMP2));undockRover();}
 PL.mode='rover';closeTerm();clearHover();
 toast('ROVER — WASD DRIVE · SPACE BRAKE · L LIGHTS · B POWER · E EXIT');sfx('thud');}
function exitRover(){
 PL.mode='walk';setLoop('eng',0);
 PL.pos.copy(ROVER.g.position);PL.pos.x+=1.6;PL.pos.y=groundAt(PL.pos.x,PL.pos.z);
 PL.vel.set(0,0,0);PL.yaw=ROVER.head+Math.PI/2;sfx('thud');}
function roverUpdate(dt){
 if(PL.mode!=='rover')return;
 const powered=ROVER.rea||ROVER.batt>0;
 if(ROVER.rea)ROVER.batt=clamp(ROVER.batt+dt*1.2,0,100);
 else if(ROVER.lit)ROVER.batt=clamp(ROVER.batt-dt*.15,0,100);
 for(const L of ROVERLAMPS){L.intensity=(ROVER.lit&&powered)?2.2:0;L.visible=L.intensity>.01;}
 if(!powered){ROVER.spd=0;return;}
 let acc=0;
 if(KEYS.KeyW)acc=6;if(KEYS.KeyS)acc=-3.5;
 ROVER.spd=clamp(ROVER.spd+acc*dt,-4,13);
 if(!acc)ROVER.spd*=Math.exp(-dt*1.1);
 if(KEYS.Space)ROVER.spd*=Math.exp(-dt*6);
 const st=(KEYS.KeyA?1:0)-(KEYS.KeyD?1:0);
 ROVER.head+=st*1.5*dt*clamp(Math.abs(ROVER.spd)/4,.15,1)*Math.sign(ROVER.spd||1);
 const sy=Math.sin(ROVER.head),cy=Math.cos(ROVER.head);
 let nx=ROVER.g.position.x-sy*ROVER.spd*dt;
 let nz=ROVER.g.position.z-cy*ROVER.spd*dt;
 const l=shipToLocal(V3(nx,10,nz),TMP3);
 if(Math.abs(l.x)<2.5&&l.z>-8&&l.z<21.7){
  if(l.z>=13.95&&!rampOpen()){nz=ROVER.g.position.z;ROVER.spd=0;}
  else if(l.z>=21.6){/*out*/}
  else{const fl=(l.z>13.95)?-(l.z-14)*.18:0;ROVER.g.position.y=SHIPG.position.y+fl;}}
 const dA=Math.hypot(nx,nz);
 if(dA>780){const k=780/dA;nx*=k;nz*=k;toast('ROVER TETHER LIMIT',1);ROVER.spd=0;}
 ROVER.g.position.x=nx;ROVER.g.position.z=nz;
 const g=groundAt(nx,nz);
 if(MODE==='surface'&&dA>0){
  const hF=groundAt(nx-sy*.9,nz-cy*.9),hB=groundAt(nx+sy*.9,nz+cy*.9),hL=groundAt(nx-cy*.8,nz+sy*.8),hR=groundAt(nx+cy*.8,nz-sy*.8);
  ROVER.g.position.y=Math.max(g,(hF+hB+hL+hR)/4);
  const pitch2=Math.atan2(hB-hF,1.8),roll2=Math.atan2(hR-hL,1.6);
  ROVER.g.rotation.set(pitch2,ROVER.head,-roll2,'YXZ');}
 else ROVER.g.rotation.y=ROVER.head;
 for(const w of ROVERWHEELS)w.rotation.x+=ROVER.spd*dt*2.6;
 ROVER.wpos.copy(ROVER.g.position);
 setLoop('eng',Math.abs(ROVER.spd)>.3?.25:0,120+Math.abs(ROVER.spd)*20);
 const l2=shipToLocal(ROVER.g.position,TMP3);
 if(l2.z<13.8&&Math.abs(l2.x)<2.3&&Math.abs(ROVER.spd)<.6){dockRover();PL.mode='walk';PL.inside=true;PL.pos.set(-.2,0,11.5);PL.vel.set(0,0,0);PL.yaw=0;toast('ROVER DOCKED');}}
function drawHotbar(){
 const names=['HAND','SCANNER','DRILL','PICKAXE','LAMP'],icons=['·','[((·))',']|[——]','⌐¬','☼'];
 let h='';
 for(let i=0;i<5;i++)h+='<div class="slot'+(VM.cur===i?' on':'')+'" data-i="'+i+'"><em>'+(i+1)+'</em>'+names[i]+'</div>';
 $('hb').innerHTML=h;
 $('hb').querySelectorAll('.slot').forEach(s=>s.onclick=()=>{VM.set(+s.dataset.i);sfx('click');});}
