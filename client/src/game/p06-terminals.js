/* ═══════════════════════════════════════════════════════════════
   LAST LIGHT — source part 6/10: p06-terminals.js
   TERMINALS — NAV/SCAN/SYS/COM/fab/inv/bunk/dock/sign MFDs
   NOTE: all parts share one closure; tools/build.js concatenates
   p01..p10 in order into client/js/game.js (byte-identical).
   ═══════════════════════════════════════════════════════════════ */
/*==================== PART 5 — TERMINALS ====================*/
let MAPSYS='Sol',MAPSEL=null,MAPVIEW='sys',SCANST=null,FABQ=[];
function pwr(k){if(!POW.brk.main)return false;if(POW.batt<=0)return false;if(k&&k!=='main'&&!POW.brk[k])return false;return true;}
function openTerm(name){
 if(TERM){closeTerm(false);}
 if(!pwr(name==='com'?'nav':'nav')){toast('NO POWER — TERMINALS OFFLINE');sfx('deny');return;}
 TERM=name;clearHover();document.exitPointerLock&&document.exitPointerLock();
 $('term').style.display='flex';sfx('beep');renderTerm();}
function closeTerm(keep){TERM=null;$('term').style.display='none';
 if(keep!==false&&BOOTED&&!MENU&&!PAUSED&&!DEAD&&!(INTRO.on&&!INTRO.done)){try{const pl=renderer.domElement.requestPointerLock();if(pl&&pl.catch)pl.catch(()=>{});}catch(_){}}}
$('tx').onclick=closeTerm;
function renderTerm(){
 if(!TERM)return;const b=$('tbody');
 const T2={nav:'NAVIGATION',scan:'RESOURCE SURVEY',sys:'SHIP SYSTEMS',com:'COMMUNICATIONS',fab:'REFINERY',food:'FOOD PRINTER',inv:'INVENTORY',bunk:'CREW BUNK',station:'STATION DOCK',sign:'SIGN / BEACON'};
 $('ttitle').textContent=T2[TERM]||TERM;
 if(TERM==='nav')renderNav(b);
 else if(TERM==='scan')renderScan(b);
 else if(TERM==='sys')renderSys(b);
 else if(TERM==='com')renderCom(b);
 else if(TERM==='fab')renderFab(b);
  else if(TERM==='food')renderFood(b);
 else if(TERM==='inv')renderInv(b);
 else if(TERM==='bunk')renderBunk(b);
 else if(TERM==='station')renderStation(b);
 else if(TERM==='sign')renderSign(b);}
/*--------- NAV / star map ---------*/
function renderNav(b){
 let h='<div class="row"><span class="tab'+(MAPVIEW==='sys'?' on':'')+'" data-mv="sys">THIS SYSTEM</span><span class="tab'+(MAPVIEW==='gal'?' on':'')+'" data-mv="gal">UNIVERSE — EVERYTHING</span></div>';
 if(MAPVIEW==='sys'){h+='<div class="row">';
  h+='<select id="sysel" style="background:#08130d;color:#b8e8c8;border:1px solid #2f6f4f;padding:5px;font-family:inherit;max-width:460px">';
  for(const s in SYSTEMS)h+='<option value="'+s+'"'+(s===MAPSYS?' selected':'')+'>'+SYSTEMS[s].name+(s===FL.sys?'  ◄ YOU':'')+'</option>';
  h+='</select></div>';}
 h+='<div class="row" style="align-items:flex-start"><canvas id="mapcv" width="840" height="600" style="background:#040a07;border:1px solid #1d3a2a;cursor:crosshair;flex:0 0 auto;width:min(78%,calc(64vh*1.4));height:auto"></canvas><div id="mapinfo" style="flex:1;min-width:280px"></div></div>';
 b.innerHTML=h;
 b.querySelectorAll('[data-mv]').forEach(t=>t.onclick=()=>{MAPVIEW=t.dataset.mv;sfx('click');renderTerm();});
 b.querySelectorAll('[data-sys]').forEach(t=>t.onclick=()=>{MAPSYS=t.dataset.sys;MAPSEL=null;sfx('click');renderTerm();});
 const sel=b.querySelector('#sysel');if(sel)sel.onchange=()=>{MAPSYS=sel.value;MAPSEL=null;sfx('click');renderTerm();};
 const cv=b.querySelector('#mapcv');
 cv.onclick=e=>{const r=cv.getBoundingClientRect();
  const mx=(e.clientX-r.left)*(840/r.width),my=(e.clientY-r.top)*(600/r.height);
  let best=null,bd=30;const P=MAPVIEW==='sys'?mapPts():galPts();
  for(const p of P){if(p.noclick)continue;const d=Math.hypot(p.px-mx,p.py-my);if(d<bd){bd=d;best=p.sel;}}
  if(best){MAPSEL=MAPVIEW==='sys'?best.id:best;sfx('click');drawStarMap(cv);mapRow();}};
 drawStarMap(cv);mapRow();}
function mapPts(){const P=[];
 for(const bd of BODY){if(bd.sys!==MAPSYS)continue;
 if(!bd.a){P.push({b:bd,sel:bd,px:420,py:300,rr:0,cx:420,cy:300,orb:0});continue;}
  const rN=clamp((Math.log10(bd.a/1e6)-.8)/2.3,0,1);
  const rr=40+rN*238;
  let ang=bd.ang+2*Math.PI*T.t/((bd.per||1)*3600);
  let cx=420,cy=300,orb=rr;
  if(bd.par){const par=bodyById(bd.par);if(par&&par.sys===MAPSYS){const pn=P.find(x=>x.b.id===bd.par);
   if(pn){cx=pn.px;cy=pn.py;orb=12+2.6*bd.a/1e5;ang=ang%6.283;}}}
  P.push({b:bd,sel:bd,px:cx+Math.cos(ang)*orb,py:cy+Math.sin(ang)*orb,rr,cx,cy,orb});}
 for(const st of STATIONS)if(st.sys===MAPSYS){
  const a2=st.ang+2*Math.PI*T.t/((st.per||1)*3600);
  P.push({b:{name:st.name,t:'station',a:st.a,rot:0},sel:st.id,px:420+Math.cos(a2)*262,py:300+Math.sin(a2)*262,rr:0,cx:420,cy:300,orb:0});}
 return P;}
function drawStarMap(cv){
 if(MAPVIEW==='gal'){drawGalaxy(cv);return;}
 const c=cv.getContext('2d');c.fillStyle='#040a07';c.fillRect(0,0,840,600);
 c.strokeStyle='#12331f';c.fillStyle='#7dffa8';c.font='16px Consolas';
 const P=mapPts();
 for(const p of P){if(p.b.par||!p.b.a)continue;
  c.beginPath();c.arc(p.cx,p.cy,p.rr,0,7);c.stroke();}
 for(const p of P){if(p.b.par){c.strokeStyle='#12331f';c.beginPath();c.arc(p.cx,p.cy,p.orb,0,7);c.stroke();}
  const col=p.b.t==='star'?'#'+SYSTEMS[p.b.sys].c.toString(16).padStart(6,'0'):p.b.t==='station'?'#7fe0ff':(p.b.pal==='earth'||p.b.pal==='terra'?'#7db8ff':p.b.pal==='ice'?'#cfe8ff':p.b.pal==='lava'?'#ff8050':p.b.pal==='desert'?'#d8a050':'#b8a888');
  c.fillStyle=col;c.beginPath();c.arc(p.px,p.py,p.b.t==='star'?10:5,0,7);c.fill();
  c.fillStyle='#8ab89e';c.fillText(p.b.name,p.px+12,p.py+5);
  if(MAPSEL===p.b.id){c.strokeStyle='#ffb347';c.lineWidth=2.5;c.beginPath();c.arc(p.px,p.py,16,0,7);c.stroke();c.lineWidth=1;}}
 if(MODE==='space'&&MAPSYS===FL.sys){
  const sx=420,sy=300;
  c.strokeStyle='#9fe8ff';c.beginPath();c.moveTo(sx-9,sy);c.lineTo(sx+9,sy);c.moveTo(sx,sy-9);c.lineTo(sx,sy+9);c.stroke();
  c.fillStyle='#9fe8ff';c.fillText('KESTREL',sx+12,sy-9);}
 if(MAPSYS==='Sol'){
  const extras=[];
  for(const w of ANOM.wh)if(Math.hypot(w.pos[0],w.pos[1],w.pos[2])<5e13)extras.push(w);
  if(ANOM.voy)extras.push(ANOM.voy);
  for(const ex of extras){const ang=Math.atan2(ex.pos[2],ex.pos[0]);
   const px=420+Math.cos(ang)*278,py=300+Math.sin(ang)*228;
   c.strokeStyle='#12331f';c.setLineDash([3,5]);c.beginPath();c.moveTo(420,300);c.lineTo(px,py);c.stroke();c.setLineDash([]);
   c.strokeStyle=ex.c;c.beginPath();c.arc(px,py,8,0,7);c.stroke();
   c.fillStyle=ex.c;c.font='13px Consolas';c.fillText(ex.name.split(' ')[0]+' '+(ex.name.split(' ')[1]||''),px+12,py+4);}}
 c.fillStyle='#3a5a4a';c.fillText(MODE==='surface'?'LANDED ON '+LF.body.name.toUpperCase():FL.sys,10,588);}
function mapRow(){
 const el=$('mapinfo');if(!el)return;
 if(!MAPSEL){el.innerHTML='<div class="dim">SELECT ANY OBJECT ON THE MAP.<br><br>THE UNIVERSE TAB CHARTS EVERYTHING — GALAXIES, STARS, STATIONS, BLACK HOLES, WORMHOLES AND VOYAGER 1.</div>';return;}
 if(typeof MAPSEL==='object'){galRow(el);return;}
 const bd=bodyById(MAPSEL);
 if(!bd){const st=STATIONS.find(s2=>s2.id===MAPSEL);
  if(st){const dKm=SP.pos.distanceTo(st.posU)*8;
   el.innerHTML='<table><tr><th>STATION</th><th>SYSTEM</th><th>DISTANCE</th></tr><tr><td>'+st.name+'</td><td>'+SYSTEMS[st.sys].name+'</td><td>'+fmtD(dKm)+'</td></tr></table>'
    +'<div class="dim">DEEP-SPACE STATION — APPROACH SLOW (&lt;45 u/s) AND PRESS F WITHIN 14 u TO DOCK. MARKET · SERVICES · MOTHERSHIPS.</div>'
    +'<div class="row"><button class="btn" id="btgt">TARGET — SET COURSE</button></div>';
   $('btgt').onclick=()=>{setCourse('anom',{name:st.name,pos:[st.posKm.x,st.posKm.y,st.posKm.z],posU:st.posU,desc:'Deep-space station.',haz:'DOCK: SLOW AND CLOSE'},st.name);};
   return;}
  el.innerHTML='<div class="dim">SELECT ANY OBJECT ON THE MAP.</div>';return;}
 const distKm=MODE==='surface'?bd.posKm.distanceTo(LF.body.posKm):bd.posU.distanceTo(SP.pos)*8;
 const eta=SP.spd>1?distKm/(SP.spd*8):0;
 let h='<table><tr><th>BODY</th><th>TYPE</th><th>DISTANCE</th><th>DAY</th><th>GRAV</th><th>TEMP</th></tr>';
 h+='<tr><td>'+bd.name+'</td><td>'+(bd.t==='star'?'STAR':bd.t==='gas'?'GAS GIANT':'ROCK')+'</td><td>'+fmtK(distKm)+'</td><td>'+Math.abs(bd.rot||0).toFixed(1)+' h</td><td>'+(bd.g||'-')+' g</td><td>'+(bd.tk?bd.tk+' K':'-')+'</td></tr></table>';
 h+='<div class="dim">'+bd.desc+'</div><div class="red">'+(bd.haz||'')+'</div>';
 if(FL.scan[bd.id])h+='<div class="grn">SURVEY: '+resStr(bd)+'</div>';
 h+='<div class="row"><button class="btn" id="btgt">TARGET — SET COURSE</button><button class="btn" id="bplot">PLOT COURSE</button><span class="dim" id="plotnote"></span></div>';
 el.innerHTML=h;
 $('btgt').onclick=()=>{setCourse('body',bd,bd.name);};
 $('bplot').onclick=()=>{setCourse('body',bd,bd.name);
  if(MODE==='space'){
   TMP.copy(bd.posU).sub(SP.pos).normalize();
   shipAxes();
   const fwdDot=TMP.dot(SP.fwd);
   const deg=Math.acos(clamp(fwdDot,-1,1))*57.3;
   const side=TMP.dot(SP.rt)>0?'STARBOARD':'PORT';
   $('plotnote').textContent=deg<4?'ON COURSE':'TURN '+deg.toFixed(0)+'° '+side;}
  else{sfx('deny');$('plotnote').textContent='TAKE OFF FIRST';}};
}
/*--------- galaxy chart ---------*/
function galR(dKm){return 30+clamp(Math.log10(Math.max(1e12,dKm)/1e12),0,5.3)*48;}
function galPts(){
 const P=[];const cx=420,cy=300;
 const put=(name,posKm,extra)=>{const d=Math.hypot(posKm[0],posKm[1],posKm[2])||1;
  const r=galR(d),a=Math.atan2(posKm[2],posKm[0]);
  P.push(Object.assign({name,px:cx+Math.cos(a)*r,py:cy+Math.sin(a)*r,d},extra));return P[P.length-1];};
 for(const g of GAL)if(!g.home)put(g.name,g.ctr,{galblob:1,c:g.c,noclick:1});
 P.push({name:'SOL',px:cx,py:cy,d:0,sel:{kind:'sys',s:'Sol'},star:1,c:'#fff3d0'});
 for(const s in SYSTEMS){if(s==='Sol')continue;
  put(SYSTEMS[s].name,SYSTEMS[s].pos,{sel:{kind:'sys',s},star:1,c:'#'+SYSTEMS[s].c.toString(16).padStart(6,'0')});}
 for(const b of ANOM.bh)put(b.name,b.pos,{sel:{kind:'anom',a:b},bh:1,c:'#ff8040'});
 for(const n of ANOM.neb)put(n.name,n.pos,{sel:{kind:'anom',a:n},neb:1,c:n.c});
 for(const w of ANOM.wh){const e=put(w.name,w.pos,{sel:{kind:'anom',a:w},wh:1,c:w.c});w._p=e;}
 if(ANOM.voy)put('VOYAGER 1',ANOM.voy.pos,{sel:{kind:'anom',a:ANOM.voy},voy:1,c:'#ffd9a0'});
 put('KESTREL',[SP.pos.x*8,SP.pos.y*8,SP.pos.z*8],{ship:1,noclick:1});
 return P;}
function drawGalaxy(cv){
 const c=cv.getContext('2d'),cx=420,cy=300;
 c.fillStyle='#040a07';c.fillRect(0,0,840,600);
 c.strokeStyle='#0e2a1c';c.font='13px Consolas';
 for(const ly of[10,50,250,1000,10000,100000]){const rr=galR(ly*9.46e12);
  c.beginPath();c.arc(cx,cy,rr,0,7);c.stroke();
  c.fillStyle='#3a5a4a';c.fillText(ly+' ly',cx+rr*.68,cy-rr*.72);}
 const P=galPts();
 for(const p of P)if(p.galblob){const g2=c.createRadialGradient(p.px,p.py,4,p.px,p.py,64);
  g2.addColorStop(0,p.c);g2.addColorStop(1,'rgba(0,0,0,0)');c.globalAlpha=.22;c.fillStyle=g2;
  c.beginPath();c.arc(p.px,p.py,64,0,7);c.fill();c.globalAlpha=1;}
 for(const p of P)if(p.neb){const g=c.createRadialGradient(p.px,p.py,2,p.px,p.py,48);
  g.addColorStop(0,p.c);g.addColorStop(1,'rgba(0,0,0,0)');c.globalAlpha=.3;c.fillStyle=g;
  c.beginPath();c.arc(p.px,p.py,48,0,7);c.fill();c.globalAlpha=1;}
 c.setLineDash([6,6]);
 for(let i=0;i<ANOM.wh.length;i++){const a=ANOM.wh[i],b2=ANOM.wh[a.link];
  if(a._p&&b2._p){c.strokeStyle=a.c;c.beginPath();c.moveTo(a._p.px,a._p.py);c.lineTo(b2._p.px,b2._p.py);c.stroke();}}
 let tp=null;
 if(COURSE){
  if(COURSE.kind==='body')tp=COURSE.ref.posKm;
  else if(COURSE.kind==='anom')tp=COURSE.ref.pos;
  else{const st=BODY.find(x=>x.sys===COURSE.ref&&x.t==='star'&&!x.par);tp=st?st.posKm:null;}}
 const shipP=P.find(p=>p.ship);
 if(tp&&shipP){const dd=Math.hypot(tp[0],tp[1],tp[2])||1,rr=galR(dd),aa=Math.atan2(tp[2],tp[0]);
  c.strokeStyle='#ffb347';c.setLineDash([4,5]);c.beginPath();c.moveTo(shipP.px,shipP.py);c.lineTo(cx+Math.cos(aa)*rr,cy+Math.sin(aa)*rr);c.stroke();}
 c.setLineDash([]);
 for(const p of P){
  if(p.bh){c.fillStyle='#000';c.beginPath();c.arc(p.px,p.py,7,0,7);c.fill();
   c.strokeStyle='#ff8040';c.lineWidth=2;c.beginPath();c.arc(p.px,p.py,7,0,7);c.stroke();c.lineWidth=1;}
  else if(p.wh){c.strokeStyle=p.c;c.beginPath();c.arc(p.px,p.py,5,0,7);c.stroke();c.beginPath();c.arc(p.px,p.py,10,0,7);c.stroke();}
  else if(p.voy){c.fillStyle=p.c;c.beginPath();c.moveTo(p.px,p.py-8);c.lineTo(p.px+6,p.py);c.lineTo(p.px,p.py+8);c.lineTo(p.px-6,p.py);c.closePath();c.fill();}
  else if(p.star){c.fillStyle=p.c||'#fff3d0';c.beginPath();c.arc(p.px,p.py,8,0,7);c.fill();}
  else if(p.ship){c.strokeStyle='#9fe8ff';c.beginPath();c.moveTo(p.px-9,p.py);c.lineTo(p.px+9,p.py);c.moveTo(p.px,p.py-9);c.lineTo(p.px,p.py+9);c.stroke();}
  c.fillStyle=p.ship?'#9fe8ff':'#8ab89e';c.font='13px Consolas';
  c.fillText(p.name,p.px+11,p.py+4);
  if(MAPSEL&&typeof MAPSEL==='object'&&p.sel&&p.sel.kind===MAPSEL.kind){
   const m=(MAPSEL.kind==='sys'&&p.sel.s===MAPSEL.s)||(MAPSEL.kind==='anom'&&p.sel.a===MAPSEL.a);
   if(m){c.strokeStyle='#ffb347';c.lineWidth=2.5;c.beginPath();c.arc(p.px,p.py,16,0,7);c.stroke();c.lineWidth=1;}}}
 c.fillStyle='#3a5a4a';c.fillText('UNIVERSE CHART · LOG-POLAR · 4 GALAXIES · '+Object.keys(SYSTEMS).length+' SYSTEMS · RINGS 10 ly → 100 kly',10,588);}
function galRow(el){
 const k=MAPSEL;let name,desc='',haz='',distKm=0,kindTxt='';
 if(k.kind==='sys'){const s=SYSTEMS[k.s];name=s.name;kindTxt='STAR SYSTEM';
  const st=BODY.find(x=>x.sys===k.s&&x.t==='star'&&!x.par);
  distKm=st?SP.pos.distanceTo(st.posU)*8:0;
  desc='Charted system in the '+(GAL.find(g=>g.id===SYSTEMS[k.s].gal)||GAL[0]).name+'. '+(st?st.desc:'');haz='TARGET IT · CHARGE J ≥80% · RELEASE = TRUE HYPER JUMP';}
 else{const a=k.a;name=a.name;distKm=SP.pos.distanceTo(a.posU)*8;
  if(a.r){kindTxt='BLACK HOLE';desc=a.desc;haz=a.haz;}
  else if(a.R){kindTxt='NEBULA';desc=a.desc;haz=a.haz;}
  else if(a.link!==undefined){kindTxt='WORMHOLE';desc=a.desc;haz=a.haz;}
  else{kindTxt='RELIC PROBE';desc=a.desc;haz=a.haz;}}
 let h='<table><tr><th>OBJECT</th><th>TYPE</th><th>DISTANCE</th></tr>';
 h+='<tr><td>'+name+'</td><td>'+kindTxt+'</td><td>'+fmtD(distKm)+'</td></tr></table>';
 h+='<div class="dim">'+desc+'</div>'+(haz?'<div class="red">'+haz+'</div>':'');
 h+='<div class="row"><button class="btn" id="btgt">TARGET — SET COURSE</button><span class="dim" id="plotnote"></span></div>';
 h+='<div class="dim">SET COURSE → FOLLOW THE HUD ARROW · N OR ALIGN SWITCH = AUTO-TURN</div>';
 el.innerHTML=h;
 $('btgt').onclick=()=>{if(MAPSEL.kind==='sys')setCourse('sys',MAPSEL.s,SYSTEMS[MAPSEL.s].name);else setCourse('anom',MAPSEL.a,MAPSEL.a.name);};}
function resStr(bd){const r=bd.res||{};const p=[];if(r.ice)p.push('ICE '+r.ice);if(r.ore)p.push('ORE '+r.ore);if(r.exo)p.push('EXOTIC '+r.exo);if(r.org)p.push('ORGANICS '+r.org);return p.length?p.join(' · '):'NONE';}
/*--------- SCAN ---------*/
function renderScan(b){
 let h='<h3>ORBITAL RESOURCE SURVEY</h3><div class="row">';
 const cands=BODY.filter(x=>x.sys===FL.sys&&x.t!=='star');
 h+='<select id="scsel" style="background:#08130d;color:#b8e8c8;border:1px solid #2f6f4f;padding:5px;font-family:inherit">';
 for(const c of cands)h+='<option value="'+c.id+'"'+(MAPSEL===c.id?' selected':'')+'>'+c.name+'</option>';
 h+='</select><button class="btn" id="scgo">RUN SURVEY</button></div><div id="scout">';
 h+='</div>';b.innerHTML=h;
 $('scgo').onclick=()=>{const id=$('scsel').value;const bd=bodyById(id);
  if(bd.t==='gas'){toast('NO SOLID SURFACE — CANNOT SURVEY');sfx('deny');return;}
  SCANST={id,t:0};sfx('beep');$('scgo').classList.add('dis');};
 scanOut();}
function scanOut(){
 const el=$('scout');if(!el)return;
 if(SCANST){el.innerHTML='<div class="amb">SCANNING '+bodyName(SCANST.id)+' … '+Math.floor(SCANST.t*100)+'%</div><div class="bar" style="width:300px;border:1px solid #1d3a2a"><i style="background:#7dffa8;width:'+Math.floor(SCANST.t*100)+'%"></i></div>';return;}
 if(!MAPSEL){el.innerHTML='<div class="dim">SELECT A WORLD AND RUN THE SURVEY. SCAN BEFORE YOU LAND.</div>';return;}
 const bd=bodyById(MAPSEL);
 if(!FL.scan[bd.id]){el.innerHTML='<div class="dim">'+bd.name+' NOT YET SURVEYED.</div>';return;}
 let h='<table><tr><th>'+bd.name+'</th><th>VALUE</th></tr>';
 h+='<tr><td>GRAVITY</td><td>'+(bd.g||'?')+' g</td></tr>';
 h+='<tr><td>DAY LENGTH</td><td>'+Math.abs(bd.rot).toFixed(1)+' h'+((bd.rot||0)<0?' (RETROGRADE)':'')+'</td></tr>';
 h+='<tr><td>MEAN TEMP</td><td>'+(bd.tk-273).toFixed(0)+' °C</td></tr>';
 h+='<tr><td>ATMOSPHERE</td><td>'+(bd.at?bd.at+' km':'NONE')+'</td></tr>';
 h+='<tr><td>RESOURCES</td><td>'+resStr(bd)+'</td></tr>';
 h+='<tr><td>HAZARDS</td><td class="red">'+(bd.haz||'NONE')+'</td></tr></table>';
 h+='<div class="grn">LANDING ADVISORY: '+(bd.g>11?'HIGH GRAVITY — KEEP DESCENT SLOW':bd.tk>500?'SURFACE MOLTEN — SUIT WILL FAIL':bd.tk<150?'EXTREME COLD — MINE FAST, RETURN OFTEN':'NOMINAL LANDING PROFILE')+'</div>';
 el.innerHTML=h;}
function scanTick(dt){if(!SCANST)return;SCANST.t+=dt/4;
 if(SCANST.t>=1){FL.scan[SCANST.id]=true;MAPSEL=SCANST.id;toast('SURVEY COMPLETE — '+bodyName(SCANST.id),1);sfx('pickup');SCANST=null;
  if(TERM==='scan')renderTerm();}
 else if(TERM==='scan')scanOut();}
/*--------- SYS ---------*/
function renderSys(b){
 let h='<h3>SYSTEMS STATUS</h3><table><tr><th>SYSTEM</th><th>STATUS</th><th></th></tr>';
 const sd=SYSD,nm={hull:'HULL',eng:'ENGINES',rea:'REACTOR',lif:'LIFE SUPPORT',avo:'AVIONICS'};
 for(const k in sd){const v=Math.round(sd[k]);
  h+='<tr><td>'+nm[k]+'</td><td style="color:'+(v>60?'#7dffa8':v>30?'#ffb347':'#ff7d7d')+'">'+v+'%</td><td><button class="btn'+(v>=100||INV.parts<1?' dis':'')+'" data-rep="'+k+'">REPAIR (1 PART)</button></td></tr>';}
 h+='</table>';
 h+='<h3>POWER</h3><table><tr><th>SOURCE</th><th>STATE</th></tr>';
 h+='<tr><td>REACTOR</td><td class="'+(POW.rea.on?'grn':'red')+'">'+(POW.rea.on?'ONLINE':'OFFLINE')+(POW.rea.scram>0?' — SCRAM '+fmtT(POW.rea.scram):'')+'</td></tr>';
 h+='<tr><td>BATTERY</td><td>'+Math.round(POW.batt)+'%</td></tr>';
 h+='<tr><td>REACTOR WATER</td><td class="'+(POW.rea.water<25?'red':'')+'">'+Math.round(POW.rea.water)+'%'+(POW.rea.water<25?' — INJECT DAILY!':'')+'</td></tr></table>';
 h+='<div class="row"><button class="btn'+(INV.water<10?' dis':'')+'" id="sinj">INJECT 10 L WATER</button><button class="btn'+(POW.rea.scram<=0||INV.exo<1?' dis':'')+'" id="sscr">EXOTIC JUMP-START (1 EXO)</button></div>';
 h+='<div class="row"><button class="btn" id="sgear">LANDING GEAR: '+(GEARST.tgt>0?'DOWN':'UP')+'</button><button class="btn" id="salign">AUTO-ALIGN: '+(SRF.align?'ON':'OFF')+'</button></div>';
 h+='<div class="dim">BREAKERS ON PORT WALL · REACTOR PANEL STARBOARD · AMP SWITCH OVERHEAD · G = GEAR · N = ALIGN</div>';
 h+='<h3>TELEMETRY</h3><table><tr><th>FIELD</th><th>VALUE</th></tr>';
 h+='<tr><td>SYSTEM</td><td>'+SYSTEMS[FL.sys].name+'</td></tr>';
 h+='<tr><td>GALAXY</td><td>'+(GAL.find(g=>g.id===SYSTEMS[FL.sys].gal)||GAL[0]).name+'</td></tr>';
 {const ns2=nearestStar(SP.pos);h+='<tr><td>NEAREST STAR</td><td>'+(ns2.b?ns2.b.name+' — '+fmtD(ns2.d*8):'-')+'</td></tr>';}
 {const stn=nearestStation();h+='<tr><td>STATION</td><td>'+(stn?stn.st.name+' — '+fmtD(stn.d*8):'NONE IN SYSTEM')+'</td></tr>';}
 h+='<tr><td>VELOCITY</td><td>'+fmtK(SP.spd*8)+'/s'+(SP.spd*8>3e5?' ('+(SP.spd*8/299792).toFixed(2)+'c)':'')+'</td></tr>';
 h+='<tr><td>POSITION (u)</td><td>'+SP.pos.x.toFixed(0)+' / '+SP.pos.y.toFixed(0)+' / '+SP.pos.z.toFixed(0)+'</td></tr>';
 h+='<tr><td>FROM SOL</td><td>'+fmtD(SP.pos.length()*8)+'</td></tr>';
 h+='<tr><td>PILOTS</td><td>'+(NET.on?netCount()+' ON THE BAND'+(window.MP&&window.MP.rtt!=null?' · RTT '+window.MP.rtt+' ms':''):'OFFLINE — MENU ▸ MULTIPLAYER')+'</td></tr>';
 h+='<tr><td>STRUCTURES</td><td>'+FL.builds.length+' BUILT</td></tr></table>';
 h+='<h3>POWER ALLOCATION</h3><div class="row">';
 for(const k of['eng','nav','life'])h+='<span style="margin-right:14px">'+k.toUpperCase()+' <input type="range" class="sld" data-alloc="'+k+'" min="50" max="200" value="'+Math.round((FL.alloc?FL.alloc[k]:1)*100)+'"> <span id="al'+k+'">'+Math.round((FL.alloc?FL.alloc[k]:1)*100)+'%</span></span>';
 h+='</div><div class="dim">ENG: THRUST ACCEL · NAV: ALIGN SPEED · LIFE: O2 SCRUBBERS — ALL DRAWN FROM THE SAME REACTOR</div>';
 h+='<h3>LOGIC WIRING — SOURCE ▸ SINK</h3><table><tr><th></th>';
 for(const s2 of WSNKS)h+='<th>'+s2[1]+'</th>';
 h+='</tr>';
 for(const src of WSRCS){h+='<tr><td>'+src[1]+'</td>';
  for(const snk of WSNKS)h+='<td style="text-align:center"><span class="qbtn'+(wireHas(src[0],snk[0])?' on':'')+'" data-wire="'+src[0]+'|'+snk[0]+'">'+(wireHas(src[0],snk[0])?'●':'○')+'</span></td>';
  h+='</tr>';}
 h+='</table><div class="dim">DEFAULT: AIRLOCK + O2 WIRED TO LIGHTS / SIREN / HUD. CLICK CELLS TO RE-WIRE. OPEN THE RAMP IN SPACE AND SEE WHAT HAPPENS.</div>';
 b.innerHTML=h;
 b.querySelectorAll('[data-rep]').forEach(btn=>btn.onclick=()=>{const k=btn.dataset.rep;
  if(SYSD[k]>=100||INV.parts<1)return;INV.parts-=1;SYSD[k]=clamp(SYSD[k]+35,0,100);sfx('thud');toast(nm[k]+' REPAIRED +35%');renderTerm();});
 $('sinj').onclick=injectWater;$('sscr').onclick=scramReset;
 $('sgear').onclick=()=>{toggleGear();renderTerm();};
 $('salign').onclick=()=>{SRF.align=!SRF.align;sfx('beep');renderTerm();};
 b.querySelectorAll('[data-wire]').forEach(el=>el.onclick=()=>{
  const pr=el.dataset.wire.split('|');
  const i2=(FL.wire||[]).findIndex(w=>w.s===pr[0]&&w.d===pr[1]);
  if(i2>=0)FL.wire.splice(i2,1);else(FL.wire=FL.wire||[]).push({s:pr[0],d:pr[1]});
  sfx('sw');renderTerm();});
 b.querySelectorAll('[data-alloc]').forEach(el=>el.oninput=()=>{
  FL.alloc[el.dataset.alloc]=+el.value/100;
  const lbl=$('al'+el.dataset.alloc);if(lbl)lbl.textContent=el.value+'%';});}
/*--------- COM ---------*/
function renderCom(b){
 let h='<h3>DEEP SPACE COMMS</h3><div class="row"><input type="text" id="cmsg" style="flex:1" placeholder="BROADCAST MESSAGE…" maxlength="120"><button class="btn" id="csend">BROADCAST</button>';
 const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(SR)h+='<button class="btn" id="cmic">MIC</button>';
 h+='</div><div class="dim">BEACONS MAY ATTRACT SUPPLY DROPS… OR NOTHING AT ALL. RANGE: LIGHT HOURS.'+(NET.on?'':' · OFFLINE — MAIN MENU ▸ MULTIPLAYER FOR THE GLOBAL BAND')+'</div>';
 if(NET.on&&NET.world){
  h+='<h3>GLOBAL BAND — '+netCount()+' PILOTS</h3><div style="max-height:170px;overflow-y:auto">';
  const chat=NET.world.chat;
  for(let i=chat.length-1;i>=0&&i>chat.length-9;i--)h+='<div class="dim">['+chat[i].who+'] '+String(chat[i].m).slice(0,80)+'</div>';
  if(!chat.length)h+='<div class="dim">…band quiet…</div>';
  h+='</div>';}
 h+='<h3>TRAFFIC LOG</h3><div id="clog">';
 for(let i=FL.log.length-1;i>=0&&i>FL.log.length-9;i--)h+='<div class="dim">['+fmtT(FL.log[i].t)+'] '+FL.log[i].m+'</div>';
 if(!FL.log.length)h+='<div class="dim">SILENCE.</div>';
 h+='</div>';b.innerHTML=h;
 $('csend').onclick=()=>{const v=$('cmsg').value.trim();if(!v)return;
  FL.log.push({t:T.t,m:'TX: '+v});sfx('beep');toast('BROADCAST SENT');
  if(NET.on&&window.MP)window.MP.chatSend(v);
  if(!FL.supQ&&Math.random()<.75){FL.supQ={at:T.t+rnd(1800,5400)};toast('…Faint reply detected on the band.',1);}
  renderTerm();};
 if(SR&&$('cmic'))$('cmic').onclick=()=>{const r=new SR();r.lang='en-US';r.interimResults=false;
  r.onresult=e=>{$('cmsg').value=e.results[0][0].transcript;};r.onerror=()=>toast('MIC ERROR');r.start();toast('LISTENING…');};}
function comTick(){
 if(FL.supQ&&T.t>=FL.supQ.at){
  FL.supQ=null;
  if(MODE==='surface'&&TER&&LF.body.res&&(LF.body.res.parts||true)){
   spawnCache();FL.log.push({t:T.t,m:'RX: SUPPLY DROP INBOUND — CRATE BEACON ACTIVE'});
   toast('SUPPLY DROP DETECTED — FOLLOW THE MARKER',1);}
  else FL.log.push({t:T.t,m:'RX: …static…'});}}
/*--------- FAB ---------*/
function renderFab(b){
 let h='<h3>REFINERY & FABRICATION</h3><table><tr><th>STOCK</th><th>QTY</th></tr>';
 h+='<tr><td>ICE</td><td>'+Math.floor(INV.ice)+'</td></tr><tr><td>ORE</td><td>'+Math.floor(INV.ore)+'</td></tr>';
 h+='<tr><td>METAL</td><td>'+Math.floor(INV.metal)+'</td></tr><tr><td>EXOTIC MATTER</td><td>'+Math.floor(INV.exo)+'</td></tr></table>';
 h+='<div class="row"><button class="btn'+(INV.ice<5?' dis':'')+'" id="fmelt">MELT 5 ICE → 5 L WATER</button>';
 h+='<button class="btn'+(INV.ore<5?' dis':'')+'" id="fsmelt">SMELT 5 ORE → 2 METAL</button></div>';
 h+='<div class="row"><button class="btn'+(INV.metal<4?' dis':'')+'" id="fpart">FABRICATE PART (4 METAL)</button></div>';
 if(FABQ.length){h+='<h3>QUEUE</h3>';for(const q of FABQ)h+='<div class="amb">'+q.n+' … '+Math.floor(q.t*100)+'%</div>';}
 h+='<div class="dim">POWER REQUIRED — REACTOR OR BATTERY · RATIONS PRINT AT THE FOOD PRINTER (LIVING BAY)</div>';
 b.innerHTML=h;
 $('fmelt').onclick=()=>fab('MELTING ICE','ice',()=>{INV.ice-=5;INV.water+=5;});
 $('fsmelt').onclick=()=>fab('SMELTING ORE','ore',()=>{INV.ore-=5;INV.metal+=2;});
 $('fpart').onclick=()=>fab('FABRICATING PART','part',()=>{INV.metal-=4;INV.parts+=1;});}
function renderFood(b){
 let h='<h3>FOOD PRINTER</h3><table><tr><th>STOCK</th><th>QTY</th></tr>';
 h+='<tr><td>WATER (L)</td><td>'+INV.water.toFixed(1)+'</td></tr>';
 h+='<tr><td>RATIONS</td><td>'+Math.floor(INV.food)+'</td></tr></table>';
 h+='<div class="row"><button class="btn" id="fcond">CONDENSE +5 L WATER (FREE)</button>';
 h+='<button class="btn" id="fcond20">CONDENSE +20 L (FREE)</button></div>';
 h+='<div class="row"><button class="btn" id="fprint">PRINT RATION (FREE)</button></div>';
 if(FABQ.length){h+='<h3>QUEUE</h3>';for(const q of FABQ)h+='<div class="amb">'+q.n+' … '+Math.floor(q.t*100)+'%</div>';}
 h+='<div class="dim">ATMOSPHERIC CONDENSER ONLINE — WATER AND RATIONS ARE FREE. THE REACTOR TANK STILL DRINKS: INJECT DAILY.</div>';
 b.innerHTML=h;
 $('fcond').onclick=()=>fab('CONDENSING WATER','cond',()=>{INV.water+=5;});
 $('fcond20').onclick=()=>fab('CONDENSING WATER','cond',()=>{INV.water+=20;});
 $('fprint').onclick=()=>fab('PRINTING RATION','print',()=>{INV.food+=1;});}
function fab(n,k,fn){
 const has={ice:INV.ice>=5,ore:INV.ore>=5,print:true,cond:true,part:INV.metal>=4}[k];
 if(!has||!pwr('main')){sfx('deny');toast(has?'NO POWER':'INSUFFICIENT MATERIALS');return;}
 fn();FABQ.push({n,t:0});sfx('beep');renderTerm();}
function fabTick(dt){
 for(let i=FABQ.length-1;i>=0;i--){FABQ[i].t+=dt/(FABQ[i].n.indexOf('PART')>=0?8:4);
  if(FABQ[i].t>=1){toast(FABQ[i].n+' DONE');sfx('pickup');FABQ.splice(i,1);
   if(TERM==='fab'||TERM==='food')renderTerm();}}}
/*--------- INVENTORY / BUNK ---------*/
function renderInv(b){
 let h='<h3>INVENTORY · '+Math.round(FL.cr)+' CR</h3><div class="igrid">';
 const IT=[['water','H2O','#7fd4ff'],['food','RAT','#ffd9a0'],['ice','ICE','#cfe8ff'],['ore','ORE','#c9a06a'],['metal','MET','#b8c4cc'],['exo','EXO','#ff8ad0'],['parts','PRT','#9fe8b8']];
 for(const it of IT){const q=it[0]==='water'?INV.water.toFixed(1):String(Math.floor(INV[it[0]]||0));
  h+='<span class="islot" data-it="'+it[0]+'"><em style="color:'+it[2]+'">'+it[1]+'</em><span class="q">×'+q+'</span></span>';}
 h+='<span class="islot"><em style="color:#ffb347">GEAR</em><span class="q">5 TOOLS</span></span></div>';
 h+='<div id="idetail" class="dim" style="margin:6px 0">CLICK A SLOT — WATER AND RATIONS CAN BE USED.</div>';
 h+='<h3>DEEP SPACE DEPLOYMENT</h3><div class="row">';
 for(const k of['beacon','sign','solar','lamp','printer']){const P=PARTS[k];
  h+='<button class="btn'+(MODE==='space'&&canAfford(P.cost)?'':' dis')+'" data-dep="'+k+'">'+P.n+' ('+costStr(P.cost)+')</button>';}
 h+='</div><div class="dim">DEPLOYS OFF THE BOW IN OPEN SPACE — STRUCTURES PERSIST IN THE WORLD FOREVER. SURFACE BASES: BUILD MODE [B] ON FOOT.</div>';
 b.innerHTML=h;
 b.querySelectorAll('[data-it]').forEach(el=>el.onclick=()=>{const k=el.dataset.it;
  const d2=({water:'DRINK 0.5 L',food:'EAT RATION'})[k]||'RAW MATERIAL — SELL AT STATIONS OR REFINE';
  $('idetail').innerHTML=k.toUpperCase()+' — '+d2+' <button class="btn" data-use2="'+k+'">USE</button>';
  const ub=$('idetail').querySelector('[data-use2]');
  if(ub)ub.onclick=()=>{
   if(k==='water'&&INV.water>=.5){INV.water-=.5;VIT.thi=clamp(VIT.thi+40,0,100);sfx('pickup');toast('DRANK 0.5 L');}
   else if(k==='food'&&INV.food>=1){INV.food-=1;VIT.hun=clamp(VIT.hun+45,0,100);sfx('pickup');toast('RATION CONSUMED');}
   else sfx('deny');
   renderTerm();};});
 b.querySelectorAll('[data-dep]').forEach(el=>el.onclick=()=>{deploySpace(el.dataset.dep);renderTerm();});}
function renderBunk(b){
 let h='<h3>CREW BUNK</h3><div class="dim">Sleep advances the clock. Vitals drain slowly while you sleep.</div>';
 h+='<div class="row"><button class="btn" id="bsleep">SLEEP UNTIL SAFE LIGHT</button><button class="btn" id="bsave">SAVE GAME</button></div>';
 h+='<div class="row dim" id="binfo"></div>';
 b.innerHTML=h;
 const info=$('binfo');
 info.textContent=MODE==='surface'?('LOCAL SOLAR TIME '+Math.floor(LF.lst)+':'+('0'+Math.floor(LF.lst%1*60)).slice(-2)):('SHIP TIME '+fmtT(T.t));
 $('bsave').onclick=()=>{saveGame();renderTerm();};
 $('bsleep').onclick=()=>{
  let adv;
  if(MODE==='surface'){const h2=LF.lst;let dh=(6.5-h2+24)%24;if(dh<1)dh+=24;adv=dh/24*Math.abs(LF.body.rot)*3600;}
  else adv=6*3600;
  T.t+=adv;
  const days=adv/86400;
  VIT.hun=clamp(VIT.hun-days*33,0,100);VIT.thi=clamp(VIT.thi-days*50,0,100);
  if(POW.rea.on){POW.rea.water=clamp(POW.rea.water-days*100,0,100);
   if(POW.rea.water<=0){POW.rea.on=false;POW.rea.scram=20*86400;toast('YOU WOKE TO A SCRAMMED REACTOR',1);sfx('deny');}}
  VIT.suit=100;VIT.cab=100;VIT.hp=clamp(VIT.hp+12,0,100);
  saveGame(true);sfx('beep');toast('SLEPT '+fmtT(adv)+' — GAME SAVED');
  closeTerm();};}
