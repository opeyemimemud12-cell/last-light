/* ═══════════════════════════════════════════════════════════════
   LAST LIGHT — source part 3/10: p03-universe.js
   TEXTURES, UNIVERSE, PLANETS — glow/label textures, shaders, body meshes
   NOTE: all parts share one closure; tools/build.js concatenates
   p01..p10 in order into client/js/game.js (byte-identical).
   ═══════════════════════════════════════════════════════════════ */
/*==================== PART 3 — TEXTURES, UNIVERSE, PLANETS ====================*/
function hxc(h){if(typeof h==='number')h='#'+h.toString(16).padStart(6,'0');return[parseInt(h.slice(1,3),16)/255,parseInt(h.slice(3,5),16)/255,parseInt(h.slice(5,7),16)/255];}
function hashId(s){let h=7;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return h%99991;}
function mkn3(seed){const h=(x,y,z)=>{let n=(x*374761393+y*668265263+z*1440662683+seed*97)|0;n=(n^(n>>>13))*1274126177|0;n=n^(n>>>16);return((n>>>0)%10000)/10000;};
 return(x,y,z)=>{const xi=Math.floor(x),yi=Math.floor(y),zi=Math.floor(z),xf=x-xi,yf=y-yi,zf=z-zi;
 const u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf),w=zf*zf*(3-2*zf);
 const a=lerp(h(xi,yi,zi),h(xi+1,yi,zi),u),b=lerp(h(xi,yi+1,zi),h(xi+1,yi+1,zi),u),c=lerp(h(xi,yi,zi+1),h(xi+1,yi,zi+1),u),d=lerp(h(xi,yi+1,zi+1),h(xi+1,yi+1,zi+1),u);
 return lerp(lerp(a,b,v),lerp(c,d,v),w);};}
function fbm3(n,x,y,z,o){let a=.5,f=1,s=0,t=0;for(let i=0;i<o;i++){s+=a*n(x*f,y*f,z*f);t+=a;a*=.5;f*=2.02;}return s/t;}
function glowTexture(){const cv=document.createElement('canvas');cv.width=cv.height=128;const cx=cv.getContext('2d');
 const g=cx.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.25,'rgba(255,255,255,.55)');g.addColorStop(.6,'rgba(255,255,255,.12)');g.addColorStop(1,'rgba(255,255,255,0)');
 cx.fillStyle=g;cx.fillRect(0,0,128,128);return new THREE.CanvasTexture(cv);}
const GLOW=glowTexture();
function makeLabel(txt,w,h,col,bgc,fs){const cv=document.createElement('canvas');cv.width=256;cv.height=Math.max(32,Math.round(256*h/w));const cx=cv.getContext('2d');
 if(bgc){cx.fillStyle=bgc;cx.fillRect(0,0,cv.width,cv.height);}
 cx.font='bold '+Math.round((fs||30)*(cv.height/64))+'px Consolas,monospace';cx.textAlign='center';cx.textBaseline='middle';
 cx.fillStyle=col||'#ffd9a0';cx.fillText(txt,cv.width/2,cv.height/2+1);
 const tx=new THREE.CanvasTexture(cv);tx.colorSpace=THREE.SRGBColorSpace;
 const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tx,transparent:true,depthWrite:false}));return m;}
/*------------ body construction ------------*/
const BODY=[];
const BSTAR={};
const UNI=new THREE.Group();scene.add(UNI);
/* seeded PRNG — the cosmic structure stays fixed & persistent */
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function seedVec(id){const s=mulberry32(((hashId(id)||1)^Math.imul(SET.useed||777,2654435761))>>>0);return V3(s()*41-20,s()*41-20,s()*41-20);}
/* --- GLSL: Ashima 3D simplex noise + fBm --- */
const GLSL_NOISE=`
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
 const vec2 C=vec2(1./6.,1./3.);
 const vec4 D=vec4(0.,.5,1.,2.);
 vec3 i=floor(v+dot(v,C.yyy));
 vec3 x0=v-i+dot(i,C.xxx);
 vec3 g=step(x0.yzx,x0.xyz);
 vec3 l=1.-g;
 vec3 i1=min(g.xyz,l.zxy);
 vec3 i2=max(g.xyz,l.zxy);
 vec3 x1=x0-i1+C.xxx;
 vec3 x2=x0-i2+C.yyy;
 vec3 x3=x0-D.yyy;
 i=mod289(i);
 vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
 float n_=0.142857142857;
 vec3 ns=n_*D.wyz-D.xzx;
 vec4 j=p-49.*floor(p*ns.z*ns.z);
 vec4 x_=floor(j*ns.z);
 vec4 y_=floor(j-7.*x_);
 vec4 x=x_*ns.x+ns.yyyy;
 vec4 y=y_*ns.x+ns.yyyy;
 vec4 h=1.-abs(x)-abs(y);
 vec4 b0=vec4(x.xy,y.xy);
 vec4 b1=vec4(x.zw,y.zw);
 vec4 s0=floor(b0)*2.+1.;
 vec4 s1=floor(b1)*2.+1.;
 vec4 sh=-step(h,vec4(0.));
 vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
 vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
 vec3 p0=vec3(a0.xy,h.x);
 vec3 p1=vec3(a0.zw,h.y);
 vec3 p2=vec3(a1.xy,h.z);
 vec3 p3=vec3(a1.zw,h.w);
 vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
 p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
 vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);
 m=m*m;
 return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));}
float fbm(vec3 p){float a=.5,f=1.,s=0.,t=0.;for(int i=0;i<5;i++){s+=a*snoise(p*f);t+=a;a*=.5;f*=2.03;}return s/t;}
`;
const PLANT_VS=`varying vec3 vN;varying vec3 vNW;varying vec3 vWP;
void main(){vN=normalize(position);vNW=normalize(mat3(modelMatrix)*normal);vWP=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const PLANT_FS=GLSL_NOISE+`
uniform vec3 uSeed,uSeaCol,uLo,uHi,uPk,uStarC,uSunD,uCamP;
uniform float uMode,uFreq,uSeaL,uNightAmt,uLava,uTime;
varying vec3 vN,vNW,vWP;
void main(){
 vec3 p=vN;
 vec3 L=normalize(uSunD);
 if(uMode>2.5){ /* star: granulation + limb darkening */
  float g=fbm(p*5.5+uSeed+vec3(uTime*.015,0.,uTime*.01));
  float g2=fbm(p*17.+uSeed*2.3);
  vec3 col=uStarC*(1.22+.6*g+.28*g2)+vec3(.25);
  float mu=clamp(dot(normalize(uCamP-vWP),vNW),0.,1.);
  col*=.5+.5*pow(mu,.55);
  gl_FragColor=vec4(col,1.);return;}
 float dif=smoothstep(-.06,.14,dot(vNW,L));
 vec3 col=vec3(.5);float spec=0.;float emis=0.;
 if(uMode<.5){ /* terran: fBm continents, biomes, ice, night cities */
  float e=fbm(p*uFreq+uSeed);
  float e2=fbm(p*uFreq*3.6+uSeed*1.7+5.);
  float det=e*.72+e2*.28;
  float land=smoothstep(uSeaL,uSeaL+.015,det);
  float t=clamp((det-uSeaL)/max(1.-uSeaL,.001),0.,1.);
  vec3 low=mix(uLo,uHi,smoothstep(.02,.48,t));
  vec3 hi=mix(low,uPk,smoothstep(.58,.82,t));
  vec3 landC=mix(uHi*1.05+vec3(.14,.11,.06),hi,smoothstep(.012,.075,t));
  float dp=clamp((uSeaL-det)/max(uSeaL,.001),0.,1.);
  vec3 sea=uSeaCol*mix(1.02,.42,dp);
  col=mix(sea,landC,land);
  float cap=smoothstep(.74,.88,abs(p.y)+e2*.16);
  col=mix(col,vec3(.93,.96,1.),cap);
  spec=(1.-land)*(1.-cap*.8);
  float city=smoothstep(.58,.8,fbm(p*6.5+uSeed*3.1+11.))*land*(1.-cap);
  emis=uNightAmt*city;
 }else if(uMode<1.5){ /* gas giant: domain-warped bands */
  float warp=fbm(p*2.6+uSeed);
  float b=sin(p.y*7.+warp*2.6+uSeed.x)*.5+.5;
  col=mix(uLo,uHi,smoothstep(.18,.82,b));
  col*= .9+.16*fbm(p*8.5+uSeed*2.+vec3(warp*.8));
  col=mix(col,uPk,smoothstep(.87,1.,b)*.55);
 }else{ /* barren: ridged fBm + craters + optional lava */
  float e=fbm(p*uFreq+uSeed);
  float r=1.-abs(fbm(p*uFreq*2.2+uSeed*2.+7.));
  float t=clamp(e*.62+r*.38,0.,1.);
  col=mix(uLo,uHi,smoothstep(.14,.58,t));
  col=mix(col,uPk,smoothstep(.68,.9,t));
  col*= .84+.16*smoothstep(.4,.52,abs(fbm(p*5.5+uSeed+3.)));
  if(uLava>.5){
   float lk=1.-smoothstep(.015,.075,abs(fbm(p*4.6+uSeed*1.3)-.5));
   col+=vec3(1.05,.3,.03)*lk*1.7;emis=lk*.9;}}
 vec3 lit=col*(dif*1.14+.032);
 lit*=mix(vec3(1.),vec3(1.1,.97,.85),smoothstep(.4,0.,dif)*.55);
 vec3 V=normalize(uCamP-vWP);
 vec3 H=normalize(V+L);
 lit+=spec*pow(max(dot(vNW,H),0.),85.)*dif*vec3(.85,1.,1.15)*.8;
 lit+=emis*(1.-dif)*vec3(1.,.62,.3)*1.5+emis*vec3(.5,.2,.05);
 gl_FragColor=vec4(lit,1.);}`;
const CLOUD_FS=GLSL_NOISE+`
uniform vec3 uSeed,uSunD;uniform float uTime,uFreqC;
varying vec3 vN,vNW,vWP;
void main(){
 float e=fbm(vN*uFreqC+uSeed+vec3(uTime*.006,0.,uTime*.004));
 float e2=fbm(vN*uFreqC*2.7+uSeed*1.9+vec3(-uTime*.004,0.,uTime*.003));
 float a=smoothstep(.5,.72,e*.75+e2*.25);
 float dif=smoothstep(-.08,.2,dot(vNW,normalize(uSunD)));
 gl_FragColor=vec4(vec3(1.05)*(dif+.04),a*.9);}`;
const AT_VS='varying vec3 vWN;varying vec3 vWP;void main(){vWN=normalize(mat3(modelMatrix)*normal);vWP=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
const AT_FS=`uniform vec3 uC,uSun,uCam;uniform float uI;
varying vec3 vWN,vWP;
void main(){
 vec3 V=normalize(uCam-vWP);
 vec3 L=normalize(uSun);
 float rim=pow(clamp(1.-abs(dot(vWN,V)),0.,1.),2.2);
 float mu=dot(V,L);
 float ray=.75*(1.+mu*mu);
 float mie=pow(max(mu,0.),9.);
 vec3 sc=uC*ray*rim+vec3(1.,.86,.72)*mie*rim*.5;
 sc=mix(sc,sc*vec3(1.4,.6,.3),smoothstep(.32,-.06,dot(vWN,L))*.55);
 float lit=clamp(dot(vWN,L)*.72+.42,0.,1.);
 float a=clamp(rim*uI*lit+rim*mie*.35,0.,1.);
 gl_FragColor=vec4(sc*a*1.7,a);}`;
function bodyUniforms(bd){
 const P=PAL[bd.pal];
 return{uSeed:{value:seedVec(bd.id)},uSunD:{value:V3(1,0,0)},uCamP:{value:V3(0,0,0)},uTime:{value:0},
  uMode:{value:bd.t==='star'?3:(bd.t==='gas'?1:((bd.pal==='earth'||bd.pal==='ocean'||bd.pal==='terra')?0:2))},
  uFreq:{value:bd.t==='gas'?2.4:2.9+(hashId(bd.id)%140)/100},
  uSeaL:{value:bd.pal==='ocean'?.34:bd.pal==='terra'?.47:bd.pal==='earth'?.52:.5},
  uSeaCol:{value:new THREE.Color(P.sea||P.lo)},uLo:{value:new THREE.Color(P.lo)},uHi:{value:new THREE.Color(P.hi)},uPk:{value:new THREE.Color(P.pk)},
  uStarC:{value:new THREE.Color(SYSTEMS[bd.sys].c)},
  uNightAmt:{value:bd.night?1:0},uLava:{value:bd.pal==='lava'?1:0}};}