/* ═══════════════════════════════════════════════════════════════
   LAST LIGHT — source part 10/10: p10-loop.js
   SIM, HUD, INTRO, BOOT, LOOP
   NOTE: all parts share one closure; tools/build.js concatenates
   p01..p10 in order into client/js/game.js (byte-identical).
   ═══════════════════════════════════════════════════════════════ */
/*==================== PART 8 — SIM, HUD, INTRO, BOOT, LOOP ====================*/
function powerSim(dt,gdt){
 if(POW.rea.on){
  POW.rea.water=clamp(POW.rea.water-gdt*(100/86400),0,100);
  if(POW.rea.water<=0){POW.rea.on=false;POW.rea.scram=20*86400;toast('REACTOR SCRAM — COOLANT EXHAUSTED',1);sfx('boom');}
  POW.batt=clamp(POW.batt+dt*1.4,0,100);}
 if(POW.rea.scram>0)POW.rea.scram=Math.max(0,POW.rea.scram-gdt);
 let load=0;
 if(POW.brk.life)load+=.09;if(POW.brk.nav)load+=.035;if(POW.brk.lit)load+=.045;
 load+=.3*SP.thr;
 if(!POW.rea.on)POW.batt=clamp(POW.batt-load*dt,0,100);
 const pp=pwr('main');
 for(const L of LIGHTS){
  if(L.userData.emerg){L.intensity=pp?0:.55;L.visible=!pp;continue;}
  L.intensity=(pp&&POW.brk.lit)?2.3:(pp?.2:0);L.visible=L.intensity>.01;}
 if(ENSTRIP)ENSTRIP.emissiveIntensity=(pp&&POW.brk.lit)?1.5:.05;
 if(SHIPG.userData.winMats)for(const m of SHIPG.userData.winMats)m.emissiveIntensity=(pp&&POW.brk.lit)?1.15:.12;
 if(SHIPG.userData.extL){SHIPG.userData.extL.intensity=(SRF.extL&&MODE==='surface'&&pp)?3.2:0;SHIPG.userData.extL.visible=SHIPG.userData.extL.intensity>.01;}
 if(REACORE){REACORE.material.emissiveIntensity=POW.rea.on?(1.1+.4*Math.sin(T.t*3)):.04;
  REACORE.material.emissive.setHex(POW.rea.on?(POW.rea.water<25?0xff5030:0x44ffbb):0x221111);}
 setLoop('rea',POW.rea.on?.13:0);}
function survivalSim(dt,gdt){
 if(!PL.inside||!FL.o2){
  if(pwr('life')&&SYSD.lif>20){VIT.cab=clamp(VIT.cab+dt*6,0,100);if(PL.inside)VIT.suit=clamp(VIT.suit+dt*5,0,100);}
  else VIT.cab=clamp(VIT.cab-gdt*.03,0,100);}
 if(VIT.cab<=0&&PL.inside)hurt(dt*.5,'CABIN OXYGEN DEPLETED — LIFE SUPPORT OFFLINE');
 VIT.hun=clamp(VIT.hun-gdt*(100/(3*86400)),0,100);
 VIT.thi=clamp(VIT.thi-gdt*(100/(2*86400)),0,100);
 if(VIT.hun<=0)hurt(dt*.2,'STARVATION');
 if(VIT.thi<=0)hurt(dt*.3,'DEHYDRATION');
 if(!POW.heat&&MODE==='surface'&&LF.temp<-20&&PL.inside)hurt(dt*.12,'CABIN FREEZING — HEAT OFFLINE');
 if(VIT.hp<100&&VIT.hun>25&&VIT.thi>25&&VIT.suit>0&&(PL.inside||MODE==='space'))VIT.hp=clamp(VIT.hp+dt*.8,0,100);}
function audioTick(){
 if(!AU.on)return;
 setLoop('wind',MODE==='surface'&&!PL.inside?(SRF.wind||0)*.5:(MODE==='surface'?.08:0));
 const almw=(POW.rea.scram>0)||(SYSD.hull<25)||VIT.hp<25;
 setLoop('alm',almw?(Math.sin(performance.now()*.008)>0?.35:0):0);
 if(VIT.hp<25&&performance.now()-(SRF.beat||0)>760){SRF.beat=performance.now();sfx('thud');}}
/*--------- HUD ---------*/
let hudAcc=0;
function bar(v,c){return '<div class="bl">'+c+'</div><div class="bar"><i style="width:'+clamp(v,0,100)+'%;background:'+(v>50?'#7dffa8':v>25?'#ffb347':'#ff5a5a')+'"></i></div>';}
function hudUpdate(){
 const st=$('clk');
 if(MODE==='surface'){
  const lh=Math.floor(LF.lst),lm=Math.floor(LF.lst%1*60);
  st.textContent='SHIP TIME '+fmtT(T.t)+'\n'+LF.body.name.toUpperCase()+' · LOCAL SOLAR '+('0'+lh).slice(-2)+':'+('0'+lm).slice(-2)+'\nEXT '+(PL.inside?'21':LF.temp.toFixed(0))+'°C · GRAV '+LF.body.g+' g · CR '+Math.round(FL.cr)+(NET.on?' · ◉ BAND ('+netCount()+')':'');
 }else{
  let nb=null,nd=1e18;
  for(const b of BODY){if(b.t==='star')continue;if(b.id==='earth'&&FLG.earthGone)continue;const d=SP.pos.distanceTo(b.posU)-b.r*US;if(d<nd&&d>-b.r*US){nd=d;nb=b;}}
  let hs='SHIP TIME '+fmtT(T.t)+'\n'+SYSTEMS[FL.sys].name+(nb?'\nNEAREST: '+nb.name+' — ALT '+fmtK(Math.max(0,nd*8)):'');
  if(FLG.earthGone&&DEB&&DEB.on){const eb=bodyById('earth'),er=eb.r*US*2.4*DEB.grp.scale.x,ed=SP.pos.distanceTo(DEB.posU);
   hs+='\nDEBRIS FIELD '+(ed<er?'— INSIDE':'RANGE '+fmtK((ed-er)*8));}
  if(SRF.nebName)hs+='\nNEBULA: '+SRF.nebName;
  if(SRF.bhK>.05)hs+='\nTIME DILATION ×'+(T.rate/60).toFixed(2);
  hs+='\nCR '+Math.round(FL.cr)+(NET.on?' · ◉ BAND ONLINE ('+netCount()+')':'');
  if(DOCKED)hs+='\nDOCKED — '+DOCKED.name+' · [T] MENU · [F] UNDOCK';
  st.textContent=hs;}
 const zO2=PL.inside&&FL.o2?FL.o2[zoneOf(PL.pos.z)]:VIT.suit;
 const zLb=PL.inside&&FL.o2?('O2 · '+ZNAMES[zoneOf(PL.pos.z)]):'SUIT O2';
 $('vit').innerHTML=bar(VIT.hp,'HULL / VITALS')+bar(zO2,zLb)+bar(VIT.hun,'FOOD')+bar(VIT.thi,'WATER')+bar(POW.rea.water,'REACTOR H2O')+bar(POW.batt,'BATTERY');
 let f='';
 if(PL.seated&&MODE==='space'){
  f='SPD '+fmtK(SP.spd*8)+'/s · THR '+Math.round(SP.thr*100)+'% · GEAR '+(GEARST.d>.5?'DOWN':'UP');
  if(MARK)f+='\nTARGET '+MARK.name+' — '+fmtK(SP.pos.distanceTo(MARK.posU)*8);
  if(H.on)f+='\nHYPERSPEED ENGAGED — FOLD ACTIVE';
  else if(H.chg>0)f+='\nCHARGE '+Math.round(H.chg*100)+'%'+(COURSE&&(COURSE.kind==='sys'||(COURSE.ref&&COURSE.ref.sys!==FL.sys))?' → RELEASE = HYPER JUMP':'');
  else if(H.cd>0)f+='\nHYPERSPEED COOLDOWN';}
 else if(!PL.seated&&MODE==='space'&&SP.spd>2){f='SHIP UNDERWAY — '+fmtK(SP.spd*8)+'/s · THR '+Math.round(SP.thr*100)+'%'+(COURSE?'\nCOURSE '+COURSE.name:'');}
 else if(PL.seated&&MODE==='surface'){
  f='ALT '+Math.round(LAND?LAND.alt:0)+' m · VSPD '+(SURFV?SURFV.y.toFixed(0):0)+' m/s · THR '+Math.round(SP.thr*100)+'% · GEAR '+(GEARST.d>.5?'DOWN':'UP');}
 else if(PL.mode==='rover'){
  f='ROVER '+Math.abs(ROVER.spd*3.6).toFixed(0)+' km/h · BATT '+Math.round(ROVER.batt)+'%'+(ROVER.rea?' · REACTOR':'');}
 else if(!PL.inside&&MODE==='surface'){
  f='EVA · O2 '+Math.round(VIT.suit)+'% · '+LF.temp.toFixed(0)+'°C';}
 $('fly').textContent=f;
 const W=[];
 if(POW.rea.scram>0)W.push('REACTOR SCRAMMED');
 if(POW.rea.on&&POW.rea.water<20)W.push('REACTOR WATER LOW');
 if(!POW.rea.on&&POW.batt<25)W.push('BATTERY LOW');
 if(VIT.cab<30&&PL.inside)W.push('O2 LOW — '+ZNAMES[zoneOf(PL.pos.z)]);
 if(SRFX.airlock&&PL.inside)W.push('AIRLOCK OPEN — VENTING');
 if(SRFX.prox&&wireHas('prox','hud'))W.push('PILOT PROXIMITY');
 if(!PL.inside&&VIT.suit<25)W.push('SUIT O2 LOW');
 if(SYSD.hull<40)W.push('HULL DAMAGE');
 if(SRF.nebK>0)W.push('NEBULA — SENSORS DEGRADED');
 if(SRF.bhK>.15)W.push('GRAVITY WELL — TIME DILATED');
 $('warn').innerHTML=W.map(w=>'<div class="w'+(w.indexOf('SCRAM')>=0?'':' a')+'">'+w+'</div>').join('');
 $('stick').style.display=(PL.seated&&camMode==='fp')?'block':'none';
 if(PL.seated)$('stickp').style.transform='translate('+STK.x*22+'px,'+STK.y*22+'px)';
 $('xh').style.display=(camMode==='fp'&&!PL.seated&&PL.mode!=='rover')?'block':'none';
 $('lkh').style.display=(!PAUSED&&!DEAD&&!TERM&&document.pointerLockElement!==renderer.domElement)?'block':'none';
 const gh=$('gpshud'),na=$('navarr');
 if(COURSE&&MODE==='space'&&!TERM&&!PAUSED&&!DEAD){
  const cp=coursePos(TMP3);
  if(cp){const dKm=SP.pos.distanceTo(cp)*8;
   shipAxes();
   TMP.copy(cp).sub(SP.pos);
   const lz=TMP.dot(SP.fwd),lx=TMP.dot(SP.rt),ly=TMP.dot(SP.up);
   let al;
   if(lz<=.02)al='TARGET BEHIND — TURN AROUND';
   else{const ay=Math.atan2(lx,lz)*57.3,ap=Math.atan2(ly,lz)*57.3;
    al=(Math.abs(ay)<3&&Math.abs(ap)<3)?'ALIGNED — HOLD COURSE ▸':'TURN '+
     (Math.abs(ay)>3?((ay>0?'PORT ':'STARBOARD ')+Math.abs(ay).toFixed(0)+'° '):'')+
     (Math.abs(ap)>3?((ap>0?'UP ':'DOWN ')+Math.abs(ap).toFixed(0)+'°'):'');}
   gh.innerHTML='<b>◈ '+COURSE.name+'</b> · '+fmtK(dKm)+' · '+al+(SRF.align?' · AUTO-ALIGN ON':'');
   gh.style.display='block';
   const m2=Math.hypot(lx,ly);
   if(lz>0&&m2>.07){na.style.display='block';
    na.style.left='calc(50% + '+(clamp(lx,-1,1)*180)+'px)';
    na.style.top='calc(50% - '+(clamp(ly,-1,1)*180)+'px)';
    na.style.transform='translate(-50%,-50%) rotate('+(-Math.atan2(ly,lx)*57.3)+'deg)';}
   else na.style.display='none';}
  else{gh.style.display='none';na.style.display='none';}}
 else{gh.style.display='none';na.style.display='none';}
 marks();}
function marks(){
 const hm=$('hmark');let txt=null,wp=null;
 if(MODE==='space'){
  if(MARK){wp=TMP.copy(MARK.posU).sub(SP.pos);txt=MARK.name+'\n'+fmtK(SP.pos.distanceTo(MARK.posU)*8);}
  else if(COURSE){const cp=coursePos(TMP);if(cp){wp=cp.sub(SP.pos);txt=COURSE.name+'\n'+fmtK(SP.pos.distanceTo(cp)*8);}}}
 else if(MODE==='surface'&&!PL.inside){const d=Math.hypot(PL.pos.x,PL.pos.z);
  if(d>60){wp=TMP.copy(SHIPG.position);txt='KESTREL\n'+d.toFixed(0)+' m';}}
 else if(CACHE&&MODE==='surface'){wp=TMP.copy(CACHE.pos);txt='SUPPLY';}
 if(!wp){hm.style.display='none';return;}
 TMP2.copy(wp).project(cam);
 if(TMP2.z<1&&Math.abs(TMP2.x)<1&&Math.abs(TMP2.y)<1){
  hm.style.display='block';
  hm.style.left=((TMP2.x*.5+.5)*innerWidth+8)+'px';
  hm.style.top=((-TMP2.y*.5+.5)*innerHeight-8)+'px';
  hm.textContent=txt;}
 else hm.style.display='none';}
function objectives(){
 let o;
 if(INTRO.on)o='<b>WATCH.</b>';
 else if(FLG.earthGone&&MODE==='space'&&SP.pos.distanceTo(DEB.posU)<1250)o='<b>GET CLEAR</b> of the debris field\n'+fmtK((1250-SP.pos.distanceTo(DEB.posU))*8)+' to safe range';
 else if(FLG.won)o='<b>A NEW HOME</b> — keep exploring, researcher.';
 else if(FL.sys==='Proxima'&&!FLG.won)o='<b>FINAL APPROACH</b> — land on Proxima b\nSurvey first (SCAN terminal)';
 else if(INV.water>15||INV.ice>4)o='<b>SET COURSE</b> — Proxima b, Proxima Centauri\nNAV [M] ▸ UNIVERSE shows everything · hold J = hyper jump · N = auto-align';
 else o='<b>SURVIVE</b> — water for the reactor\nLand on Luna or Mars, drill ice (tool 3),\nmelt it at the refinery, inject at the tank';
 $('obj').innerHTML=o.replace(/\n/g,'<br>');}
/*--------- MFDs ---------*/
function mfdTick(){
 const zone=TERM?'off':(PL.seated?'cp':(PL.inside?(PL.pos.z<-3.2?'cp':(PL.pos.z>4?'eng':'mid')):'off'));
 for(const m of MFDS){
  if(m.id==='eng'){if(zone!=='eng')continue;}
  else if(zone!=='cp')continue;
  const c=m.ctx,W=m.cv.width,Hh=m.cv.height;
  if(!pwr('nav')){c.fillStyle='#050806';c.fillRect(0,0,W,Hh);c.fillStyle='#233528';c.font='14px Consolas';c.textAlign='center';c.fillText('NO PWR',W/2,Hh/2);m.tex.needsUpdate=true;continue;}
  c.fillStyle='#04120b';c.fillRect(0,0,W,Hh);
  c.fillStyle='#2f6f4f';c.fillRect(0,0,W,16);
  c.fillStyle='#7dffa8';c.font='10px Consolas';c.textAlign='left';
  c.fillText(m.id.toUpperCase()+' — KL-9 KESTREL',6,12);
  c.font='11px Consolas';let y=34;
  const ln=s=>{c.fillText(s,8,y);y+=18;};
  if(m.id==='nav'){
   if(MARK){ln('TARGET  '+MARK.name);ln('DIST    '+fmtK((MODE==='surface'?MARK.posKm.distanceTo(LF.body.posKm):SP.pos.distanceTo(MARK.posU)*8)));
    ln('TYPE    '+(MARK.t==='star'?'STAR':MARK.t==='gas'?'GAS GIANT':'ROCK'));
    ln('ETA     '+(SP.spd>1?fmtT((MODE==='surface'?0:SP.pos.distanceTo(MARK.posU)/SP.spd)):'—'));}
   else if(COURSE){const cp=coursePos(TMP);if(cp){ln('COURSE  '+COURSE.name);ln('DIST    '+fmtK(SP.pos.distanceTo(cp)*8));ln('');ln('FOLLOW HUD ARROW');ln('N = AUTO-ALIGN');}}
   else{ln('NO TARGET');ln('');ln('OPEN FULL MAP [M]');ln('SELECT + TARGET');}
   ln('');ln('SYS     '+SYSTEMS[FL.sys].name);}
  else if(m.id==='scan'){
   const keys=Object.keys(FL.scan);
   if(SCANST)ln('SCANNING '+bodyName(SCANST.id)+'…');
   else if(keys.length){ln('SURVEYED:');for(let i=Math.max(0,keys.length-4);i<keys.length;i++)ln(' · '+bodyName(keys[i]));}
   else{ln('NO SURVEYS');ln('SCAN BEFORE');ln('LANDING');}}
  else if(m.id==='sys'){
   ln('HULL '+Math.round(SYSD.hull)+'%  ENG '+Math.round(SYSD.eng)+'%');
   ln('RCTR '+Math.round(SYSD.rea)+'%  LIFE '+Math.round(SYSD.lif)+'%');
   ln('AVIO '+Math.round(SYSD.avo)+'%');
   ln('');ln('REACTOR '+(POW.rea.on?'ONLINE':'OFFLINE'));
   ln('H2O '+Math.round(POW.rea.water)+'%  BATT '+Math.round(POW.batt)+'%');}
  else if(m.id==='com'){
   const n=FL.log.length;
   if(n){for(let i=Math.max(0,n-3);i<n;i++)ln('· '+FL.log[i].m.slice(0,26));}
   else{ln('CHANNELS QUIET');ln('BEACON READY');}}
  else if(m.id==='eng'){
   ln('REACTOR '+(POW.rea.on?'ONLINE':'OFFLINE')+(POW.rea.scram>0?' SCRAM':''));
   ln('WATER '+Math.round(POW.rea.water)+'%');
   ln('BATTERY '+Math.round(POW.batt)+'%');
   ln('COOLANT '+(INV.water>=10?'OK':'LOW — MELT ICE'));}
  m.tex.needsUpdate=true;}}
/*--------- intro ---------*/
function startIntro(){
 const L=['MISSION CLOCK +00:00 — KL-9 "KESTREL" · HIGH EARTH ORBIT',
  'The deep-core extraction breach was never supposed to reach the mantle.',
  'Evacuation order came eleven minutes ago. Half the world never heard it.',
  'You are the last light humanity has left.',
  '…seismic reads critical. She is going to go.'];
 $('intr').innerHTML=L.map(s=>'<div class="ln">'+s+'</div>').join('');
 $('intr').style.display='block';$('iskip').style.display='block';
 INTRO={on:true,t:0,boom:false,done:false,dir:INTRO.dir,dist:INTRO.dist};
 setLoop('pad',.13);}
$('iskip').onclick=()=>{if(!INTRO.on)return;
 if(!INTRO.boom)INTRO.t=26.9;else INTRO.t=33.9;};
function introUpdate(dt){
 INTRO.t+=dt;
 const lines=$('intr').children;
 const at=[1.5,6.5,11.5,16.5,21.5];
 for(let i=0;i<lines.length;i++)if(INTRO.t>at[i])lines[i].style.opacity=1;
 if(!INTRO.boom&&INTRO.t>26.5){
  INTRO.boom=true;applyEarthGone(false);
  const d=document.createElement('div');d.className='ln';d.style.opacity=1;d.textContent='EARTH IS GONE.';$('intr').appendChild(d);}
 if(INTRO.t>34)endIntro();}
function endIntro(){
 INTRO.on=false;INTRO.done=true;
 $('intr').style.display='none';$('iskip').style.display='none';
 setLoop('pad',0);
 toast('CLICK THE VIEW TO TAKE CONTROLS — W/S THROTTLE · MOUSE STICK · J HYPERSPEED · E STAND',1);
 toast('OBJECTIVE: GET CLEAR OF THE DEBRIS FIELD');}
/*--------- fresh / resume ---------*/
function freshGame(){
 FL=freshFL();INV=FL.inv;VIT=FL.vit;POW=FL.pow;SYSD=FL.sysd;FLG=FL.flg;
 T.t=0;MODE='space';LAND=null;MARK=null;
 updateBodies();
 const e=bodyById('earth');
 const dir=V3(.42,.1,.9).normalize();
 SP.pos.copy(e.posU).addScaledVector(dir,e.r*US*3.2);
 TMM.lookAt(SP.pos,e.posU,V3(0,1,0));SP.q.setFromRotationMatrix(TMM);
 SP.spd=0;SP.thr=0;
 INTRO.dir=dir;INTRO.dist=e.r*US*3.2;
 PL.seated=true;PL.seatX=-.85;PL.inside=true;PL.pos.set(0,0,-6);PL.yaw=0;
 SHIPG.position.set(0,0,0);SHIPG.quaternion.copy(SP.q);
 VM.set(0);startIntro();}
function resumeState(){
 syncLevers();VM.set(FL.hot||0);
 if(FLG.earthGone)applyEarthGone(true);
 if(MODE==='surface'&&LAND){const bd=bodyById(LAND.b);
  if(bd){enterSurface(bd,q0pfToV3(LAND.q0),LAND.yaw,true);PL.seated=false;}}
 else{MODE='space';scene.remove(SURFG);scene.fog=null;TER=null;LF.body=null;
  SHIPG.position.set(0,0,0);SHIPG.quaternion.copy(SP.q);
  PL.seated=false;PL.inside=true;PL.pos.set(0,0,6);PL.yaw=Math.PI;}
 ROVER.rea=!!FL.roverPwr;
 if(document.pointerLockElement)document.exitPointerLock();}
function winCheck(){
 if(!FLG.won&&MODE==='surface'&&LF.body&&LF.body.id==='pb'){
  FLG.won=true;$('winov').style.display='flex';sfx('pickup');saveGame(true);}}
/*--------- title attract mode ---------*/
const ATTR={a:.9};
let MENUFX=null;
function buildMenuFX(er){
 if(MENUFX||!er)return;
 MENUFX=new THREE.Group();
 const SH=[];
 for(const s of[[1.045,.16,0xff3810],[1.028,.3,0xff7020],[1.014,.5,0xffc070]]){
  const hm=new THREE.Mesh(new THREE.SphereGeometry(er*s[0],40,20,0,Math.PI),
   new THREE.MeshBasicMaterial({color:s[2],transparent:true,opacity:s[1],blending:THREE.AdditiveBlending,depthWrite:false}));
  MENUFX.add(hm);SH.push(hm);}
 const EMB=[];
 for(let i=0;i<16;i++){
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:[0xffa050,0xff6020,0xffe0b0][i%3],transparent:true,opacity:.85,blending:THREE.AdditiveBlending,depthWrite:false}));
  const th=rnd(0,6.28),ph=Math.acos(rnd(-.25,1));
  sp.position.set(Math.sin(ph)*Math.cos(th),Math.cos(ph),Math.sin(ph)*Math.sin(th)).multiplyScalar(er*1.06);
  sp.scale.setScalar(er*rnd(.14,.3));
  sp.userData.base=rnd(.6,.95);
  MENUFX.add(sp);EMB.push(sp);}
 MENUFX.userData.shells=SH;MENUFX.userData.embers=EMB;
 MENUFX.position.copy(bodyById('earth').posU).sub(SP.pos);
 scene.add(MENUFX);}
function menuPark(){
 MODE='space';LAND=null;
 updateBodies();
 const e=bodyById('earth');
 const dir=V3(.42,.1,.9).normalize();
 SP.pos.copy(e.posU).addScaledVector(dir,e.r*US*3.2);
 TMM.lookAt(SP.pos,e.posU,V3(0,1,0));SP.q.setFromRotationMatrix(TMM);
 SP.spd=0;SP.thr=0;
 SHIPG.position.set(0,0,0);SHIPG.quaternion.copy(SP.q);
 placeBodies();
 buildMenuFX(e.r*US);}
function attractTick(){
 const dt=Math.min(.05,clockR.getDelta());
 ATTR.a+=dt*.05;
 const e=bodyById('earth');
 const ec=V3().copy(e.posU).sub(SP.pos);
 const az=Math.sin(ATTR.a*.7)*.34, el=.22+Math.sin(ATTR.a*.43)*.09, R=2150;
 cam.position.copy(ec).add(V3(Math.cos(el)*Math.cos(az),Math.sin(el),Math.cos(el)*Math.sin(az)).multiplyScalar(R));
 if(cam.up)cam.up.set(0,1,0);
 cam.lookAt(ec);
 const fwd=V3().copy(ec).sub(cam.position).normalize();
 const rgt=V3().crossVectors(fwd,V3(0,1,0)).normalize();
 cam.lookAt(V3().copy(ec).addScaledVector(rgt,-e.r*US*1.35));
 if(MENUFX&&MENUFX.parent){
  MENUFX.position.copy(ec);
  MENUFX.quaternion.setFromRotationMatrix(TMM.makeBasis(V3().crossVectors(V3(0,1,0),rgt).normalize(),V3(0,1,0),rgt));
  const tt=performance.now()*.001,EM=MENUFX.userData.embers||[];
  for(let i=0;i<EM.length;i++)EM[i].material.opacity=(EM[i].userData.base||.8)*(.72+.28*Math.sin(tt*2.6+i*1.7));}
 renderer.render(scene,cam);}
/*--------- settings panels ---------*/
function settingsHTML(){const q=SET.q|0;
 const qb=(v,l)=>'<span class="qbtn'+(q===v?' on':'')+'" data-q="'+v+'">'+l+'</span>';
 return '<div class="qh">VIDEO — ADVANCED GRAPHICS</div>'
 +'<div class="row" style="margin:2px 0">QUALITY '+qb(0,'POTATO')+qb(1,'LOW')+qb(2,'HIGH')+qb(3,'ULTRA')+'</div>'
 +'RENDER SCALE <input type="range" class="sld" data-k="rs" min="60" max="130" value="'+Math.round((SET.rs||1)*100)+'"> <span class="rsv">'+Math.round((SET.rs||1)*100)+'%</span><br>'
 +'STAR DENSITY <input type="range" class="sld" data-k="sd" min="30" max="200" value="'+Math.round((SET.sd||1)*100)+'"><br>'
 +'FIELD OF VIEW <input type="range" class="sld" data-k="fov" min="60" max="95" value="'+(SET.fov||72)+'"><br>'
 +'UNIVERSE SEED <input type="number" class="sld" data-k="useed" min="1" max="999999" value="'+(SET.useed||777)+'" style="width:92px"> <span class="btn seedgo">RESEED UNIVERSE</span><br>'
 +'<div class="dim">QUALITY SETS PIXEL RATIO, EXPOSURE &amp; SKY LAYERS · DENSITY REBUILDS THE STARS · RESEED GROWS NEW CONTINENTS AND CONSTELLATIONS</div>'
 +'<div class="qh">AUDIO / CONTROL</div>'
 +'VOLUME <input type="range" class="sld" data-k="v" min="0" max="100" value="'+Math.round(SET.v*100)+'"><br>'
 +'MOUSE SENSITIVITY <input type="range" class="sld" data-k="sens" min="20" max="200" value="'+Math.round((SET.sens||1)*100)+'"><br>'
 +'<div class="dim">FIRMWARE 14.0 · 4 GALAXIES · '+Object.keys(SYSTEMS).length+' SYSTEMS · GLOBAL BAND · BUILDING · WARP · LIFE SUPPORT · FIRST RUN NEEDS INTERNET (three.js CDN)</div>';}
function fillSettings(){try{
 $('sset').innerHTML=settingsHTML()+'<button class="mbtn" id="sback" style="width:180px;margin-top:10px">BACK</button>';
 $('sback').onclick=()=>{$('sset').style.display='none';};
 $('pset').innerHTML=settingsHTML();}catch(e){}}
function wireSettings(){
 document.addEventListener('click',e=>{const t=e.target;
  if(t&&t.classList&&t.classList.contains('qbtn')&&t.dataset&&t.dataset.q!==undefined){SET.q=+t.dataset.q;applyQuality();saveSet();fillSettings();sfx('click');}
  if(t&&t.classList&&t.classList.contains('seedgo')){applyUniverseSeed();fillSettings();}});
 document.addEventListener('input',e=>{const t=e.target;if(!t||!t.dataset||!t.dataset.k)return;
  const v=+t.value,k=t.dataset.k;
  if(k==='rs'){SET.rs=v/100;applyQuality();if(document.querySelectorAll)document.querySelectorAll('.rsv').forEach(s2=>s2.textContent=v+'%');}
  else if(k==='sd'){SET.sd=v/100;clearTimeout(SDT);SDT=setTimeout(()=>buildStarfield(),180);}
  else if(k==='fov'){SET.fov=v;if(cam.updateProjectionMatrix){cam.fov=v;cam.updateProjectionMatrix();}}
  else if(k==='useed'){SET.useed=Math.max(1,Math.floor(v||777));}
  else if(k==='v'){SET.v=v/100;AU.setV(SET.v);}
  else if(k==='sens'){SET.sens=v/100;}
  saveSet();});
 document.addEventListener('mouseover',e=>{const t=e.target;
  if(t&&t.classList&&(t.classList.contains('btn')||t.classList.contains('mbtn')||t.classList.contains('qbtn')))sfx('hov');});}
function applyUniverseSeed(){for(const b of BODY){
  if(b.mat.uniforms&&b.mat.uniforms.uSeed)b.mat.uniforms.uSeed.value.copy(seedVec(b.id));
  if(b.clouds&&b.clouds.material.uniforms)b.clouds.material.uniforms.uSeed.value.copy(seedVec(b.id+'c'));}
 buildStarfield();saveSet();sfx('tele');
 toast('UNIVERSE RESEEDED — '+SET.useed+' · NEW CONTINENTS · NEW CONSTELLATIONS · RELOAD TO REGROW SYSTEM LAYOUT',1);}
function applyQuality(){const q=SET.q|0;
 try{renderer.setPixelRatio(clamp(SET.rs||1,.5,1.4)*GOV.k*[.66,.8,1,Math.min(globalThis.devicePixelRatio||1,1.25)][q]);}catch(e){}
 if(renderer.toneMappingExposure!==undefined)renderer.toneMappingExposure=[1.02,1.1,1.16,1.26][q];
 if(UNI.userData.sf||UNI.userData.sf2)buildStarfield();}
function fpsGov(dt){if(MENU||!BOOTED)return;GOV.acc+=dt;GOV.n++;
 if(GOV.acc<1.5)return;
 const fps=GOV.n/GOV.acc;GOV.acc=0;GOV.n=0;
 if(fps<42&&GOV.k>.55){GOV.low++;GOV.high=0;
  if(GOV.low>=2){GOV.k=Math.max(.55,GOV.k-.12);GOV.low=0;applyQuality();toast('AUTO-PERFORMANCE — RENDER SCALE '+Math.round(GOV.k*100)+'%',1);}}
 else if(fps>57&&GOV.k<1){GOV.high++;GOV.low=0;
  if(GOV.high>=4){GOV.k=Math.min(1,GOV.k+.12);GOV.high=0;applyQuality();}}
 else{GOV.low=0;GOV.high=0;}}
/*--------- boot ---------*/
async function boot(){
 $('stip').textContent='shipyard…';
 buildShip();makeDoors();buildRover();buildVM();drawHotbar();
 freezeStatic(SHIPG);
 $('sbar').style.width='12%';
 $('stip').textContent='charting '+BDEF.length+' worlds across '+Object.keys(SYSTEMS).length+' systems…';
 buildBodies();
 applyShaders();
 $('sbar').style.width='84%';
 buildStarfield();
 buildAnomalies();
 buildStations();
 buildWarpFX();
 $('stip').textContent='flight systems…';
 initInput();
 fillSettings();wireSettings();applyQuality();
 dashSync();
 const hasSave=loadGame();
 $('sbar').style.width='100%';
 $('stip').textContent=hasSave?'PRIOR FLIGHT DATA FOUND':'NO PRIOR FLIGHT DATA';
 updateBodies();menuPark();
 if(!hasSave)$('scont').classList.add('dis');
 $('sload').style.display='none';
 $('smenu').style.display='flex';
 $('slag').style.display='block';$('sstory').style.display='block';
 $('fade').style.opacity=0;
 renderer.setAnimationLoop(attractTick);
 const startGame=fresh=>{
  AU.init();AU.setV(SET.v);
  MENU=false;
  if(MENUFX&&MENUFX.parent)scene.remove(MENUFX);
  $('splash').style.display='none';
  $('hud').style.display='block';
  BOOTED=true;
  renderer.setAnimationLoop(tick);
  if(fresh)freshGame();
  else{resumeState();toast('SAVE LOADED — SYSTEMS RESTORED');}
  if(FL.netName&&!NET.on)netConnect(FL.netName);
  if(NET.on)FL.netName=NET.id;};
 $('sgo').onclick=()=>{if(hasSave&&!confirm('ABANDON THE CURRENT SAVE AND START A NEW EXPEDITION?'))return;
  if(hasSave)localStorage.removeItem(SAVEKEY);
  startGame(true);};
 $('scont').onclick=()=>{if(hasSave)startGame(false);};
 $('sman').onclick=()=>{$('sset').style.display='none';const l=$('slist');l.style.display=l.style.display==='block'?'none':'block';};
 $('snetb').onclick=()=>{fillNetPanel();$('netp').style.display='flex';};
 $('ssetb').onclick=()=>{$('slist').style.display='none';fillSettings();$('sset').style.display='block';};
 $('sexb').onclick=()=>{
  if(AU.on)AU.setV(0);
  setLoop('pad',0);setLoop('rea',0);setLoop('eng',0);
  renderer.setAnimationLoop(()=>{});
  $('splash').style.display='none';
  $('sexit').style.display='flex';};
 $('sreboot').onclick=()=>location.reload();}
/*--------- main loop ---------*/
function tick(){
 const dt=Math.min(.05,clockR.getDelta());
 if(PAUSED||DEAD){renderer.render(scene,cam);return;}
 FRAMEID++;
 T.dt=dt;
 if(MODE!=='space')T.rate=60;
 const gdt=dt*T.rate;T.t+=gdt;
 if(INTRO.on)introUpdate(dt);
 updateBodies();
 if(WRP.on){warpUpdate(dt);placeBodies();netVisualTick();}
 else if(MODE==='space'){
  placeBodies();
  if(!DOCKED){flightUpdate(dt);hyperUpdate(dt);}
  anomUpdate(dt);
  eventTick(dt);
  stationTick(dt);
  spaceBuildTick();
  netVisualTick();}
 else{
  SRF.nebK=0;SRF.nebName='';SRF.bhK=0;
  setLoop('neb',0);setLoop('rumble',0);
  AMB.color.lerp(AMB0,Math.min(1,dt*2));
  surfaceFlight(dt);
  updateSurface();
  placeBodies();}
 playerUpdate(dt);
 roverUpdate(dt);
 doorAnim(dt);rampAnim(dt);gearAnim(dt);
 navBlink();
 setHover();
 vmUpdate(dt);
 toolUpdate(dt);
 scanTick(dt);fabTick(dt);comTick();
 netTick(dt);
 radioTick(dt);
 bldTick(dt);
 powerSim(dt,gdt);
 survivalSim(dt,gdt);
 o2Sim(dt);
 alarmTick();
 updateCamera(dt);
 audioTick();
 hudAcc+=dt;
 if(hudAcc>.28){hudAcc=0;hudUpdate();mfdTick();objectives();dashSync();}
 winCheck();
 fpsGov(dt);
 renderer.render(scene,cam);}
boot();
}catch(err){const f=document.getElementById('fatal');if(f){f.style.display='flex';document.getElementById('fmsg').textContent=''+((err&&err.stack)||err);}}
})();
//===== END OF FILE — IF YOU CAN SEE THIS, YOUR COPY IS COMPLETE =====