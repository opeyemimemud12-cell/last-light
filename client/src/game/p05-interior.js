/* ═══════════════════════════════════════════════════════════════
   LAST LIGHT — source part 5/10: p05-interior.js
   SHIP INTERIOR + INTERACTION — KL-9 hull, rooms, doors, hit system
   NOTE: all parts share one closure; tools/build.js concatenates
   p01..p10 in order into client/js/game.js (byte-identical).
   ═══════════════════════════════════════════════════════════════ */
/*==================== PART 4 — SHIP INTERIOR + INTERACTION ====================*/
const SHIPG=new THREE.Group();scene.add(SHIPG);
const GEAR=1.35;
const MT={
 hull:new THREE.MeshLambertMaterial({color:0x9aa6ad}),
 hullD:new THREE.MeshLambertMaterial({color:0x6a747c}),
 hullDD:new THREE.MeshLambertMaterial({color:0x49525a}),
 accent:new THREE.MeshLambertMaterial({color:0x8a6a30}),
 wall:new THREE.MeshLambertMaterial({color:0x4a545e}),
 floor:new THREE.MeshLambertMaterial({color:0x3a4149}),
 ceil:new THREE.MeshLambertMaterial({color:0x404852}),
 dark:new THREE.MeshLambertMaterial({color:0x262d34}),
 furn:new THREE.MeshLambertMaterial({color:0x5a6570}),
 furn2:new THREE.MeshLambertMaterial({color:0x43505c}),
 amber:new THREE.MeshLambertMaterial({color:0x8a6a30}),
 amberB:new THREE.MeshLambertMaterial({color:0xb8862e}),
 glass:new THREE.MeshLambertMaterial({color:0x9cc8e8,transparent:true,opacity:.15}),
 mattress:new THREE.MeshLambertMaterial({color:0x46525e}),
 blanket:new THREE.MeshLambertMaterial({color:0x7a4a30}),
 crate:new THREE.MeshLambertMaterial({color:0x5a5245}),
 screenD:new THREE.MeshLambertMaterial({color:0x0a0f0c}),
 water:new THREE.MeshLambertMaterial({color:0x3a6a8a})
};
function bx(w,h,d,mt,x,y,z,rx,ry,rz){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mt);m.position.set(x,y,z);if(rx)m.rotation.x=rx;if(ry)m.rotation.y=ry;if(rz)m.rotation.z=rz;SHIPG.add(m);return m;}
function bxp(parent,w,h,d,mt,x,y,z,rx,ry,rz){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mt);m.position.set(x,y,z);if(rx)m.rotation.x=rx;if(ry)m.rotation.y=ry;if(rz)m.rotation.z=rz;parent.add(m);return m;}
const COLL=[];const LEVERS=[];
function syncLevers(){for(const L of LEVERS){if(L.t==='b')syncSwitch(L.lev,POW.brk[L.k]);else if(L.t==='o')syncSwitch(L.lev,POW[L.k]);else syncSwitch(L.lev,POW.rea.on);}}
const LIGHTS=[];let REACORE=null,ENGGLOW=[],RAMPLAMP=null,ENSTRIP=null;
function buildShip(){
 bx(4.6,3.3,23.4,MT.hull,0,1.45,3);
 const chin=new THREE.Mesh(new THREE.CylinderGeometry(.45,1.85,3.2,10),MT.hullD);
 chin.rotation.x=-Math.PI/2;chin.scale.set(1,1,.22);chin.position.set(0,-.6,-10.3);SHIPG.add(chin);
 bx(3.6,2.4,1.6,MT.hullD,0,1.45,15.1);
 for(const sx of[-1,1]){const nac=new THREE.Mesh(new THREE.CylinderGeometry(.5,.62,4.6,10),MT.hullD);nac.rotation.x=Math.PI/2;nac.position.set(sx*2.85,1.0,12.6);SHIPG.add(nac);
  const gl=new THREE.Mesh(new THREE.CircleGeometry(.42,12),new THREE.MeshBasicMaterial({color:0xffa050,transparent:true,opacity:0}));gl.position.set(sx*2.85,1.0,14.92);gl.rotation.y=Math.PI;SHIPG.add(gl);ENGGLOW.push(gl);} makeGearLeg(-1.7,-5.5,-1);makeGearLeg(1.7,-5.5,-1);makeGearLeg(-1.7,12.6,1);makeGearLeg(1.7,12.6,1);
 const gl2=new THREE.Mesh(new THREE.CircleGeometry(1.1,16),new THREE.MeshBasicMaterial({color:0xffb060,transparent:true,opacity:0}));gl2.position.set(0,1.45,15.92);gl2.rotation.y=Math.PI;SHIPG.add(gl2);ENGGLOW.push(gl2);
 bx(4.2,.12,22,MT.floor,0,-.06,3);bx(4.2,.12,22,MT.ceil,0,2.96,3);
 bx(.12,2.9,22,MT.wall,-2.16,1.45,3);bx(.12,2.9,22,MT.wall,2.16,1.45,3);
 ENSTRIP=new THREE.MeshLambertMaterial({color:0x223038,emissive:0xbfd8e8,emissiveIntensity:1.3});
 for(const sx of[-1,0,1]){const st=new THREE.Mesh(new THREE.BoxGeometry(.14,.04,21),ENSTRIP);st.position.set(sx*1.24,2.89,3);SHIPG.add(st);}
 bx(4.2,.85,.15,MT.wall,0,.425,-8);bx(4.2,.4,.15,MT.wall,0,2.7,-8);
 bx(.15,1.7,.15,MT.wall,-2.03,1.65,-8);bx(.15,1.7,.15,MT.wall,2.03,1.65,-8);
 const wnd=new THREE.Mesh(new THREE.BoxGeometry(3.9,1.7,.05),MT.glass);wnd.position.set(0,1.65,-8);SHIPG.add(wnd);
 for(const zz of[-3.5,4.5,10.5]){bx(1.4,2.9,.12,MT.wall,-1.4,1.45,zz);bx(1.4,2.9,.12,MT.wall,1.4,1.45,zz);bx(1.4,.7,.12,MT.wall,0,2.55,zz);}
 bx(.6,2.9,.12,MT.wall,-1.8,1.45,14);bx(.6,2.9,.12,MT.wall,1.8,1.45,14);bx(3.0,.3,.12,MT.wall,0,2.75,14);
 for(const p of[[0,2.58,-1.2],[0,2.58,8.6]]){const L=new THREE.PointLight(0xe8f2fa,0,15,1.2);L.position.set(p[0],p[1],p[2]);SHIPG.add(L);LIGHTS.push(L);}
 const EL1=new THREE.PointLight(0xff3020,0,11,1.6);EL1.position.set(0,2.6,-4.5);SHIPG.add(EL1);LIGHTS.push(EL1);EL1.userData.emerg=true;EL1.visible=false;
 const EL2=new THREE.PointLight(0xff3020,0,11,1.6);EL2.position.set(0,2.6,7.5);SHIPG.add(EL2);LIGHTS.push(EL2);EL2.userData.emerg=true;EL2.visible=false;
 buildCockpit();buildLiving();buildEng();buildGarage();populateColl();
 buildExterior();
}
function makeGearLeg(x,z,s){
 const piv=new THREE.Group();piv.position.set(x,0,z);piv.userData.s=s;SHIPG.add(piv);KEEP.add(piv);GEARLEGS.push(piv);
 bxp(piv,.15,1.32,.15,MT.hullD,0,-.66,0);
 bxp(piv,.5,.1,.5,MT.hullD,0,-1.32,.06);
 bxp(piv,.06,.5,.06,MT.furn2,.11,-.4,.04);
 return piv;}
function buildExterior(){
 const WIN=new THREE.MeshLambertMaterial({color:0x1c2830,emissive:0xffd9a0,emissiveIntensity:1.1});
 SHIPG.userData.winMats=[WIN];
 /* cockpit canopy — clean glass, frame OUTSIDE the sightline.
    The glass band is a single-sided plane facing FORWARD: visible from space,
    culled from inside so the crew sees straight through to the stars. */
 const winp=new THREE.Mesh(new THREE.PlaneGeometry(3.94,1.76),WIN);
 winp.position.set(0,1.65,-8.76);winp.rotation.y=Math.PI;SHIPG.add(winp);
 bx(3.98,.14,.12,MT.hullD,0,2.56,-8.71);bx(3.98,.14,.12,MT.hullD,0,.74,-8.71);
 bx(3.4,.42,.08,MT.dark,0,.5,-8.66);
 bx(4.3,.16,.55,MT.hullD,0,3.03,-8.42);
 for(const sx of[-1,1])bx(1.5,.1,2.3,MT.hullD,sx*1.95,1.62,-9.55,0,-sx*.28);
 bx(.9,.35,.5,MT.hullD,0,.25,-9.8);
 /* portholes — 3 per side, lit with the cabin breakers */
 const mkPort=(sx,z)=>{const rim=new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,.26,14),MT.hullD);rim.rotation.z=Math.PI/2;rim.position.set(sx*2.26,1.75,z);SHIPG.add(rim);
  const gl=new THREE.Mesh(new THREE.CircleGeometry(.23,14),WIN);gl.position.set(sx*2.41,1.75,z);gl.rotation.y=sx>0?Math.PI/2:-Math.PI/2;SHIPG.add(gl);};
 for(const sx of[-1,1])for(const zz of[-1.2,1.8,3.2])mkPort(sx,zz);
 bx(.12,.6,1.3,MT.hullD,2.15,1.5,12.2);bx(.08,.46,1.16,WIN,2.19,1.5,12.2);
 /* hull dressing — belly, spine, seams, accent stripes */
 bx(4.72,.14,22.8,MT.hullDD,0,-.24,3);
 bx(1.5,.28,11.4,MT.hullD,0,3.2,.8);
 bx(1.4,.24,4.2,MT.hullD,0,3.18,12.5);
 for(const zz of[-6,-2,2,6,10,13.4]){bx(.05,2.9,.5,MT.hullDD,2.32,1.45,zz);bx(.05,2.9,.5,MT.hullDD,-2.32,1.45,zz);}
 bx(.07,.2,19.5,MT.accent,2.33,2.35,2.5);bx(.07,.2,19.5,MT.accent,-2.33,2.35,2.5);
 /* engineering radiator fins */
 for(const sx of[-1,1])for(const zz of[5.6,8.2])bx(.07,1.9,2.4,MT.hullDD,sx*2.42,1.5,zz);
 /* landing gear fairings */
 for(const gx of[-1.85,1.85]){bx(.6,.75,2.1,MT.hullD,gx,-.42,-5.5);bx(.6,.75,2.1,MT.hullD,gx,-.42,12.6);}
 /* RCS quads */
 const mkRCS=(x,y,z)=>{bx(.3,.3,.3,MT.dark,x,y,z);
  for(const s of[[-.16,0,0,1],[.16,0,0,1],[0,.16,0,0],[0,-.16,0,0]]){const n=new THREE.Mesh(new THREE.CylinderGeometry(.035,.055,.14,6),MT.dark);
   n.rotation.z=s[3]?Math.PI/2:0;if(!s[3])n.rotation.x=Math.PI/2;n.position.set(x+s[0],y+s[1],z);SHIPG.add(n);}};
 mkRCS(2.12,2.72,-8.2);mkRCS(-2.12,2.72,-8.2);mkRCS(2.12,.35,14.3);mkRCS(-2.12,.35,14.3);
 /* engine housing + skirt */
 bx(4.0,2.7,1.3,MT.hullD,0,1.45,15.0);
 bx(3.3,2.1,.7,MT.hullDD,0,1.45,15.75);
 /* comms fit */
 const mast=new THREE.Mesh(new THREE.CylinderGeometry(.03,.05,1.2,6),MT.dark);mast.position.set(.9,3.5,1);SHIPG.add(mast);
 const whip=new THREE.Mesh(new THREE.CylinderGeometry(.02,.03,.9,6),MT.dark);whip.position.set(-1.1,3.35,0);SHIPG.add(whip);
 const dish=new THREE.Mesh(new THREE.SphereGeometry(.42,20,12,0,Math.PI*2,0,1.25),new THREE.MeshLambertMaterial({color:0xcfd8dd,side:THREE.DoubleSide}));dish.position.set(-.9,3.42,3);dish.rotation.x=-.9;SHIPG.add(dish);
 const dk=new THREE.Mesh(new THREE.TorusGeometry(.55,.07,10,28),MT.hullD);dk.position.set(0,3.38,6);dk.rotation.x=Math.PI/2;SHIPG.add(dk);
 STROBE=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:0xffffff,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));STROBE.position.set(.9,4.15,1);STROBE.scale.setScalar(.9);SHIPG.add(STROBE);
 const mkNav=(x,z,c)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(.09,.09,.09),new THREE.MeshLambertMaterial({color:0x111111,emissive:c,emissiveIntensity:1.4}));m.position.set(x,1.95,z);SHIPG.add(m);NAVL.push(m);
  const s2=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:c,transparent:true,opacity:.6,blending:THREE.AdditiveBlending,depthWrite:false}));s2.position.set(x,1.95,z);s2.scale.setScalar(.7);SHIPG.add(s2);NAVS.push(s2);};
 mkNav(-2.36,9,0xff3020);mkNav(2.36,9,0x30ff60);
 const noz=new THREE.MeshLambertMaterial({color:0x2a2f34});
 const mkEx=(x,y,r0,r1,len,clen,cc)=>{const n=new THREE.Mesh(new THREE.CylinderGeometry(r0,r1,len,14),noz);n.rotation.x=Math.PI/2;n.position.set(x,y,15.55);SHIPG.add(n);
  const ex=new THREE.Mesh(new THREE.ConeGeometry(r0*.72,clen,12,1,true),new THREE.MeshBasicMaterial({color:cc,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));
  ex.rotation.x=Math.PI/2;ex.position.set(x,y,15.55+len/2+clen/2);SHIPG.add(ex);ENGCONE.push(ex);KEEP.add(ex);};
 mkEx(-2.85,1.0,.44,.26,.8,3.4,0xffa050);
 mkEx(2.85,1.0,.44,.26,.8,3.4,0xffa050);
 mkEx(0,1.45,.9,.5,1.0,5.2,0xffb060);
 for(const sx of[-.7,.7])bx(.08,1.5,2.6,MT.dark,sx,1.35,11.4);
 for(const g of[[2.21,.7,-3],[-2.21,.7,-3],[2.21,2.4,9],[-2.21,2.4,9],[2.21,.6,6],[-2.21,.6,6]])bx(.1,.4,.7,MT.hullD,g[0],g[1],g[2]);
 for(const rr of[[2.3,1.9,-6.8],[-2.3,1.9,-6.8],[2.3,1.9,4.2],[-2.3,1.9,4.2]])bx(.08,.05,2.4,MT.hullD,rr[0],rr[1],rr[2]);
 const d1=makeLabel('KL-9 "KESTREL"',3.6,.5,'#e8dcc0');d1.position.set(2.23,2.35,5.5);d1.rotation.y=Math.PI/2;SHIPG.add(d1);
 const d2=makeLabel('KL-9 "KESTREL"',3.6,.5,'#e8dcc0');d2.position.set(-2.23,2.35,5.5);d2.rotation.y=-Math.PI/2;SHIPG.add(d2);
 const d3=makeLabel('N-X 0009 · LAST LIGHT',2.2,.3,'#9ab0c0');d3.position.set(2.23,1.92,5.5);d3.rotation.y=Math.PI/2;SHIPG.add(d3);
 const d4=makeLabel('N-X 0009 · LAST LIGHT',2.2,.3,'#9ab0c0');d4.position.set(-2.23,1.92,5.5);d4.rotation.y=-Math.PI/2;SHIPG.add(d4);
 const EL=new THREE.SpotLight(0xfff2d0,0,70,.75,.5,1.2);EL.position.set(0,-.1,10);const et=new THREE.Object3D();et.position.set(0,-5,20);SHIPG.add(et);EL.target=et;SHIPG.add(EL);EL.visible=false;SHIPG.userData.extL=EL;
}
/*--------- cockpit ---------*/
const MFDS=[];
function buildCockpit(){
 bx(3.8,.4,.12,MT.dark,0,.85,-7.7);
 bx(3.8,.1,.8,MT.dark,0,1.0,-7.5,-.5);
 const names=['NAV','SCAN','SYS','COM'];
 for(let i=0;i<4;i++){const x=-1.47+i*.98;
  const fr=bxp(SHIPG,.78,.5,.05,MT.furn2,x,1.06,-7.36,-.55);
  const cv=document.createElement('canvas');cv.width=256;cv.height=160;const ctx=cv.getContext('2d');
  const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;
  const pl=new THREE.Mesh(new THREE.PlaneGeometry(.68,.42),new THREE.MeshBasicMaterial({map:tex}));
  pl.position.set(0,0,.032);fr.add(pl);
  MFDS.push({id:['nav','scan','sys','com'][i],cv,ctx,tex,fr});
  hit(fr,'MFD — '+names[i],'OPEN '+names[i]+' TERMINAL',()=>openTerm(['nav','scan','sys','com'][i]),1.04);}
 const swp=bx(3.76,.08,.62,MT.furn2,0,.72,-7.6,-.24);
 const DB=[['GEAR','G'],['FLOODS',''],['NAV LTS',''],['CABIN LT',''],['MUTE',''],['SCAN',''],['DOORS',''],['RAMP',''],['CAM','C'],['ALIGN','N']];
 for(let i=0;i<DB.length;i++){const x=-1.62+i*.36;
  const bse=bxp(swp,.1,.15,.1,MT.dark,x,.11,.02);
  const led=bxp(bse,.07,.024,.07,new THREE.MeshLambertMaterial({color:0x111111,emissive:0x30ff60,emissiveIntensity:.06}),0,.087,0);
  hit(bse,DB[i][0],'OPERATE'+(DB[i][1]?' · [='+DB[i][1]+']':''),(()=>{const j=i;return()=>dashBtn(j);})(),1.5);
  const lb=makeLabel(DB[i][0],.27,.07,'#9fc0d8');lb.position.set(x,.05,.21);lb.rotation.set(-Math.PI/2,0,Math.PI);swp.add(lb);
  DBTN.push({def:DB[i],led});}
 const tq=bx(.5,.16,.38,MT.furn,1.02,.86,-7.14);
 const tl=new THREE.Mesh(new THREE.BoxGeometry(.05,.3,.05),MT.amberB);tl.position.set(0,.16,-.08);tq.add(tl);
 const kn=new THREE.Mesh(new THREE.SphereGeometry(.05,8,8),MT.dark);kn.position.y=.17;tl.add(kn);
 hit(tq,'THROTTLE','CYCLE +25%',()=>{if(!PL.seated){toast('SIT AT THE PILOT SEAT FIRST');sfx('deny');return;}SP.thr=clamp(SP.thr+.25,0,1);sfx('sw');},1.6);
 makeSeat(-0.85);makeSeat(0.85);
 bxp(SHIPG,.1,.34,.1,MT.dark,-.45,1.02,-6.75);bxp(SHIPG,.1,.34,.1,MT.dark,.45,1.02,-6.75);
 for(const sx of[-1,1])bxp(SHIPG,.24,.1,3.9,MT.furn,sx*1.97,.92,-5.6);
 const brk=bx(.06,.92,1.16,MT.furn2,-2.06,1.5,-4.6);
 const bn=['MAIN','LIFE','ENG','NAV','LIT'],bk=['main','life','eng','nav','lit'];
 for(let i=0;i<5;i++){const z=-5.05+i*.24;
  const bse=bxp(SHIPG,.05,.26,.16,MT.dark,-2.04,1.52,z);
  const lev=bxp(bse,.05,.14,.05,MT.amberB,.04,.04,0);
  lev.userData.on=POW.brk[bk[i]];syncSwitch(lev,POW.brk[bk[i]]);LEVERS.push({lev,k:bk[i],t:'b'});
  hit(bse,'BREAKER — '+bn[i],(POW.brk[bk[i]]?'ON':'OFF'),(()=>{const k=bk[i];return()=>{POW.brk[k]=!POW.brk[k];syncSwitch(lev,POW.brk[k]);sfx('sw');if(TERM==='sys')renderTerm();};})(),1.5);
  const lb=makeLabel(bn[i],.13,.075,'#9fc0d8');lb.position.set(-1.97,1.3,z);lb.rotation.y=Math.PI/2;SHIPG.add(lb);}
 const pl=makeLabel('POWER BREAKERS',.72,.14,'#ffd9a0');pl.position.set(-2.0,2.02,-4.6);pl.rotation.y=Math.PI/2;SHIPG.add(pl);
 const ov=bx(1.6,.06,.6,MT.furn2,0,2.85,-5.5);
 const gn=[['HYPER AMP','amp'],['CABIN HEAT','heat'],['GRAV PLATE','grav']];
 for(let i=0;i<3;i++){const x=-.5+i*.5;
  const bse=bxp(SHIPG,.14,.1,.2,MT.dark,x,2.83,-5.5);
  const lev=bxp(bse,.04,.12,.04,MT.amberB,0,.07,0);
  syncSwitch(lev,POW[gn[i][1]]);LEVERS.push({lev,k:gn[i][1],t:'o'});
  hit(bse,gn[i][0],(POW[gn[i][1]]?'ON':'OFF'),(()=>{const k=gn[i][1];return()=>{POW[k]=!POW[k];syncSwitch(lev,POW[k]);sfx('sw');};})(),1.6);
  const lb=makeLabel(gn[i][0],.3,.08,'#c8b088');lb.position.set(x,2.7,-5.82);lb.rotation.x=-.5;SHIPG.add(lb);}
 const guard=new THREE.Mesh(new THREE.BoxGeometry(.16,.12,.22),new THREE.MeshLambertMaterial({color:0xffb347,transparent:true,opacity:.3}));
 guard.position.set(-.5,2.9,-5.5);SHIPG.add(guard);
}
function syncSwitch(lev,on){lev.rotation.x=on?-.6:.6;}
function makeSeat(x){
 const g=new THREE.Group();g.position.set(x,0,-6.15);SHIPG.add(g);
 bxp(g,.62,.14,.62,MT.furn,0,.5,0);
 bxp(g,.62,.86,.12,MT.furn,0,1.0,.3,-.12);
 bxp(g,.4,.2,.1,MT.mattress,0,1.5,.33,-.12);
 const ped=new THREE.Mesh(new THREE.CylinderGeometry(.07,.1,.5,8),MT.dark);ped.position.set(0,.25,0);g.add(ped);
 bxp(g,.5,.06,.4,MT.mattress,0,.58,0);
 hit(g.children[1],'PILOT SEAT','SIT / FLY',()=>{sitDown(x);},1.1);
}
/*--------- living bay ---------*/
function buildLiving(){
 const plat=bx(.95,.3,1.9,MT.furn,-1.55,.35,2.3);
 bx(.85,.12,1.75,MT.mattress,-1.55,.56,2.3);bx(.5,.1,.35,MT.furn2,-1.55,.63,1.65);bx(.87,.06,.9,MT.blanket,-1.55,.64,2.75);
 hit(plat,'BUNK','SLEEP · SAVE · REST',()=>openTerm('bunk'),1.06);
 const lb=makeLabel('CREW BUNK',.6,.12,'#ffd9a0');lb.position.set(-1.95,2.3,2.3);lb.rotation.y=Math.PI/2;SHIPG.add(lb);
 const lk=bx(.55,1.9,.6,MT.furn,-1.8,.95,.5);
 bxp(lk,.5,.02,.02,MT.dark,0,.3,.31);bxp(lk,.5,.02,.02,MT.dark,0,-.3,.31);
 hit(lk,'LOCKER','INVENTORY',()=>openTerm('inv'),1.04);
 const ped=bx(.5,.7,.5,MT.furn,-1.83,.35,-1.5);
 const basin=new THREE.Mesh(new THREE.CylinderGeometry(.22,.17,.3,12),MT.furn2);basin.position.set(-1.83,.85,-1.5);SHIPG.add(basin);
 const mir=bx(.02,.75,.5,new THREE.MeshBasicMaterial({color:0x9fb8cc}),-2.08,1.6,-1.5);
 hit(ped,'WASHSTAND','DRINK WATER',()=>{if(INV.water>=.5){INV.water-=.5;VIT.thi=clamp(VIT.thi+40,0,100);sfx('pickup');toast('DRANK 0.5 L WATER');}else{sfx('deny');toast('NO WATER — MELT ICE AT THE REFINERY');}},1.2);
 const fp=bx(.6,.8,.55,MT.furn,1.8,.4,-1.5);
 const hop=new THREE.Mesh(new THREE.CylinderGeometry(.16,.2,.2,10),MT.furn2);hop.position.set(1.8,.9,-1.5);SHIPG.add(hop);
 bxp(fp,.12,.12,.12,MT.dark,0,.55,.3);
 hit(fp,'FOOD PRINTER','PRINT RATIONS',()=>openTerm('food'),1.06);
 const lb2=makeLabel('FABRICATION',.7,.12,'#ffd9a0');lb2.position.set(1.95,2.3,.5);lb2.rotation.y=-Math.PI/2;SHIPG.add(lb2);
 const cr1=bx(.55,.5,.7,MT.crate,1.8,.25,.9);bx(.55,.45,.65,MT.crate,1.8,.72,.9);bx(.5,.4,.6,MT.furn2,1.8,1.14,.9);
 hit(cr1,'CARGO','INVENTORY',()=>openTerm('inv'),1.05);
 const rf=bx(.65,1.5,.75,MT.furn2,1.75,.75,2.5);
 const drum=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,.9,10),MT.amber);drum.position.set(1.75,1.95,2.5);SHIPG.add(drum);
 bxp(rf,.3,.2,.02,new THREE.MeshLambertMaterial({color:0x332211,emissive:0xff7030,emissiveIntensity:.8}),0,.3,.38);
 hit(rf,'REFINERY','SMELT · MELT · PARTS',()=>openTerm('fab'),1.06);
 for(const yy of[1.1,1.5]){bxp(SHIPG,.06,.3,.9,MT.dark,2.09,yy,-.1);}
}
/*--------- engineering ---------*/
function buildEng(){
 const ped=new THREE.Mesh(new THREE.CylinderGeometry(.7,.82,.25,14),MT.dark);ped.position.set(-1.7,.12,7.6);SHIPG.add(ped);
 const core=new THREE.Mesh(new THREE.CylinderGeometry(.55,.55,1.5,20),new THREE.MeshLambertMaterial({color:0x2a3238}));core.position.set(-1.7,1.05,7.6);SHIPG.add(core);
 REACORE=new THREE.Mesh(new THREE.TorusGeometry(.56,.05,8,24),new THREE.MeshLambertMaterial({color:0x113322,emissive:0x44ffbb,emissiveIntensity:1.4}));
 REACORE.rotation.x=Math.PI/2;REACORE.position.set(-1.7,1.05,7.6);SHIPG.add(REACORE);
 const cap=new THREE.Mesh(new THREE.CylinderGeometry(.6,.6,.1,20),MT.furn);cap.position.set(-1.7,1.85,7.6);SHIPG.add(cap);
 bxp(SHIPG,.12,1.1,.12,MT.furn2,-1.7,2.35,7.6);
 hit(core,'REACTOR CORE','STATUS + CONTROLS',()=>openTerm('sys'),1.08);
 for(let i=0;i<4;i++)bxp(SHIPG,.5,.04,.06,new THREE.MeshLambertMaterial({color:0x6a5a20,emissive:0xc8a030,emissiveIntensity:.4}),-1.7+(i%2?.3:-.3),.02,7.0+Math.floor(i/2)*1.2);
 const lb=makeLabel('REACTOR',.6,.13,'#ffd9a0');lb.position.set(-1.7,2.5,7.6);SHIPG.add(lb);
 const tank=new THREE.Mesh(new THREE.CylinderGeometry(.35,.35,1.2,14),MT.water);tank.position.set(-1.7,.6,9.1);SHIPG.add(tank);
 bxp(SHIPG,.3,.1,.3,MT.furn,-1.7,1.25,9.1);
 hit(tank,'WATER TANK','INJECT COOLANT (10 L)',()=>injectWater(),1.15);
 const lb3=makeLabel('H2O',.24,.12,'#9fd8ff');lb3.position.set(-1.3,.9,9.1);SHIPG.add(lb3);
 const rc=bx(.06,.85,1.05,MT.furn2,2.06,1.5,6);
 const rn=[['REACTOR','rea'],['SCRAM RST','scr'],['VENT','vent']];
 for(let i=0;i<3;i++){const z=5.75+i*.3;
  const bse=bxp(SHIPG,.05,.24,.14,MT.dark,2.04,1.52,z);
  const lev=bxp(bse,.05,.13,.05,MT.amberB,.05,.02,0);
  if(rn[i][1]==='rea')syncSwitch(lev,POW.rea.on);
  if(rn[i][1]==='rea')LEVERS.push({lev,k:'rea',t:'r'});
  hit(bse,rn[i][0],'OPERATE',(()=>{const k=rn[i][1];return()=>{if(k==='rea'){POW.rea.on=!POW.rea.on;syncSwitch(lev,POW.rea.on);sfx('sw');toast(POW.rea.on?'REACTOR ONLINE':'REACTOR SHUTDOWN');}
   else if(k==='scr'){scramReset();}
   else{if(POW.rea.on&&POW.rea.water>20){POW.rea.water-=10;sfx('hiss');toast('REACTOR VENTED — TEMP DOWN');}else{sfx('deny');toast('VENT UNAVAILABLE');}}
   if(TERM==='sys')renderTerm();};})(),1.5);
  const l=makeLabel(rn[i][0],.15,.07,'#9fc0d8');l.position.set(1.98,1.32,z);l.rotation.y=-Math.PI/2;SHIPG.add(l);}
 const lb2=makeLabel('REACTOR CONTROL',.8,.14,'#ffd9a0');lb2.position.set(2.0,2.0,6);lb2.rotation.y=-Math.PI/2;SHIPG.add(lb2);
 const desk=bx(.55,.75,1.5,MT.furn,1.82,.375,7.6);
 const scr=bx(1.15,.62,.07,MT.screenD,2.05,1.34,7.6,0,-Math.PI/2);
 const cv=document.createElement('canvas');cv.width=256;cv.height=100;const cx2=cv.getContext('2d');
 const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;MFDS.push({id:'eng',cv,ctx:cx2,tex});
 const pl2=new THREE.Mesh(new THREE.PlaneGeometry(1.05,.46),new THREE.MeshBasicMaterial({map:tex}));pl2.position.set(0,0,.045);scr.add(pl2);
 hit(scr,'ENGINEERING CONSOLE','SYSTEMS',()=>openTerm('sys'),1.05);
 const lbe=makeLabel('ENG CONSOLE',.7,.13,'#ffd9a0');lbe.position.set(1.98,1.98,7.6);lbe.rotation.y=-Math.PI/2;SHIPG.add(lbe);
 bx(.55,.5,.5,MT.crate,-1.85,.25,5.2);bx(.5,.45,.5,MT.crate,-1.85,.72,5.2);
}
function populateColl(){
 COLL.push(
  {x1:-1.9,x2:1.9,z1:-7.9,z2:-6.95},
  {x1:-1.25,x2:-.5,z1:-6.5,z2:-5.8},
  {x1:.5,x2:1.25,z1:-6.5,z2:-5.8},
  {x1:-2.1,x2:-1.05,z1:1.3,z2:3.3},
  {x1:-2.1,x2:-1.5,z1:.15,z2:.9},
  {x1:-2.1,x2:-1.55,z1:-1.85,z2:-1.15},
  {x1:1.45,x2:2.1,z1:-1.85,z2:-1.15},
  {x1:1.45,x2:2.1,z1:.55,z2:1.3},
  {x1:1.35,x2:2.1,z1:2.1,z2:2.95},
  {x1:-2.1,x2:-1.2,z1:7.15,z2:8.05},
  {x1:-2.1,x2:-1.25,z1:8.7,z2:9.5},
  {x1:1.45,x2:2.1,z1:6.8,z2:8.4},
  {x1:-1.9,x2:-1.5,z1:12.65,z2:13.15},
  {x1:-2.1,x2:-1.4,z1:10.9,z2:12.1},
  {x1:-2.1,x2:-1.5,z1:4.9,z2:5.6});
 for(const z of[-3.5,4.5,10.5]){COLL.push({x1:.7,x2:2.1,z1:z-.2,z2:z+.2});COLL.push({x1:-2.1,x2:-.7,z1:z-.2,z2:z+.2});}
 COLL.push({x1:1.5,x2:2.1,z1:13.9,z2:14.2});COLL.push({x1:-2.1,x2:-1.5,z1:13.9,z2:14.2});
}
/*--------- garage + ramp ---------*/
const DOORS=[];let RAMPST={d:0,r:0,tgt:0};
function buildGarage(){
 const bench=bx(.5,.9,1.9,MT.furn,-1.8,.45,11.5);
 bxp(bench,.4,.05,1.6,MT.dark,0,.5,.1);
 hit(bench,'WORK BENCH','FLAVOR',()=>{toast('TOOLS AND SPARE PARTS — USE THE TERMINALS');sfx('click');},1.03);
 const ped=bx(.35,.85,.35,MT.furn,-1.72,.42,12.9);
 bxp(ped,.3,.18,.3,MT.furn2,0,.5,0);
 const btn=bxp(ped,.14,.08,.14,new THREE.MeshLambertMaterial({color:0x881111,emissive:0xff2020,emissiveIntensity:.7}),0,.62,.1);
 RAMPLAMP=bxp(ped,.06,.06,.06,new THREE.MeshLambertMaterial({color:0x111,emissive:0x30ff60,emissiveIntensity:0}),-.12,.62,.1);
 hit(ped,'RAMP + AIRLOCK','DEPLOY / STOW',()=>toggleRamp(),1.25);
 const lb=makeLabel('RAMP',.3,.13,'#ffd9a0');lb.position.set(-1.72,1.05,12.9);SHIPG.add(lb);
 bxp(SHIPG,.08,.08,3.2,MT.dark,0,2.8,12.3);
}
function makeDoors(){
 for(const z of[-3.5,4.5,10.5]){
  const g=new THREE.Group();g.position.set(0,0,z);SHIPG.add(g);
  bxp(g,.12,2.4,.3,MT.dark,-.76,1.2,0);bxp(g,.12,2.4,.3,MT.dark,.76,1.2,0);bxp(g,1.64,.14,.3,MT.dark,0,2.32,0);
  const pl=bxp(g,.73,2.2,.09,MT.amber,-.37,1.1,0);
  const pr=bxp(g,.73,2.2,.09,MT.amber,.37,1.1,0);
  bxp(pl,.45,.55,.02,new THREE.MeshLambertMaterial({color:0x1a1408,emissive:0xffb347,emissiveIntensity:.25,transparent:true,opacity:.85}),0,.45,0);
  bxp(pr,.45,.55,.02,new THREE.MeshLambertMaterial({color:0x1a1408,emissive:0xffb347,emissiveIntensity:.25,transparent:true,opacity:.85}),0,.45,0);
  const D={g,z,open:0,tgt:0,pl,pr};
  DOORS.push(D);KEEP.add(g);
  hit(pl,'DOOR','OPEN / CLOSE',(()=>{const dd=D;return()=>toggleDoor(dd);})(),1.06);}
 const rd=bx(3.0,2.6,.1,MT.amber,0,1.3,14.08);
 const rw=bxp(rd,2.6,.7,.02,new THREE.MeshLambertMaterial({color:0x1a1408,emissive:0xffb347,emissiveIntensity:.25,transparent:true,opacity:.85}),0,.6,.06);
 RAMPST.door=rd;RAMPST.doorY0=1.3;KEEP.add(rd);
 const rampG=new THREE.Group();rampG.position.set(0,0,14.12);SHIPG.add(rampG);
 const rm=new THREE.Mesh(new THREE.BoxGeometry(3.2,.14,7.5),MT.hullD);rm.position.set(0,0,3.75);rampG.add(rm);
 for(let i=0;i<7;i++)bxp(rampG,3.2,.05,.06,MT.dark,0,.08,.6+i*1.1);
 RAMPST.rampG=rampG;RAMPST.rampMat=rm;KEEP.add(rampG);
}
function toggleDoor(D){
 if(!POW.brk.main||POW.batt<=0){toast('NO POWER — DOOR MOTOR DEAD');sfx('deny');return;}
 D.tgt=D.tgt>0?0:1;sfx('door');}
function doorAnim(dt){for(const D of DOORS){D.open+=(D.tgt-D.open)*Math.min(1,dt*3);
 const off=.37+D.open*.78;D.pl.position.x=-off;D.pr.position.x=off;}}
function toggleRamp(){
 if(MODE!=='surface'){toast('RAMP LOCKED — NOT LANDED');sfx('deny');return;}
 if(!POW.brk.main||POW.batt<=0){toast('NO POWER — RAMP MOTOR DEAD');sfx('deny');return;}
 RAMPST.tgt=RAMPST.tgt>0?0:1;sfx('ramp');}
function rampAnim(dt){
 const t=RAMPST.tgt;
 const dd=t>0?(t>RAMPST.d?1:-1):0;
 RAMPST.d=clamp(RAMPST.d+((t>0)?dt*.55:-dt*.55),0,1);
 const dr=clamp((RAMPST.d-.55)/.45,0,1);
 RAMPST.door.position.y=1.3+RAMPST.d*2.62;
 RAMPST.rampG.rotation.x=lerp(-1.66,.178,RAMPST.d);
 if(RAMPLAMP)RAMPLAMP.material.emissiveIntensity=t>0?1.2:0;
}
function rampOpen(){return RAMPST.d>.95;}
function doorOpenAt(z){const D=DOORS.find(d=>Math.abs(d.z-z)<.1);return D?D.open>.75:true;}
/*--------- rover ---------*/
const ROVER={g:new THREE.Group(),out:false,wpos:V3(0,0,0),head:Math.PI,spd:0,steer:0,batt:100,rea:false,lit:false,vy:0};
let ROVERWHEELS=[],ROVERLAMPS=[];
function buildRover(){
 const g=ROVER.g;
 bxp(g,1.45,.42,2.5,MT.furn,0,.72,0);
 bxp(g,1.5,.16,2.6,MT.dark,0,.46,0);
 bxp(g,.7,.5,.8,MT.furn2,0,1.15,.7);
 bxp(g,.7,.55,.14,MT.furn2,0,1.35,1.15,-.15);
 bxp(g,.6,.1,.5,MT.dark,0,1.42,.7);
 bxp(g,.5,.4,.12,MT.dark,0,1.2,-.7,-.3);
 const wg=new THREE.CylinderGeometry(.38,.38,.3,12),wm=new THREE.MeshLambertMaterial({color:0x15181c});
 for(const zz of[-.85,0,.85])for(const sx of[-1,1]){const w=new THREE.Mesh(wg,wm);w.rotation.z=Math.PI/2;w.position.set(sx*.86,.38,zz);g.add(w);ROVERWHEELS.push(w);}
 bxp(g,.5,.05,.7,new THREE.MeshLambertMaterial({color:0x223344}),0,1.42,.75,-.1);
 const ant=new THREE.Mesh(new THREE.CylinderGeometry(.015,.015,.9,6),MT.dark);ant.position.set(.55,1.9,.8);g.add(ant);
 for(const sx of[-1,1]){const L=new THREE.SpotLight(0xfff2d0,0,40,.5,.4,1.2);L.position.set(sx*.5,.85,-1.25);
  const tg=new THREE.Object3D();tg.position.set(sx*.5,.3,-9);g.add(tg);L.target=tg;g.add(L);ROVERLAMPS.push(L);}
 const btn=bxp(g,.3,.2,.1,MT.furn2,0,1.05,-1.2);
 hit(btn,'ROVER PANEL','POWER / LIGHTS',()=>{roverPanel();},1.2);
 hit(g.children[0],'ROVER','BOARD',()=>{enterRover();},1.02);
 ROVER.g.position.set(.95,0,12.15);ROVER.g.rotation.y=Math.PI;
 SHIPG.add(ROVER.g);KEEP.add(ROVER.g);
}
function roverPanel(){if(PL.mode==='rover'){toast('USE B (POWER) / L (LIGHTS) WHILE DRIVING');return;}
 ROVER.rea=!ROVER.rea;sfx('sw');toast(ROVER.rea?'ROVER REACTOR ON':'ROVER REACTOR OFF');}
function dockRover(){if(ROVER.out){ROVER.out=false;SURFG.remove(ROVER.g);SHIPG.add(ROVER.g);ROVER.g.position.set(.95,0,12.15);ROVER.g.rotation.set(0,Math.PI,0);ROVER.spd=0;}}
function undockRover(){if(!ROVER.out){ROVER.out=true;SHIPG.remove(ROVER.g);SURFG.add(ROVER.g);ROVER.g.position.copy(ROVER.wpos);ROVER.g.rotation.set(0,ROVER.head,0);}}
/*--------- hit system ---------*/
const HITS=[];
const HITMAT=new THREE.MeshBasicMaterial({visible:false});
const EDGEMAT=new THREE.LineBasicMaterial({color:0xffb347,transparent:true,opacity:.95});
function hit(mesh,label,prompt,act,grow){
 grow=grow||1.12;
 const g=mesh.geometry;g.computeBoundingBox();const bb=g.boundingBox;
 const s=V3().subVectors(bb.max,bb.min),c=V3().addVectors(bb.max,bb.min).multiplyScalar(.5);
 const hb=new THREE.Mesh(new THREE.BoxGeometry(Math.max(.05,s.x*grow),Math.max(.05,s.y*grow),Math.max(.05,s.z*grow)),HITMAT);
 const eg=new THREE.LineSegments(new THREE.EdgesGeometry(hb.geometry),EDGEMAT);eg.visible=false;hb.add(eg);
 hb.position.copy(c);hb.userData={label,prompt,act,edge:eg};
 mesh.add(hb);HITS.push(hb);return hb;}
const RC=new THREE.Raycaster();
function setHover(){
 if(TERM||PAUSED||DEAD||INTRO.on||(camMode!=='fp')||PL.mode==='rover'||PL.mode==='ext'){clearHover();return;}
 RC.setFromCamera({x:0,y:0},cam);
 const hits=RC.intersectObjects(HITS,false);
 let hv=null;
 if(hits.length&&hits[0].distance<(PL.seated?3.6:3.2))hv=hits[0].object;
 if(hv!==HOVERED){if(HOVERED)HOVERED.userData.edge.visible=false;HOVERED=hv;
  if(hv)sfx('hov');
  if(hv){hv.userData.edge.visible=true;const u=hv.userData;$('pr').innerHTML='<b>'+u.label+'</b> — '+u.prompt+(PL.seated?' <b>[CLICK]</b> · E = STAND':' <b>[CLICK / E]</b>');$('pr').style.display='block';}
  else $('pr').style.display='none';}}
function clearHover(){if(HOVERED){HOVERED.userData.edge.visible=false;HOVERED=null;}$('pr').style.display='none';}
function useCurrent(){if(HOVERED){sfx('click');HOVERED.userData.act();}}
/*--------- ship-local helpers ---------*/
const SHIPM=new THREE.Matrix4();
function shipToLocal(v,out){if(SHIPG.userData.mwF!==FRAMEID){SHIPG.updateMatrixWorld(true);SHIPG.userData.mwF=FRAMEID;}SHIPM.copy(SHIPG.matrixWorld).invert();return(out||V3()).copy(v).applyMatrix4(SHIPM);}
function localToShip(v,out){if(SHIPG.userData.mwF!==FRAMEID){SHIPG.updateMatrixWorld(true);SHIPG.userData.mwF=FRAMEID;}return(out||V3()).copy(v).applyMatrix4(SHIPG.matrixWorld);}
function injectWater(){if(!POW.rea.on){toast('REACTOR OFFLINE');sfx('deny');return;}
 if(INV.water>=10){INV.water-=10;POW.rea.water=clamp(POW.rea.water+35,0,100);sfx('hiss');toast('COOLANT INJECTED — REACTOR WATER '+Math.round(POW.rea.water)+'%');}
 else{sfx('deny');toast('NEED 10 L WATER — MELT ICE AT THE REFINERY');}}
function scramReset(){if(POW.rea.scram>0){if(INV.exo>=1){INV.exo-=1;POW.rea.scram=0;POW.rea.on=true;POW.rea.water=Math.max(POW.rea.water,30);sfx('whoosh');toast('EXOTIC MATTER JUMP-START — REACTOR ONLINE');}
  else{sfx('deny');toast('SCRAM LOCKED — NEED 1 EXOTIC MATTER (OR WAIT '+fmtT(POW.rea.scram)+')');}}
 else{sfx('deny');toast('NO SCRAM IN EFFECT');}}
