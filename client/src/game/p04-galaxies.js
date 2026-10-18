/* ═══════════════════════════════════════════════════════════════
   LAST LIGHT — source part 4/10: p04-galaxies.js
   PROCEDURAL UNIVERSE v2 — 4 galaxies, 62 systems, 483 bodies, stations
   NOTE: all parts share one closure; tools/build.js concatenates
   p01..p10 in order into client/js/game.js (byte-identical).
   ═══════════════════════════════════════════════════════════════ */
/*==================== PART 3B — PROCEDURAL UNIVERSE v2 (4 galaxies → ~56 systems → worlds, moons, stations) ====================*/
const GAL=[
 {id:'orion',name:'ORION SPUR',c:'#ffd9a0',ctr:[0,0,0],spread:1.9e14,home:1},
 {id:'veil',name:'SAGITTARIUS VEIL',c:'#ff8ac0',ctr:[5.4e16,3.2e16,-7.1e16],spread:2.2e15},
 {id:'lyra',name:'LYRA DEEP',c:'#7fd4ff',ctr:[-6.8e16,4.4e16,5.6e16],spread:2.6e15},
 {id:'forge',name:'THE COLD FORGE',c:'#b8ff9a',ctr:[4.6e17,-2.8e17,8.4e16],spread:3.2e15}];
const STATIONS=[];
(function expandUniverse(){
 const rng=mulberry32(((SET.useed||777)*2246822519)>>>0);
 const pick=a=>a[Math.floor(rng()*a.length)];
 const SYL=['KEL','VOR','TASH','MIR','OTH','ZAN','KRE','VAL','SUR','NOX','HEX','ARA','DUN','KOR','SEL','RIG','THAL','UMB','BRA','VEX','OSH','KAAN','LOTH','MER','SOLI','VAR'];
 const used=new Set(Object.keys(SYSTEMS).map(s=>SYSTEMS[s].name));
 const mkName=()=>{let n,guard=0;do{n=pick(SYL)+(rng()<.45?pick(SYL).toLowerCase():'')+(rng()<.75?'-'+(Math.floor(rng()*89)+10):' '+['MAJOR','MINOR','PRIME','II','III','IV','V','IX'][Math.floor(rng()*8)]);guard++;}while(used.has(n)&&guard<40);used.add(n);return n;};
 const CLS=[['O',[.62,.72,1],900000],['B',[.72,.82,1],520000],['A',[.86,.92,1],300000],['F',[.99,.99,.98],180000],['G',[1,.96,.85],130000],['K',[1,.85,.64],95000],['M',[1,.72,.5],70000]];
 const PALS=['rock','desert','ice','lava','toxic','ocean','terra','earth'];
 const DESC={
  rock:['An ancient cratered carcass of a world.','Silent, airless, hammered by eons of impacts.','A broken stone hurtling in the dark.'],
  desert:['Ochre dunes to the horizon. The wind never rests.','A furnace of rust and grit.','Salt flats crack under a bleached sky.'],
  ice:['A frozen ocean sealed beneath kilometers of crust.','Glacial ridges groan in the long night.','Blue-white and utterly still.'],
  lava:['Rivers of molten rock vein the crust.','The surface breathes fire. Sensors struggle.','A young world, still furious at being born.'],
  toxic:['Amber clouds of poison drift in slow cyclones.','The air itself is a solvent. Suit integrity critical.','Acid rains etch the lowlands.'],
  ocean:['Endless sea, scattered archipelagos.','Warm rains over deep water.','A water world — land is a rumor here.'],
  terra:['Continents of scrub and red grass.','A temperate world under a patient sun.','Canyons, dust, and thin but workable air.'],
  earth:['Green continents under white cloud decks.','A living world — oceans, storms, seasons.','Almost, almost like home.']};
 const HAZZ={rock:'NO ATMOSPHERE',desert:'HEAT · DUST STORMS',ice:'EXTREME COLD',lava:'MOLTEN SURFACE · RADIATION',toxic:'TOXIC ATMOSPHERE',ocean:'DEEP OCEAN · STORM SEAS',terra:'THIN ATMOSPHERE',earth:'HABITABLE — RARE'};
 let nExp=0;
 for(const g of GAL){
  const nSys=14;
  for(let i=0;i<nSys;i++){
   const key='X'+g.id+nExp;nExp++;
   const cls=CLS[Math.floor(Math.pow(rng(),1.7)*7)];
   const name=mkName();
   let px,py,pz;
   if(g.home){px=(rng()*2-1)*g.spread;py=(rng()*2-1)*g.spread*.22;pz=(rng()*2-1)*g.spread;}
   else{px=g.ctr[0]+(rng()*2-1)*g.spread;py=g.ctr[1]+(rng()*2-1)*g.spread*.3;pz=g.ctr[2]+(rng()*2-1)*g.spread;}
   const hxr=v=>Math.round(v*255);
   const cHex=(hxr(cls[1][0])<<16)|(hxr(cls[1][1])<<8)|hxr(cls[1][2]);
   SYSTEMS[key]={name,pos:[px,py,pz],c:cHex,gal:g.id};
   BDEF.push({sys:key,id:'st'+key,name:name,t:'star',r:cls[2]*(0.8+rng()*1.5),pal:'gas',rot:200+rng()*4000,desc:cls[0]+'-class star in the '+g.name+'.',haz:'STELLAR CORONA — LETHAL'});
   const nPl=2+Math.floor(rng()*6);
   let a=(0.32+rng()*.5)*1.5e8;
   for(let p=0;p<nPl;p++){
    a*=1.55+rng()*1.1;
    const early=p<2&&a<1.1e8;
    const pal=early?pick(['rock','desert','lava','toxic']):pick(PALS);
    const pid='p'+key+'_'+p;
    const r=1400+Math.pow(rng(),2)*15000;
    const hot=a<1.2e8,cold=a>7e8;
    const tk=pal==='lava'?1000:hot?600+rng()*300:cold?70+rng()*90:200+rng()*130;
    const res={};if(rng()<.8)res.ore=1+Math.floor(rng()*4);if(rng()<.6)res.ice=1+Math.floor(rng()*4);if(rng()<.35)res.org=1+Math.floor(rng()*3);if(rng()<.22)res.exo=1+Math.floor(rng()*3);
    const bd={sys:key,id:pid,name:name.split(' ')[0]+' '+['b','c','d','e','f','g','h'][p],t:pal==='gas'?'gas':'rock',r,a,per:400+Math.floor(rng()*30000),rot:(6+rng()*70)*(rng()<.15?-1:1),pal,
     g:pal==='gas'?8+rng()*18:(r/6371)*9.8*(.7+rng()*.6),tk,res,desc:pick(DESC[pal]),haz:HAZZ[pal]};
    if(pal==='gas'){bd.haz='NO SOLID SURFACE — DO NOT DESCEND';if(rng()<.4)bd.ring=[r*.18,r*.34];}
    else bd.at=(pal==='earth'||pal==='ocean'||pal==='terra')?(40+Math.floor(rng()*70)):(pal==='toxic'?110:(rng()<.5?Math.floor(rng()*20):0));
    BDEF.push(bd);
    const nMoon=(pal==='gas'?Math.floor(rng()*4):(rng()<.42?1+Math.floor(rng()*2):0));
    for(let m=0;m<nMoon;m++){
     const mres=rng()<.7?{ore:1+Math.floor(rng()*3),ice:rng()<.6?1+Math.floor(rng()*3):0}:{};
     BDEF.push({sys:key,id:pid+'m'+m,name:bd.name.split(' ').pop()+'-'+(m+1),t:'rock',par:pid,r:600+Math.floor(rng()*1900),a:r*(2.2+m*1.4+rng()),per:90+Math.floor(rng()*600),rot:80+Math.floor(rng()*600),pal:rng()<.55?'ice':'rock',g:.3+rng()*2,tk:80+Math.floor(rng()*160),res:mres,
      desc:'Moon of '+bd.name+'.',haz:'NO ATMOSPHERE'});}}}}
 for(const s in SYSTEMS)if(!SYSTEMS[s].gal)SYSTEMS[s].gal='orion';
 /* deep-space stations — 62% of systems (Sol always gets one) */
 for(const s in SYSTEMS){
  if(s!=='Sol'&&rng()>.62)continue;
  const pls=BDEF.filter(b=>b.sys===s&&b.t!=='star');
  const par=pls.length?pls[Math.floor(rng()*pls.length)]:BDEF.find(b=>b.sys===s&&b.t==='star');
  STATIONS.push({id:'stn_'+s,sys:s,name:(s==='Sol'?'KESTREL YARD':SYSTEMS[s].name.split(' ')[0]+' '+(rng()<.5?'ANCHORAGE':'GATEWAY')),
   par:par.id,a:(par.a||4e7)+2.5e7*(1+rng()*2),per:(par.per||400)*1.2,ang:rng()*6.28,r:.8+rng()*.5,seed:Math.floor(rng()*99999),dist:1e18,posKm:V3(0,0,0),posU:V3(0,0,0)});}
})();
function buildStarfield(){
 if(UNI.userData.sfx){for(const o of UNI.userData.sfx){UNI.remove(o);if(o.geometry&&o.geometry.dispose)o.geometry.dispose();}}
 UNI.userData.sfx=[]
 if(UNI.userData.sf){UNI.remove(UNI.userData.sf);if(UNI.userData.sf.geometry.dispose)UNI.userData.sf.geometry.dispose();}
 if(UNI.userData.sf2){UNI.remove(UNI.userData.sf2);if(UNI.userData.sf2.geometry.dispose)UNI.userData.sf2.geometry.dispose();}
 const dens=clamp((SET.sd||1)*[.45,.8,1.15,1.6][SET.q||2],.25,2.6);
 /* 10,000 stars at 100% density — seeded PRNG, spectral classes, milky band */
 const rng=mulberry32((((SET.useed||777)*2654435761)>>>0)^0x9E3779B9);
 const SPEC=[['O',.004,[.62,.72,1],1.6],['B',.028,[.72,.82,1],1.35],['A',.08,[.86,.92,1],1.16],['F',.12,[.99,.99,.98],1],['G',.2,[1,.96,.85],.9],['K',.3,[1,.85,.64],.76],['M',.268,[1,.72,.5],.62]];
 let acc=0;for(const s of SPEC)acc+=s[1];
 const pickClass=()=>{const r=rng()*acc;let c=0;for(const s of SPEC){c+=s[1];if(r<c)return s;}return SPEC[6];};
 const bn=V3(rng()*2-1,rng()*2-1,rng()*2-1).normalize();
 const bandPos=(out)=>{const th=rng()*Math.PI*2,ph=Math.acos(rng()*2-1);
  let x=Math.sin(ph)*Math.cos(th),y=Math.cos(ph),z=Math.sin(ph)*Math.sin(th);
  if(rng()<.55){const k=x*bn.x+y*bn.y+z*bn.z;
   x-=k*bn.x;y-=k*bn.y;z-=k*bn.z;
   const l=Math.hypot(x,y,z)||1;x/=l;y/=l;z/=l;
   const j=(rng()-.5)*.26;x+=j*bn.x;y+=j*bn.y;z+=j*bn.z;
   const l2=Math.hypot(x,y,z)||1;x/=l2;y/=l2;z/=l2;}
  out(x,y,z);};
 const mkLayer=(N,size,brightK)=>{const pos=new Float32Array(N*3),col=new Float32Array(N*3);
  for(let i=0;i<N;i++){bandPos((x,y,z)=>{pos[i*3]=x*1.85e6;pos[i*3+1]=y*1.85e6;pos[i*3+2]=z*1.85e6;});
   const S=pickClass(),lum=Math.pow(rng(),2.2)*.7+.3,k=brightK*(.45+lum*.85);
   col[i*3]=S[2][0]*k*S[3];col[i*3+1]=S[2][1]*k*S[3];col[i*3+2]=S[2][2]*k*S[3];}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));
  return new THREE.Points(g,new THREE.PointsMaterial({size,sizeAttenuation:false,vertexColors:true,transparent:true,opacity:.95,depthWrite:false}));};
 const pts=mkLayer(Math.round(8200*dens),1.7,.75);pts.frustumCulled=false;pts.renderOrder=-10;UNI.add(pts);UNI.userData.sf=pts;
 const sf2=mkLayer(Math.round(1800*dens),3.4,1.05);sf2.frustumCulled=false;sf2.renderOrder=-9;UNI.add(sf2);UNI.userData.sf2=sf2;
 if((SET.q||2)>=1){const N3=Math.round(420*dens),p3=new Float32Array(N3*3);
  for(let i=0;i<N3;i++){bandPos((x,y,z)=>{const rr=Math.sqrt(Math.max(.001,1-z*z));p3[i*3]=x*rr*1.84e6;p3[i*3+1]=z*1.84e6;p3[i*3+2]=y*rr*1.84e6;});}
  const g3=new THREE.BufferGeometry();g3.setAttribute('position',new THREE.BufferAttribute(p3,3));
  const dust=new THREE.Points(g3,new THREE.PointsMaterial({color:0xaac4e8,size:52,sizeAttenuation:false,transparent:true,opacity:.05,blending:THREE.AdditiveBlending,depthWrite:false}));
  dust.frustumCulled=false;dust.renderOrder=-10;UNI.add(dust);UNI.userData.sfx.push(dust);}
 const markPts=entries=>{const pp=[],cc=[];
  for(const e of entries){const p=e.pos,d=Math.hypot(p[0],p[1],p[2])||1,c=new THREE.Color(e.c);
   pp.push(p[0]/d*1.84e6,p[1]/d*1.84e6,p[2]/d*1.84e6);cc.push(c.r,c.g,c.b);}
  const gg=new THREE.BufferGeometry();gg.setAttribute('position',new THREE.Float32BufferAttribute(pp,3));gg.setAttribute('color',new THREE.Float32BufferAttribute(cc,3));
  const sp=new THREE.Points(gg,new THREE.PointsMaterial({size:5,sizeAttenuation:false,vertexColors:true,transparent:true,opacity:1,depthWrite:false}));
  sp.frustumCulled=false;sp.renderOrder=-9;UNI.add(sp);UNI.userData.sfx.push(sp);};
 const sysE=[];for(const s in SYSTEMS){if(s==='Sol')continue;sysE.push({pos:SYSTEMS[s].pos,c:SYSTEMS[s].c});}
 markPts(sysE);
 markPts(ANOM.bh.map(b=>({pos:b.pos,c:0xff8040})).concat(ANOM.wh,ANOM.voy?[ANOM.voy]:[]));
 if((SET.q||2)>=1)for(const nb of ANOM.neb){
  const dir=nb.posU.clone().normalize();
  for(let k=0;k<7;k++){
   const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:nb.col3,transparent:true,opacity:.26,blending:THREE.AdditiveBlending,depthWrite:false}));
   sp.position.copy(dir).add(V3(rnd(-.05,.05),rnd(-.05,.05),rnd(-.05,.05))).normalize().multiplyScalar(1.83e6);
   sp.scale.setScalar(rnd(2.6e5,5.4e5));sp.renderOrder=-9;sp.frustumCulled=false;
   UNI.add(sp);UNI.userData.sfx.push(sp);}}}
function buildBodies(){
 for(const b of BDEF){
  const bd=Object.assign({},b);bd.posKm=V3(0,0,0);bd.posU=V3(0,0,0);bd.ang=hashId(b.id)%628/100;
  bd.makeClouds=(bd.t==='rock'&&(bd.pal==='earth'||bd.pal==='terra'||bd.pal==='ocean'||bd.pal==='ice'));
  bd.night=(bd.id==='earth'||bd.id==='pb'||bd.id==='alkere');
  const grp=new THREE.Group();bd.grp=grp;UNI.add(grp);
  const rU=bd.r*US;
  bd.mat=new THREE.ShaderMaterial({vertexShader:PLANT_VS,fragmentShader:PLANT_FS,uniforms:bodyUniforms(bd)});
  if(bd.t==='star'&&!bd.par)BSTAR[bd.sys]=bd;
  const seg=bd.t==='star'?48:40;
  bd.mesh=new THREE.Mesh(new THREE.SphereGeometry(rU,seg,Math.round(seg*.66)),bd.mat);
  bd.mesh.rotation.y=0;grp.add(bd.mesh);
  if(bd.t==='star'){const sm=new THREE.SpriteMaterial({map:GLOW,color:SYSTEMS[bd.sys].c,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false});
   bd.glow=new THREE.Sprite(sm);bd.glow.scale.setScalar(rU*9);grp.add(bd.glow);}
  if(bd.ring){const rg=makeRing(bd);grp.add(rg);}
  BODY.push(bd);}}
function makeRing(bd){const g=new THREE.Group();const inU=bd.ring[0]*US,outU=bd.ring[1]*US;
 const cv=document.createElement('canvas');cv.width=256;cv.height=8;const cx=cv.getContext('2d');
 const n=mkn3(hashId(bd.id)+5);
 for(let x=0;x<256;x++){const e=fbm3(n,x/24,0,0,3);const a=clamp((.3+e*.9)*Math.sin(x/256*Math.PI),0,1);
  const c=lerp(150,235,e);cx.fillStyle='rgba('+Math.round(c)+','+Math.round(c*.93)+','+Math.round(c*.8)+','+a.toFixed(3)+')';cx.fillRect(x,0,1,8);}
 const rt=new THREE.CanvasTexture(cv);rt.colorSpace=THREE.SRGBColorSpace;
 const geo=new THREE.RingGeometry(inU,outU,96,1);
 const posA=geo.attributes.position,uvA=geo.attributes.uv;
 for(let i=0;i<posA.count;i++){const r=Math.hypot(posA.getX(i),posA.getY(i));uvA.setXY(i,(r-inU)/(outU-inU),.5);}
 const disc=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({map:rt,transparent:true,side:THREE.DoubleSide,depthWrite:false}));
 disc.rotation.x=-Math.PI/2;g.add(disc);
 const cnt=bd.id==='vegamir'?2600:1100;
 const rockG=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0),new THREE.MeshLambertMaterial({color:0xb8a88e}),cnt);
 const M4=new THREE.Matrix4(),Q=new THREE.Quaternion(),S=V3(1,1,1),P=V3(0,0,0);
 const rmin=inU*.98,rmax=outU*1.02,sp=(rmax-rmin);
 for(let i=0;i<cnt;i++){const r=Math.sqrt(lerp(rmin*rmin,rmax*rmax,Math.random()));
  const a=rnd(0,Math.PI*2);P.set(Math.cos(a)*r,(Math.random()+Math.random()+Math.random()-1.5)*sp*.012,Math.sin(a)*r);
  Q.setFromEuler(new THREE.Euler(rnd(0,6.3),rnd(0,6.3),rnd(0,6.3)));
  const s=lerp(sp/700,sp/110,Math.random());S.set(s*rnd(.6,1.6),s*rnd(.6,1.6),s*rnd(.6,1.6));
  M4.compose(P,Q,S);rockG.setMatrixAt(i,M4);}
 g.add(rockG);g.rotation.x=bd.id==='vegamir'?.34:.42;g.rotation.z=bd.id==='vegamir'?.1:0;
 return g;}
function applyShaders(){
 for(const b of BODY){
  if(b.makeClouds){
   const cm=new THREE.Mesh(new THREE.SphereGeometry(b.r*US*1.018,40,26),
    new THREE.ShaderMaterial({vertexShader:PLANT_VS,fragmentShader:CLOUD_FS,transparent:true,depthWrite:false,
     uniforms:{uSeed:{value:seedVec(b.id+'c')},uSunD:{value:V3(1,0,0)},uTime:{value:0},uFreqC:{value:3.4}}}));
   b.clouds=cm;b.grp.add(cm);}
  const p=PAL[b.pal];
  if(b.at&&b.t==='rock'){const am=new THREE.ShaderMaterial({vertexShader:AT_VS,fragmentShader:AT_FS,uniforms:{uC:{value:new THREE.Color(p.at)},uI:{value:p.atI},uSun:{value:V3(1,0,0)},uCam:{value:V3(0,0,0)}},
   transparent:true,blending:THREE.AdditiveBlending,side:THREE.BackSide,depthWrite:false});
  b.atmo=new THREE.Mesh(new THREE.SphereGeometry(b.r*US*(1+b.at/b.r*2.2+.03),40,26),am);b.grp.add(b.atmo);}}}
/*------------ orbital update (single pass — O(bodies) for a 200-body universe) ------------*/
function updateBodies(){
 const byId={};for(const b of BODY)byId[b.id]=b;
 for(const b of BODY){
  if(b.t==='star'&&!b.par){b.posKm.set(SYSTEMS[b.sys].pos[0],SYSTEMS[b.sys].pos[1],SYSTEMS[b.sys].pos[2]);}
  else{const par=b.par?byId[b.par]:null;
   let cx0=0,cy0=0,cz0=0;
   if(par){if(par.id==='earth'&&FLG.earthGone){cx0=FL.earthPosKm.x;cy0=FL.earthPosKm.y;cz0=FL.earthPosKm.z;}
    else{cx0=par.posKm.x;cy0=par.posKm.y;cz0=par.posKm.z;}}
   else{let st=null;for(const x of BODY){if(x.sys===b.sys&&x.t==='star'&&!x.par){st=x;break;}}
    if(st){cx0=st.posKm.x;cy0=st.posKm.y;cz0=st.posKm.z;}}
   const ang=b.ang+2*Math.PI*T.t/((b.per||1)*3600);
   b.posKm.set(cx0+Math.cos(ang)*b.a,cy0+Math.sin(ang*.7)*b.a*.004,cz0+Math.sin(ang)*b.a);}
  b.posU.copy(b.posKm).multiplyScalar(US);
  if(b.mesh)b.mesh.rotation.y=2*Math.PI*T.t/((b.rot||24)*3600);
  if(b.clouds)b.clouds.rotation.y=2*Math.PI*T.t/((b.rot||24)*3600)*1.14;}
 for(const st of STATIONS){
  const par=byId[st.par];if(!par)continue;
  const ang=st.ang+2*Math.PI*T.t/((st.per||1)*3600);
  st.posKm.set(par.posKm.x+Math.cos(ang)*st.a,par.posKm.y,par.posKm.z+Math.sin(ang)*st.a);
  if(!st.posU)st.posU=V3(0,0,0);
  st.posU.copy(st.posKm).multiplyScalar(US);}
 if(DEB.on)updateDebris();}
function nearestStar(posU){let best=null,bd=1e18;for(const b of BODY){if(b.t!=='star')continue;const d=posU.distanceTo(b.posU);if(d<bd){bd=d;best=b;}}return{b:best,d:bd};}
function placeBodies(){
 if(MODE==='space'){UNI.visible=true;UNI.userData.sf.visible=true;if(UNI.userData.sf2)UNI.userData.sf2.visible=true;
  for(const b of BODY){TMP.copy(b.posU).sub(SP.pos);b.grp.position.copy(TMP);b.grp.scale.setScalar(1);b.grp.visible=true;
   const st=BSTAR[b.sys]||b;
   TMP2.copy(st.posU).sub(b.posU).normalize();
   const uu=b.mat.uniforms;
   if(uu){uu.uSunD.value.copy(TMP2);uu.uCamP.value.copy(cam.position);uu.uTime.value=T.t;}
   if(b.clouds){const cu=b.clouds.material.uniforms;cu.uSunD.value.copy(TMP2);cu.uTime.value=T.t;}
   if(b.atmo){b.atmo.material.uniforms.uCam.value.copy(cam.position);b.atmo.material.uniforms.uSun.value.copy(TMP2);}}
  if(DEB.on){DEB.grp.position.copy(DEB.posU).sub(SP.pos);DEB.grp.visible=true;}}
 else{const SW=shipWorldU();UNI.visible=true;UNI.userData.sf.visible=false;if(UNI.userData.sf2)UNI.userData.sf2.visible=false;
  for(const a of ANOM.bh.concat(ANOM.wh,ANOM.voy?[ANOM.voy]:[]))if(a.grp)a.grp.visible=false;
  if(NEBHALO)NEBHALO.material.opacity=0;
  for(const b of BODY){TMP.copy(b.posU).sub(SW).multiplyScalar(8000);
   const d=TMP.length(),k=d>9e5?9e5/d:1;
   if(b===LF.body||b.t==='star'){b.grp.visible=false;continue;}
   b.grp.position.copy(TMP).multiplyScalar(k||0);b.grp.scale.setScalar(8000*(k||1));b.grp.visible=true;}
  if(DEB.on)DEB.grp.visible=false;}}
/*------------ course / gear / dashboard ------------*/
function coursePos(out){out=out||V3();
 if(!COURSE)return null;
 if(COURSE.kind==='body')return out.copy(COURSE.ref.posU);
 if(COURSE.kind==='anom')return out.copy(COURSE.ref.posU);
 if(COURSE.kind==='sys'){const st=BODY.find(x=>x.sys===COURSE.ref&&x.t==='star'&&!x.par);return st?out.copy(st.posU):null;}
 return null;}
function setCourse(kind,ref,name){COURSE={kind,ref,name};
 if(kind==='body'){MARK=ref;FL.mark=ref.id;}
 sfx('beep');toast('COURSE SET — '+name+' · FOLLOW THE HUD ARROW · N = AUTO-ALIGN');}
function toggleGear(){GEARST.tgt=GEARST.tgt>0?0:1;sfx('gear');
 toast(GEARST.tgt?'LANDING GEAR DEPLOYING':'LANDING GEAR STOWING');dashSync();}
function gearAnim(dt){GEARST.d+=((GEARST.tgt>0?1:0)-GEARST.d)*Math.min(1,dt*1.3);
 for(const p of GEARLEGS)p.rotation.x=(1-GEARST.d)*1.5*(p.userData.s||1);}
function dashBtn(i){
 switch(i){
  case 0:toggleGear();break;
  case 1:SRF.extL=!SRF.extL;toast('EXTERIOR FLOODS '+(SRF.extL?'ON':'OFF'));sfx('sw');break;
  case 2:SRF.navL=!SRF.navL;toast('NAV LIGHTS '+(SRF.navL?'ON':'OFF'));sfx('sw');break;
  case 3:if(!POW.brk.main||POW.batt<=0){toast('NO POWER');sfx('deny');}else{POW.brk.lit=!POW.brk.lit;syncLevers();toast('CABIN LIGHTS '+(POW.brk.lit?'ON':'OFF'));sfx('sw');}break;
  case 4:{const nv=SET.v>0?0:.7;SET.v=nv;AU.setV(nv);saveSet();toast(nv?'AUDIO ON':'AUDIO MUTED');sfx('sw');}break;
  case 5:scannerPing();break;
  case 6:{let any=false;for(const D of DOORS)if(D.tgt<1)any=true;for(const D of DOORS)D.tgt=any?1:0;sfx('door');toast(any?'ALL DOORS OPENING':'ALL DOORS CLOSING');}break;
  case 7:toggleRamp();break;
  case 8:camMode=camMode==='ext'?'fp':'ext';sfx('click');toast(camMode==='ext'?'EXTERNAL CAMERA':'COCKPIT VIEW');break;
  case 9:SRF.align=!SRF.align;sfx('beep');toast(SRF.align?'AUTO-ALIGN ENGAGED':'AUTO-ALIGN OFF');break;}
 dashSync();}
function dashSync(){for(let i=0;i<DBTN.length;i++){let on=false;
  switch(i){case 0:on=GEARST.tgt>0;break;case 1:on=SRF.extL;break;case 2:on=SRF.navL;break;case 3:on=POW.brk.lit&&pwr('main');break;
   case 4:on=SET.v>0;break;case 5:on=false;break;case 6:on=DOORS.every(d=>d.tgt>0);break;case 7:on=RAMPST.tgt>0;break;
   case 8:on=camMode==='ext';break;case 9:on=SRF.align;break;}
  DBTN[i].led.material.emissiveIntensity=on?1.3:.06;}}
function navBlink(){if(!NAVL.length&&!STROBE)return;const t=T.t;
 const blink=Math.sin(t*3)>0?1.15:.08;
 for(const m of NAVL)m.material.emissiveIntensity=SRF.navL?blink:.05;
 for(const s2 of NAVS)s2.material.opacity=SRF.navL?(blink>.5?.8:.25):0;
 if(STROBE)STROBE.material.opacity=(SRF.navL&&Math.sin(t*5.3)>.55)?.95:0;}
/*------------ anomalies ------------*/
function wormholeJump(w){const sib=ANOM.wh[w.link];SRF.whcd=45;
 SP.pos.copy(sib.posU).addScaledVector(SP.fwd,3.4e8);SP.spd=Math.min(SP.spd,400);
 SHK.t=1.6;SHK.amp=1.1;sfx('tele');
 toast('WORMHOLE TRANSIT — '+w.name+' → '+sib.name,1);
 FL.log.push({t:T.t,m:'WORMHOLE TRANSIT: '+w.name+' → '+sib.name});saveGame(true);}
function anomUpdate(dt){
 if(MODE!=='space')return;
 let bhPull=0;
 for(const b of ANOM.bh){
  const d=SP.pos.distanceTo(b.posU);
  const inf=2.5e11;
  if(d<inf){
   const k=clamp(1-d/inf,0,1);
   bhPull=Math.max(bhPull,k);
   TMP.copy(b.posU).sub(SP.pos).normalize();
   SP.pos.addScaledVector(TMP,k*k*8200*dt);
   if(k>.5){SHK.t=Math.max(SHK.t,.25);SHK.amp=Math.max(SHK.amp,k*.4);}
   if(d<b.r*US*1.7){die('CROSSED THE EVENT HORIZON OF '+b.name);return;}
   if(T.t-(SRF.bhT||0)>8&&k>.2){SRF.bhT=T.t;toast('GRAVITY WELL — '+b.name+' IS PULLING YOU IN',1);}}}
 SRF.bhK=bhPull;
 setLoop('rumble',bhPull*.55,36+bhPull*44);
 T.rate=60*clamp(1-bhPull*.85,.15,1);
 let nk=0,nn=null;
 for(const n of ANOM.neb){
  const d=SP.pos.distanceTo(n.posU),R=n.R*US;
  if(d<R&&nk<1-d/R){nk=1-d/R;nn=n;}}
 if(nn&&SRF.nebName!==nn.name){SRF.nebName=nn.name;toast('ENTERING NEBULA — '+nn.name+' · SENSORS DEGRADED',1);FL.log.push({t:T.t,m:'ENTERED NEBULA: '+nn.name});}
 if(!nn&&SRF.nebName){SRF.nebName='';FL.log.push({t:T.t,m:'CLEAR SKIES — SENSORS NOMINAL'});}
 SRF.nebK=nk;
 setLoop('neb',nk*.22);
 if(UNI.userData.sf)UNI.userData.sf.material.opacity=clamp(.95-nk*.85,0,.95);
 if(UNI.userData.sf2)UNI.userData.sf2.material.opacity=clamp(1-nk*.9,0,1);
 if(NEBHALO){NEBHALO.material.opacity=nk*.34;
  if(nn)NEBHALO.material.color.set(nn.c);
  NEBHALO.position.copy(cam.position);}
 if(nk>0&&nn)AMB.color.lerp(nn.col3,Math.min(1,dt*1.5)*nk);
 else AMB.color.lerp(AMB0,Math.min(1,dt*1.5));
 if(SRF.whcd>0)SRF.whcd-=dt;
 else for(const w of ANOM.wh){if(SP.pos.distanceTo(w.posU)<3e8){wormholeJump(w);break;}}
 const vp=ANOM.voy;
 if(vp&&!FLG.voyGot){
  const d=SP.pos.distanceTo(vp.posU);
  if(!FLG.voySeen&&d<2.5e8){FLG.voySeen=true;sfx('ping');
   toast('RARE CONTACT — VOYAGER 1 PASSING CLOSE. THE GOLDEN RECORD GLEAMS.',1);
   FL.log.push({t:T.t,m:'FLYBY: VOYAGER 1 — PALE BLUE DOT CARRIER'});}
  if(FLG.voySeen&&d<7.5e7){FLG.voyGot=true;INV.parts+=2;INV.exo+=1;sfx('pickup');
   toast('VOYAGER 1 RECOVERED — +2 PARTS · +1 EXOTIC · HUMANITY\'S FARTHEST REACH',1);
   FL.log.push({t:T.t,m:'RECOVERED: VOYAGER 1 — 24 BILLION KM FROM HOME'});}}
 const all=ANOM.bh.concat(ANOM.wh,vp?[vp]:[]);
 for(const a of all){
  if(!a.grp)continue;
  TMP.copy(a.posU).sub(SP.pos);
  const vis=TMP.length()<2.55e6;
  a.grp.position.copy(TMP);a.grp.visible=vis;}
 if(vp&&vp.grp)vp.grp.rotation.y+=dt*.3;
 for(const w of ANOM.wh)if(w.grp&&w.grp.visible){w.ring.rotation.z+=dt*.6;w.disc.rotation.z-=dt*.45;}
 for(const b of ANOM.bh)if(b.grp&&b.grp.visible&&b.disk)b.disk.rotation.z+=dt*.14;}
/*------------ random space events ------------*/
function eventTick(dt){if(MODE!=='space'||!BOOTED||MENU)return;
 EVT.next-=dt;
 if(EVT.next<=0){EVT.next=rnd(260,540);spawnEvent();}
 for(let i=EVTS.length-1;i>=0;i--){const e=EVTS[i];e.t+=dt;
  if(e.up)e.up(e,dt);
  if(e.t>e.dur){if(e.g&&e.g.parent)scene.remove(e.g);EVTS.splice(i,1);}}}
function spawnEvent(){const r=Math.random();
 if(r<.42)meteors();else if(r<.72)flare();else nova();}
function meteors(){
 const g=new THREE.Group();scene.add(g);
 const m=new THREE.MeshBasicMaterial({color:0xcfe8ff,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false});
 for(let i=0;i<10;i++){const b=new THREE.Mesh(new THREE.BoxGeometry(.06,.06,rnd(6,14)),m);
  b.position.set(rnd(-60,60),rnd(-40,40),-rnd(120,420));
  b.rotation.y=rnd(-.7,.7)+Math.PI/2;g.add(b);}
 g.position.copy(SP.fwd).multiplyScalar(300).add(V3(rnd(-200,200),rnd(-120,120),rnd(-200,200)));
 EVTS.push({g,t:0,dur:2.6,up(e2,dt2){e2.g.position.addScaledVector(SP.fwd,dt2*260);e2.g.children[0].material.opacity=Math.max(0,.9-e2.t*.4);}});
 sfx('whoosh');toast('METEOR STREAM — DEBRIS CROSSING CLOSE');}
function flare(){
 const ns=nearestStar(SP.pos);
 if(ns.d>2.4e12){meteors();return;}
 POW.batt=clamp(POW.batt-12,0,100);sfx('flare');
 toast('SOLAR FLARE — '+ns.b.name.toUpperCase()+' RADIATION SPIKE · BATTERY -12%',1);
 FL.log.push({t:T.t,m:'EVENT: SOLAR FLARE FROM '+ns.b.name.toUpperCase()});
 const base=SUNL.intensity;
 EVTS.push({g:null,t:0,dur:3,up(e2){SUNL.intensity=base*(1+2.2*Math.sin(Math.min(1,e2.t/e2.dur)*Math.PI));}});}
function nova(){
 const dir=V3(rnd(-1,1),rnd(-.4,.6),rnd(-1,1)).normalize();
 const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:0xdfe8ff,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));
 sp.position.copy(dir).multiplyScalar(1.7e6);sp.scale.setScalar(1.2e5);scene.add(sp);
 EVTS.push({g:sp,t:0,dur:7,up(e2){const k=e2.t/e2.dur;e2.g.material.opacity=k<.25?k*4*.95:Math.max(0,.95-(k-.25)*1.3);e2.g.scale.setScalar(1.2e5+k*8e5);}});
 sfx('flash');
 toast('DISTANT SUPERNOVA — THE LIGHT OF A DYING STAR, OLDER THAN YOUR MISSION');
 FL.log.push({t:T.t,m:'EVENT: SUPERNOVA OBSERVED — CORE-COLLAPSE, 40,000 LY'});}
/*------------ anomaly visuals ------------*/
function buildAnomalies(){
 for(const b of ANOM.bh){
  const g=new THREE.Group();g.visible=false;UNI.add(g);b.grp=g;
  const rU=b.r*US;
  g.add(new THREE.Mesh(new THREE.SphereGeometry(rU,48,32),new THREE.MeshBasicMaterial({color:0x000000})));
  const cv=document.createElement('canvas');cv.width=256;cv.height=16;const cx=cv.getContext('2d');
  for(let x=0;x<256;x++){const t=x/255;
   const r=Math.round(lerp(255,120,t)),gg=Math.round(lerp(240,60,t)),bb=Math.round(lerp(210,30,t));
   cx.fillStyle='rgba('+r+','+gg+','+bb+','+(1-t*.55).toFixed(3)+')';cx.fillRect(x,0,1,16);}
  const bt=new THREE.CanvasTexture(cv);bt.colorSpace=THREE.SRGBColorSpace;
  const disk=new THREE.Mesh(new THREE.RingGeometry(rU*1.35,rU*4.4,110,1),
   new THREE.MeshBasicMaterial({map:bt,transparent:true,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false}));
  const pa=disk.geometry.attributes.position,uv=disk.geometry.attributes.uv;
  for(let i=0;i<pa.count;i++){const rr=Math.hypot(pa.getX(i),pa.getY(i));uv.setXY(i,(rr-rU*1.35)/(rU*4.4-rU*1.35),.5);}
  disk.rotation.x=-1.05;b.disk=disk;g.add(disk);
  const ph=new THREE.Mesh(new THREE.TorusGeometry(rU*1.28,rU*.02,8,90),new THREE.MeshBasicMaterial({color:0xfff0d8}));
  ph.rotation.x=Math.PI/2-1.05;g.add(ph);
  const gl=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:0xffa060,transparent:true,opacity:.4,blending:THREE.AdditiveBlending,depthWrite:false}));
  gl.scale.setScalar(rU*7);g.add(gl);
  g.rotation.z=.3;}
 for(const w of ANOM.wh){
  const g=new THREE.Group();g.visible=false;UNI.add(g);w.grp=g;
  const R=2.4e8;
  w.ring=new THREE.Mesh(new THREE.TorusGeometry(R,R*.045,10,80),new THREE.MeshBasicMaterial({color:new THREE.Color(w.c)}));
  g.add(w.ring);
  w.disc=new THREE.Mesh(new THREE.CircleGeometry(R*.94,48),
   new THREE.MeshBasicMaterial({color:new THREE.Color(w.c),transparent:true,opacity:.32,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false}));
  g.add(w.disc);
  const gl=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:new THREE.Color(w.c),transparent:true,opacity:.5,blending:THREE.AdditiveBlending,depthWrite:false}));
  gl.scale.setScalar(R*3.4);g.add(gl);}
 if(ANOM.voy){const g=new THREE.Group();g.visible=false;UNI.add(g);ANOM.voy.grp=g;
  const gold=new THREE.MeshLambertMaterial({color:0xc8a44a});
  bxp(g,1.2,.9,.9,gold,0,0,0);
  const dish=new THREE.Mesh(new THREE.SphereGeometry(1.15,20,12,0,Math.PI*2,0,1.25),gold);
  dish.position.set(0,.35,1.15);dish.rotation.x=-.4;g.add(dish);
  const boom=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,3.4,6),gold);boom.rotation.x=Math.PI/2;boom.position.set(0,0,-2.6);g.add(boom);
  for(let i=0;i<3;i++)bxp(g,.06,1.6,.5,gold,.5,-.2,-3.6,0,0,.35+i*.55);
  bxp(g,.4,.4,1.6,new THREE.MeshLambertMaterial({color:0x333a40}),0,.05,-4.4);
  const bcn=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:0xffd9a0,transparent:true,opacity:.8,blending:THREE.AdditiveBlending,depthWrite:false}));
  bcn.position.y=1.4;bcn.scale.setScalar(4);g.add(bcn);
  g.scale.setScalar(9);}
 NEBHALO=new THREE.Mesh(new THREE.SphereGeometry(5e5,24,16),
  new THREE.MeshBasicMaterial({color:0x7fd4ff,transparent:true,opacity:0,side:THREE.BackSide,depthWrite:false}));
 NEBHALO.frustumCulled=false;NEBHALO.renderOrder=-8;UNI.add(NEBHALO);}
/*------------ static-matrix freeze (perf) ------------*/
function freezeStatic(root){for(const c of root.children){if(KEEP.has(c))continue;
 if(c.updateMatrix)c.updateMatrix();
 c.matrixAutoUpdate=false;
 freezeStatic(c);}}
/*------------ earth destruction ------------*/
const DEB={on:false,grp:new THREE.Group(),chunks:[],vel:V3(0,0,0),posU:V3(0,0,0)};
FL.earthPosKm=V3(0,0,0);let DEBposU=V3(0,0,0);
function applyEarthGone(silent){const e=bodyById('earth');
 if(!FL.earthPosKm||typeof FL.earthPosKm.copy!=='function')FL.earthPosKm=V3(0,0,0);
 if(!FLG.earthGone){FL.earthPosKm.copy(e.posKm);FLG.earthGone=true;FLG.goneT=T.t;}
 e.grp.visible=false;DEB.posU.copy(FL.earthPosKm).multiplyScalar(US);
 if(!DEB.on){DEB.on=true;scene.add(DEB.grp);
  const N=1400,pos=new Float32Array(N*3),col=new Float32Array(N*3),r0=e.r*US;
  for(let i=0;i<N;i++){const th=rnd(0,6.3),ph=Math.acos(rnd(-1,1)),rr=r0*lerp(1,2.4,Math.pow(Math.random(),.7));
   pos[i*3]=Math.sin(ph)*Math.cos(th)*rr;pos[i*3+1]=Math.cos(ph)*rr;pos[i*3+2]=Math.sin(ph)*Math.sin(th)*rr;
   const h=Math.random();col[i*3]=1;col[i*3+1]=.25+h*.45;col[i*3+2]=.1+h*.2;}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));
  DEB.pts=new THREE.Points(g,new THREE.PointsMaterial({size:14,sizeAttenuation:true,vertexColors:true,transparent:true,opacity:.95,depthWrite:false}));
  DEB.grp.add(DEB.pts);
  for(let i=0;i<5;i++){const ch=new THREE.Mesh(new THREE.IcosahedronGeometry(r0*rnd(.05,.12),1),new THREE.MeshBasicMaterial({color:0xffa050}));
   ch.position.set(rnd(-1,1),rnd(-1,1),rnd(-1,1)).multiplyScalar(r0*1.2);DEB.grp.add(ch);
   DEB.chunks.push({m:ch,v:V3(rnd(-1,1),rnd(-1,1),rnd(-1,1)).multiplyScalar(r0*.05)});}
  const rg=new THREE.Mesh(new THREE.RingGeometry(.82,1,64),new THREE.MeshBasicMaterial({color:0xffc890,transparent:true,opacity:.8,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false}));
  rg.rotation.x=rnd(-.4,.4);DEB.grp.add(rg);DEB.ring=rg;}
 if(!silent){sfx('boom');SHK.t=3;SHK.amp=1.4;
  const fl=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:0xfff0c0,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
  fl.scale.setScalar(200);DEB.grp.add(fl);let ft=0;DEB.flash={m:fl,t:0};}}
function updateDebris(){if(!DEB.on)return;DEB.posU.copy(FL.earthPosKm).multiplyScalar(US);
 DEB.grp.scale.setScalar(1+Math.min(2.2,(T.t-FLG.goneT)/8000));
 DEB.pts.rotation.y+=T.dt*.02;
 for(const c of DEB.chunks){c.m.position.addScaledVector(c.v,T.dt);c.m.rotation.x+=T.dt*.3;c.m.rotation.y+=T.dt*.2;}
 if(DEB.ring){const a=Math.max(0,.8-(T.t-FLG.goneT)/240);DEB.ring.material.opacity=a;DEB.ring.scale.setScalar(200+(T.t-FLG.goneT)*40);}
 if(DEB.flash){DEB.flash.t+=T.dt;const k=DEB.flash.t;DEB.flash.m.scale.setScalar(200+k*4200);DEB.flash.m.material.opacity=Math.max(0,1.6-k*.7);
  if(k>2.6){DEB.grp.remove(DEB.flash.m);DEB.flash=null;}}}
const SHK={t:0,amp:0};
function shipWorldU(){if(MODE!=='surface'||!LF.body)return SP.pos;
 TMP3.copy(LF.qw).multiplyScalar(LF.body.r*US+((LAND&&LAND.alt)||0)/8000);return TMP3.add(LF.body.posU);}
