/* ═══════════════════════════════════════════════════════════════
   LAST LIGHT — source part 8/10: p08-flight.js
   FLIGHT, SURFACE WORLD, CAMERA — physics, terrain, landing
   NOTE: all parts share one closure; tools/build.js concatenates
   p01..p10 in order into client/js/game.js (byte-identical).
   ═══════════════════════════════════════════════════════════════ */
/*==================== PART 7 — FLIGHT, SURFACE WORLD, CAMERA ====================*/
const SURFG=new THREE.Group();
let LBK=0,SURFV=V3(0,0,0);
const SKY_FS='uniform vec3 uTop,uHor,uSun,uSunC;varying vec3 vP;void main(){vec3 d=normalize(vP);float h=clamp(d.y,0.,1.);vec3 col=mix(uHor,uTop,pow(h,.6));float s=max(dot(d,normalize(uSun)),0.);col+=uSunC*(pow(s,900.)*3.+pow(s,10.)*.22);gl_FragColor=vec4(col,1.);}';
const SKY_VS='varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
function buildTerrain(bd){
 while(SURFG.children.length)SURFG.remove(SURFG.children[0]);
 const P=PAL[bd.pal],n=mkn3(hashId(bd.id)+11),amp=P.amp||14;
 const raw=(x,z)=>(fbm3(n,x*.007,3.7,z*.007,5)-.5)*2*amp+Math.pow(Math.max(0,fbm3(n,x*.0035+40,9.1,z*.0035,4)-.55)*2,1.7)*amp*2.2;
 const h0=raw(0,0);
 const hf=(x,z)=>{const d=Math.hypot(x,z);let f=clamp(1-d/30,0,1);f=f*f*(3-2*f);return lerp(raw(x,z),h0,f);};
 TER={h:hf,h0,amp,wl:P.sea?(h0-amp*.55):null};
 const seg=110,sz=1600;
 const geo=new THREE.PlaneGeometry(sz,sz,seg,seg);geo.rotateX(-Math.PI/2);
 const pa=geo.attributes.position;
 for(let i=0;i<pa.count;i++){pa.setY(i,hf(pa.getX(i),pa.getZ(i)));}
 geo.computeVertexNormals();
 const cols=new Float32Array(pa.count*3);
 const c0=hxc(P.tg[0]),c1=hxc(P.tg[1]),c2=hxc(P.tg[2]),c3=hxc(P.tg[3]);
 const na=geo.attributes.normal;
 let mn=1e9,mx=-1e9;for(let i=0;i<pa.count;i++){const y=pa.getY(i);if(y<mn)mn=y;if(y>mx)mx=y;}
 for(let i=0;i<pa.count;i++){const y=pa.getY(i),t=clamp((y-mn)/((mx-mn)||1),0,1);
  let r,g,b;
  if(t<.33){const k=t/.33;r=lerp(c0[0],c1[0],k);g=lerp(c0[1],c1[1],k);b=lerp(c0[2],c1[2],k);}
  else if(t<.66){const k=(t-.33)/.33;r=lerp(c1[0],c2[0],k);g=lerp(c1[1],c2[1],k);b=lerp(c1[2],c2[2],k);}
  else{const k=(t-.66)/.34;r=lerp(c2[0],c3[0],k);g=lerp(c2[1],c3[1],k);b=lerp(c2[2],c3[2],k);}
  const ny=na.getY(i),sh=clamp(.55+ny*.5,0,1.05);
  cols[i*3]=r*sh;cols[i*3+1]=g*sh;cols[i*3+2]=b*sh;}
 geo.setAttribute('color',new THREE.BufferAttribute(cols,3));
 const ter=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({vertexColors:true}));
 SURFG.add(ter);
 if(TER.wl!==null){const wm=new THREE.Mesh(new THREE.PlaneGeometry(sz,sz),new THREE.MeshLambertMaterial({color:new THREE.Color(P.sea),transparent:true,opacity:.82}));
  wm.rotation.x=-Math.PI/2;wm.position.y=TER.wl;SURFG.add(wm);}
 const rocks=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0),new THREE.MeshLambertMaterial({color:new THREE.Color(P.tg[1])}),90);
 const M4=new THREE.Matrix4(),Q=new THREE.Quaternion(),S=V3(1,1,1),PP=V3(0,0,0);
 for(let i=0;i<90;i++){const a=rnd(0,6.3),d=rnd(30,720);PP.set(Math.cos(a)*d,0,Math.sin(a)*d);PP.y=hf(PP.x,PP.z);
  Q.setFromEuler(new THREE.Euler(rnd(0,6.3),rnd(0,6.3),rnd(0,6.3)));
  const s=rnd(.4,2.6);S.set(s,s*rnd(.5,1),s);M4.compose(PP,Q,S);rocks.setMatrixAt(i,M4);}
 SURFG.add(rocks);
 const sky=new THREE.Mesh(new THREE.SphereGeometry(139000,32,20),new THREE.ShaderMaterial({vertexShader:SKY_VS,fragmentShader:SKY_FS,side:THREE.BackSide,depthWrite:false,
  uniforms:{uTop:{value:new THREE.Color(.05,.08,.16)},uHor:{value:new THREE.Color(.1,.12,.18)},uSun:{value:V3(0,1,0)},uSunC:{value:new THREE.Color(1,.95,.85)}}}));
 sky.renderOrder=-5;sky.frustumCulled=false;SURFG.add(sky);TER.sky=sky;
 const N=2600,pos=new Float32Array(N*3);
 for(let i=0;i<N;i++){const th=rnd(0,6.3),ph=Math.acos(rnd(-1,1));
  pos[i*3]=Math.sin(ph)*Math.cos(th)*128000;pos[i*3+1]=Math.cos(ph)*128000;pos[i*3+2]=Math.sin(ph)*Math.sin(th)*128000;}
 const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.BufferAttribute(pos,3));
 const stars=new THREE.Points(sg,new THREE.PointsMaterial({size:1.6,sizeAttenuation:false,color:0xdfe8ff,transparent:true,opacity:1,depthWrite:false}));
 stars.renderOrder=-4;stars.frustumCulled=false;SURFG.add(stars);TER.stars=stars;
 TER.sun=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:0xffffff,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
 TER.sun.scale.setScalar(11000);TER.sun.renderOrder=-3;SURFG.add(TER.sun);
 TER.sun2=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:0xffe8c0,transparent:true,opacity:.4,blending:THREE.AdditiveBlending,depthWrite:false}));
 TER.sun2.scale.setScalar(42000);TER.sun2.renderOrder=-3;SURFG.add(TER.sun2);
 scene.add(SURFG);
 scene.fog=new THREE.FogExp2(0x8899aa,P.fog||.0009);}
function enterSurface(bd,q0pf,yaw,restore){
 MODE='surface';FL.sys=bd.sys;LF.body=bd;
 LAND={b:bd.id,q0:q0pf.toArray(),yaw:yaw||0,alt:0,roverP:null,roverOut:false};
 if(CACHE&&CACHE.hb){const i=HITS.indexOf(CACHE.hb);if(i>=0)HITS.splice(i,1);CACHE=null;}
 buildTerrain(bd);
 spawnSurfBuilds();
 BLDG.on=false;$('bld').style.display='none';if(BLDG.ghost){scene.remove(BLDG.ghost);BLDG.ghost=null;}
 SHIPG.position.set(0,TER.h0+GEAR,0);SHIPG.rotation.set(0,yaw||0,0);
 SURFV.set(0,0,0);H.on=false;H.chg=0;LBK=0;SP.thr=0;
 if(restore)LANDfromSave();
 if(!restore){PL.seated=true;PL.inside=true;}
 else{PL.inside=true;syncLevers();}
 camMode='fp';
 if(!restore){toast('TOUCHDOWN — '+bd.name.toUpperCase()+(GEARST.tgt<1?' · GEAR UP! PRESS G':'')+' · E TO STAND · RAMP IN GARAGE',1);sfx('thud');saveGame(true);}
 updateSurface();}
function LANDfromSave(){const l=FL.land;if(!l)return false;
 if(l.roverP){ROVER.wpos.set(l.roverP[0],0,l.roverP[1]);ROVER.head=l.roverP[2]||0;undockRover();ROVER.g.position.copy(ROVER.wpos);ROVER.g.position.y=TER.h(ROVER.wpos.x,ROVER.wpos.z);}
 else dockRover();
 ROVER.rea=FL.roverPwr||false;
 PL.pos.set(0,0,6);PL.yaw=Math.PI;PL.vel.set(0,0,0);return true;}
function exitSurface(){
 const bd=LF.body;if(!bd)return;
 const th=2*Math.PI*T.t/((bd.rot||24)*3600);
 const qw=TMP.copy(q0pfToV3(LAND.q0));qw.applyAxisAngle(V3(0,1,0),th);LF.qw=qw.clone();
 const altM=SHIPG.position.y-TER.h0-GEAR;
 const east=LF.east,up=qw,zn=LF.zn;
 TMQ.setFromRotationMatrix(TMM.makeBasis(east,up,zn));
 SP.q.copy(TMQ).multiply(SHIPG.quaternion);
 const vW=TMP2.set(SURFV.x*east.x+SURFV.y*up.x+SURFV.z*zn.x,SURFV.x*east.y+SURFV.y*up.y+SURFV.z*zn.y,SURFV.x*east.z+SURFV.y*up.z+SURFV.z*zn.z);
 const spdM=vW.length();
 SP.pos.copy(bd.posU).add(TMP3.copy(qw).multiplyScalar(bd.r*US+altM/8000));
 SP.spd=spdM/8000;SP.fwd.set(0,0,-1).applyQuaternion(SP.q);
 const l2=shipToLocal(ROVER.g.position,TMP3);
 if(!ROVER.out||l2.z<14)dockRover();
 clearSurfBuilds();BLDG.on=false;$('bld').style.display='none';if(BLDG.ghost){scene.remove(BLDG.ghost);BLDG.ghost=null;}
 scene.remove(SURFG);scene.fog=null;TER=null;LF.body=null;LAND=null;MODE='space';
 LBK=12;PL.inside=true;PL.pos.set(0,0,6);
 HEMI.intensity=0;AMB.intensity=.55;
 toast('ORBIT — '+bd.name.toUpperCase());sfx('whoosh');}
function q0pfToV3(a){return V3(a[0],a[1],a[2]);}
function updateSurface(){
 const bd=LF.body;if(!bd||!TER)return;
 const th=2*Math.PI*T.t/((bd.rot||24)*3600);
 const qw=TMP.copy(q0pfToV3(LAND.q0)).applyAxisAngle(V3(0,1,0),th);
 LF.qw?LF.qw.copy(qw):LF.qw=qw.clone();
 LF.up.copy(qw);
 LF.east.set(LF.up.z,0,-LF.up.x).normalize();
 if(!isFinite(LF.east.x)||LF.east.length()<.01)LF.east.set(1,0,0);
 LF.zn.crossVectors(LF.east,LF.up).normalize();
 const ns=nearestStar(bd.posU);
 const sunW=TMP2.copy(ns.b.posU).sub(bd.posU).normalize();
 const sx=sunW.dot(LF.east),syp=sunW.dot(LF.up),sz=sunW.dot(LF.zn);
 LF.sun.set(sx,syp,sz);
 LF.sinE=syp;
 LF.lst=(Math.atan2(sx,sz)/(Math.PI*2)*24+12+24)%24;
 LF.dayF=clamp((syp+.06)*3.5,0,1);
 const P=PAL[bd.pal];
 LF.temp=(bd.tk-273)+(syp>0?syp*P.sw:-P.dr*clamp(-syp*2,0,1));
 const cStar=new THREE.Color(SYSTEMS[ns.b.sys].c);
 const dayTop=new THREE.Color(P.skyD[0]*.55+.02,P.skyD[1]*.55+.03,P.skyD[2]*.55+.05);
 const dayHor=new THREE.Color(P.skyD[0]*.9+.02,P.skyD[1]*.9+.04,P.skyD[2]*.9+.06);
 const nightTop=new THREE.Color(.012,.018,.045),nightHor=new THREE.Color(.03,.04,.08);
 const top=nightTop.clone().lerp(dayTop,LF.dayF),hor=nightHor.clone().lerp(dayHor,LF.dayF);
 const sunEl=clamp(syp*4,0,1);
 if(Math.abs(syp)<.22){const sunset=new THREE.Color(.85,.38,.16).multiplyScalar(clamp(1-Math.abs(syp)*4.5,0,1)*.55);hor.lerp(sunset,.6);}
 TER.sky.material.uniforms.uTop.value.copy(top);
 TER.sky.material.uniforms.uHor.value.copy(hor);
 TER.sky.material.uniforms.uSun.value.copy(LF.sun);
 TER.sky.material.uniforms.uSunC.value.copy(cStar);
 TER.sky.position.copy(cam.position);
 TER.sun.position.copy(LF.sun).multiplyScalar(120000);
 TER.sun2.position.copy(TER.sun.position);
 TER.sun.material.color.copy(cStar).lerp(new THREE.Color(1,1,1),.5);
 TER.stars.material.opacity=clamp(1-LF.dayF*1.5,0,1);
 TER.stars.rotation.y=-th;
 SUNL.position.copy(LF.sun).multiplyScalar(1e4);
 SUNL.intensity=clamp(2.2*Math.pow(1.9e7/Math.max(1e4,ns.d),2),.05,2.4)*(.25+.75*sunEl);
 SUNL.color.copy(cStar).lerp(new THREE.Color(1,1,1),.4);
 HEMI.intensity=.08+LF.dayF*.6;
 AMB.intensity=.1+LF.dayF*.22;
 if(scene.fog)scene.fog.color.copy(hor);
 SRF.wind=P.wind;
 if(LAND)LAND.alt=SHIPG.position.y-TER.h0-GEAR;}
/*--------- space flight ---------*/
function shipAxes(){SP.fwd.set(0,0,-1).applyQuaternion(SP.q);SP.up.set(0,1,0).applyQuaternion(SP.q);SP.rt.set(1,0,0).applyQuaternion(SP.q);}
function flightUpdate(dt){
 if(DOCKED){setLoop('eng',0);return;}
 LBK=Math.max(0,LBK-dt);
 if(INTRO.on&&INTRO.dir){const c=FLG.earthGone?FL.earthPosKm:bodyById('earth').posKm;
  SP.pos.copy(c).multiplyScalar(US).addScaledVector(INTRO.dir,INTRO.dist);}
 SHIPG.position.set(0,0,0);SHIPG.quaternion.copy(SP.q);
 shipAxes();
 if(PL.seated&&!INTRO.on){
  const dth=((KEYS.KeyW?1:0)-(KEYS.KeyS?1:0))*.45*dt;
  SP.thr=clamp(SP.thr+dth,0,1);
  TMQ.setFromEuler(new THREE.Euler(-STK.y*.85*dt,-STK.x*.65*dt,((KEYS.KeyA?1:0)-(KEYS.KeyD?1:0))*1.3*dt,'XYZ'));
  SP.q.multiply(TMQ).normalize();
  STK.x*=Math.exp(-dt*.7);STK.y*=Math.exp(-dt*.7);
 }
 if(SP.thr>0&&pwr('eng')&&SYSD.eng>20)SP.spd+=SP.thr*420*dt*(FL.alloc?FL.alloc.eng:1);
 else if(SP.thr>0&&!pwr('eng')&&!PL.seated){toast('AUTOPILOT HOLD RELEASED — ENGINES OFFLINE');SP.thr=0;}
 if(PL.seated&&SRF.align&&COURSE&&!INTRO.on){
  const cp=coursePos(TMP3);
  if(cp){TMP.copy(cp).sub(SP.pos);
   if(TMP.length()>10){TMP.normalize();
    const dot=clamp(SP.fwd.dot(TMP),-1,1),ang=Math.acos(dot);
    if(ang>.015){TMP2.crossVectors(SP.fwd,TMP);
     if(TMP2.lengthSq()>1e-9){TMP2.normalize();
      QT2.setFromAxisAngle(TMP2,Math.min(ang,dt*1.15));
      SP.q.multiplyQuaternions(QT2,SP.q).normalize();shipAxes();}}}}}
 SP.spd*=Math.exp(-dt*.12);
 if(H.on)SP.spd=4000+H.t*60000;
 SP.pos.addScaledVector(SP.fwd,SP.spd*dt);
 const ns=nearestStar(SP.pos);if(ns.d<3e12)FL.sys=ns.b.sys;
 SUNL.position.copy(ns.b.posU).sub(SP.pos);
 SUNL.target.position.set(0,0,0);
 SUNL.intensity=clamp(2.2*Math.pow(1.9e7/Math.max(1e4,ns.d),2),.12,2.4);
 SUNL.color.copy(new THREE.Color(SYSTEMS[ns.b.sys].c)).lerp(new THREE.Color(1,1,1),.45);
 for(const b of BODY){
  const d=SP.pos.distanceTo(b.posU),dr=d-b.r*US;
  if(b.t==='star'){
   if(dr<b.r*US*.8){die('FLEW INTO '+b.name.toUpperCase()+' — STELLAR CORONA');return;}
   if(dr<b.r*US*2.2&&T.t-(SRF.warnT||0)>6){SRF.warnT=T.t;toast('WARNING — '+b.name.toUpperCase()+' CORONA PROXIMITY',1);}}
  else if(b.t==='gas'){
   if(dr<60){die('CRUSHED IN THE CLOUDS OF '+b.name.toUpperCase());return;}}
  else{
   if(dr<.4&&LBK<=0&&!(b.id==='earth'&&FLG.earthGone)){
    if(SP.spd<60){
     if(b.res||b.id==='luna'||b.t==='rock'){
      const th=2*Math.PI*T.t/((b.rot||24)*3600);
      const q0=TMP.copy(SP.pos).sub(b.posU).normalize().applyAxisAngle(V3(0,1,0),-th);
      const fwdW=TMP2.copy(SP.fwd);
      const fE=fwdW.dot(LFe(b,q0).east),fU=fwdW.dot(LFe(b,q0).up),fZ=fwdW.dot(LFe(b,q0).zn);
      const yaw=Math.atan2(-fE,-fZ);
      enterSurface(b,q0.clone(),yaw,false);return;}}
    else if(dr<.15){
     if(SP.spd<600){hurt(SP.spd/14,'SURFACE IMPACT — FLY GENTLER');SP.spd*=-.25;SHK.t=1;SHK.amp=.8;sfx('thud');}
     else{die('SURFACE IMPACT AT '+fmtK(SP.spd*8)+'/s — FLY GENTLER NEXT TIME');return;}}}
   else if(dr<3&&dr>.4&&SP.spd>60&&T.t-(SRF.apT||0)>5){SRF.apT=T.t;toast('TOO FAST FOR LANDING — CUT THROTTLE (X) BELOW 480 km/s',1);}}}
 if(FLG.earthGone&&T.t-FLG.goneT>12000){
  const dd=SP.pos.distanceTo(DEB.posU);
  if(dd<1250){hurt(dt*2.5,'HULL BREACH — DEBRIS FIELD');if(T.t-(SRF.debT||0)>4){SRF.debT=T.t;toast('DEBRIS FIELD — GET CLEAR',1);}}}
 for(const g of ENGGLOW)g.material.opacity=SP.thr*.9;
 for(const cc of ENGCONE){cc.material.opacity=SP.thr*.7*(.8+Math.random()*.4);cc.scale.y=lerp(.25,1.9,SP.thr);}
 setLoop('eng',PL.seated?SP.thr*.4:Math.min(.25,SP.spd/4000),60+SP.thr*140);}
function LFe(b,q0){
 const th=2*Math.PI*T.t/((b.rot||24)*3600);
 const up=q0.clone().applyAxisAngle(V3(0,1,0),th);
 const east=V3(up.z,0,-up.x).normalize();
 const zn=V3().crossVectors(east,up).normalize();
 return{east,up,zn};}
function hyperRelease(){
 if(!JDOWN&&H.chg>0&&!H.on&&H.cd<=0&&!WRP.on){
  if(H.chg<.8){H.chg=0;sfx('deny');toast('MISFIRE — HOLD J LONGER TO CHARGE');H.cd=3;return;}
  let sysTgt=null;
  if(COURSE&&COURSE.kind==='sys')sysTgt=COURSE.ref;
  else if(COURSE&&COURSE.kind==='body'&&COURSE.ref&&COURSE.ref.sys!==FL.sys)sysTgt=COURSE.ref.sys;
  if(sysTgt&&sysTgt!==FL.sys){const st=warpTargetStar(sysTgt);
   if(st&&SP.pos.distanceTo(st.posU)*8>1e12){if(warpStart(sysTgt))H.chg=0;else H.chg=0;return;}}
  if(!POW.amp){H.chg=0;sfx('deny');toast('HYPERSPEED AMP OFFLINE — OVERHEAD GUARDED SWITCH');return;}
  if(POW.rea.water<20){H.chg=0;sfx('deny');POW.rea.on=false;POW.rea.scram=20*86400;
   toast('REACTOR SCRAM — STABILITY TOO LOW. 20 GAME DAYS OR 1 EXOTIC MATTER.',1);sfx('boom');return;}
  H.on=true;H.t=0;H.chg=0;sfx('whoosh');toast('HYPERSPEED ENGAGED',1);}
 H.chg=0;}
function hyperUpdate(dt){
 if(H.cd>0)H.cd-=dt;
 if(JDOWN&&!H.on&&H.cd<=0&&PL.seated&&!INTRO.on){
  H.chg=clamp(H.chg+dt/2.2,0,1);
  setLoop('hyp',H.chg*.3,170+H.chg*300);}
 else if(!H.on)setLoop('hyp',0);
 if(H.on){
  H.t+=dt;setLoop('hyp',.35);
  let minD=1e18,minB=null;
  for(const b of BODY){const d=SP.pos.distanceTo(b.posU);if(d<minD){minD=d;minB=b;}}
  if(minD>5e7){SP.pos.addScaledVector(SP.fwd,minD*.15*dt);}
  if(!FLG.voySeen&&!FLG.voyGot&&ANOM.voy&&SP.pos.distanceTo(ANOM.voy.posU)<1.2e11){FLG.voySeen=true;sfx('ping');toast('RARE CONTACT — PASSING VOYAGER 1. THE GOLDEN RECORD GLEAMS OFF THE BOW.',1);FL.log.push({t:T.t,m:'FLYBY: VOYAGER 1 DURING FOLD'});}
  if(minB&&(minD<minB.r*US*6+2e4||H.t>25)){dropHyper();}}}
function dropHyper(){if(!H.on)return;H.on=false;H.cd=8;H.heat=0;SP.spd=600;sfx('whoosh');toast('HYPERSPEED DISENGAGED');}
function surfaceFlight(dt){
 if(!PL.seated||INTRO.on)return;
 const g=(LF.body.g||9.8);
 TMQ.setFromEuler(new THREE.Euler(-STK.y*.85*dt,-STK.x*.65*dt,((KEYS.KeyA?1:0)-(KEYS.KeyD?1:0))*1.3*dt,'XYZ'));
 SHIPG.quaternion.multiply(TMQ).normalize();
 STK.x*=Math.exp(-dt*.7);STK.y*=Math.exp(-dt*.7);
 const fwd=TMP.set(0,0,-1).applyQuaternion(SHIPG.quaternion);
 if(pwr('eng')&&SYSD.eng>20){
  SURFV.addScaledVector(fwd,SP.thr*40*dt);
  const dth=((KEYS.KeyW?1:0)-(KEYS.KeyS?1:0))*.45*dt;SP.thr=clamp(SP.thr+dth,0,1);}
 SURFV.y-=g*dt;
 SHIPG.position.addScaledVector(SURFV,dt);
 const gy=TER.h0+GEAR;
 if(SHIPG.position.y<=gy){
  const imp=-SURFV.y;
  SHIPG.position.y=gy;
  if(imp>3&&GEARST.d<.7){hurt(imp*1.5,'GEAR-UP LANDING — BELLY IMPACT');SYSD.hull=clamp(SYSD.hull-imp*.6,0,100);toast('GEAR-UP LANDING — BELLY SCRAPE (G = GEAR)',1);}
  if(imp>12){hurt(imp*1.2,'HARD LANDING — STRUCTURAL STRESS');SYSD.hull=clamp(SYSD.hull-imp*.8,0,100);sfx('thud');SHK.t=1;SHK.amp=.7;SURFV.set(0,0,0);}
  else{if(SURFV.y<0)SURFV.y=0;SURFV.x*=Math.exp(-dt*4);SURFV.z*=Math.exp(-dt*4);}}
 if(SHIPG.position.y-TER.h0-GEAR>1500){exitSurface();return;}
 for(const g2 of ENGGLOW)g2.material.opacity=SP.thr*.9;
 for(const cc of ENGCONE){cc.material.opacity=SP.thr*.7*(.8+Math.random()*.4);cc.scale.y=lerp(.25,1.9,SP.thr);}
 setLoop('eng',SP.thr*.4,60+SP.thr*140);}
/*--------- supply cache ---------*/
function spawnCache(){
 const a=rnd(0,6.3),d=rnd(140,240);
 const x=Math.cos(a)*d,z=Math.sin(a)*d,y=TER.h(x,z);
 const g=new THREE.Group();g.position.set(x,y+.4,z);
 const c=new THREE.Mesh(new THREE.BoxGeometry(.9,.7,.9),MT.crate);g.add(c);
 const bcn=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:0xffb347,transparent:true,blending:THREE.AdditiveBlending}));
 bcn.scale.setScalar(2.4);bcn.position.y=1.2;g.add(bcn);
 SURFG.add(g);
 const hb=hit(c,'SUPPLY CRATE','OPEN',()=>{INV.parts+=2;INV.food+=3;INV.water+=6;if(Math.random()<.5)INV.exo+=1;
  sfx('pickup');toast('SUPPLY CRATE — PARTS +2 · RATIONS +3 · WATER +6 L');
  SURFG.remove(g);const i=HITS.indexOf(hb);if(i>=0)HITS.splice(i,1);CACHE=null;});
 CACHE={g:g,pos:g.position,hb:hb};}
/*--------- camera ---------*/
function updateCamera(dt){
 if(SHK.t>0){SHK.t-=dt;}
 const sh=SHK.t>0?SHK.amp*SHK.t*.06:0;
 if(camMode==='ext'){
  const tgt=MODE==='surface'?TMP.copy(SHIPG.position):TMP.set(0,0,0);
  cam.position.set(tgt.x+EXT.dist*Math.cos(EXT.ph)*Math.sin(EXT.th),tgt.y+EXT.dist*Math.sin(EXT.ph),tgt.z+EXT.dist*Math.cos(EXT.ph)*Math.cos(EXT.th));
  cam.position.x+=rnd(-sh,sh);cam.position.y+=rnd(-sh,sh);
  cam.lookAt(tgt);return;}
 if(PL.mode==='rover'){
  const r=ROVER.g.position;
  cam.position.set(r.x,r.y+2.1,r.z);
  cam.position.x+=rnd(-sh,sh);
  cam.quaternion.setFromEuler(new THREE.Euler(0,ROVER.head,0));return;}
 if(PL.seated){
  TMP.set(PL.seatX,1.47,-6.15);
  cam.position.copy(localToShip(TMP,TMP2));
  cam.position.x+=rnd(-sh,sh);cam.position.y+=rnd(-sh,sh);
  EUL.set(-STK.y*.07,-STK.x*.07,0,'YXZ');
  cam.quaternion.copy(SHIPG.quaternion).multiply(TMQ.setFromEuler(EUL));return;}
 if(PL.inside||MODE==='space'){
  TMP.set(PL.pos.x,PL.pos.y+1.62,PL.pos.z);
  cam.position.copy(localToShip(TMP,TMP2));
  cam.position.x+=rnd(-sh,sh);cam.position.y+=rnd(-sh,sh);
  EUL.set(PL.pitch,PL.yaw,0,'YXZ');
  cam.quaternion.copy(SHIPG.quaternion).multiply(TMQ.setFromEuler(EUL));return;}
 cam.position.set(PL.pos.x,PL.pos.y+1.62,PL.pos.z);
 cam.position.x+=rnd(-sh,sh);cam.position.y+=rnd(-sh,sh);
 EUL.set(PL.pitch,PL.yaw,0,'YXZ');
 cam.quaternion.setFromEuler(EUL);}
