// Render original compositions from notes and synthesized timbres, with no audio samples.
// Every song keeps its BPM and 96-beat length, so the charts in engine.js stay on the beat.
import {TRACKS,scaleNote} from '../tracks.js';
import {writeFile,mkdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),SR=44100,TAU=Math.PI*2,TMP='/private/tmp/afterhours-audio';
const out=path.join(root,'audio');await mkdir(out,{recursive:true});await mkdir(TMP,{recursive:true});
const only=process.argv[2];
let seed=1;function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
const hz=m=>440*2**((m-69)/12);

// Zero-delay state-variable filter; mode 0 low-pass, 1 band-pass, 2 high-pass.
function filter(mode=0){let a=0,b=0;return (x,cut,q=.707)=>{const g=Math.tan(Math.PI*Math.min(cut,SR*.45)/SR),k=1/q,h=1/(1+g*(g+k)),v3=x-b,v1=h*a+g*h*v3,v2=b+g*h*a+g*g*h*v3;a=2*v1-a;b=2*v2-b;return mode===0?v2:mode===1?v1:x-k*v1-v2;};}
// Band-limited sawtooth via polyBLEP.
function blep(t,dt){if(t<dt){t/=dt;return t+t-t*t-1;}if(t>1-dt){t=(t-1)/dt;return t*t+t+t+1;}return 0;}
function saw(){let ph=rand();return f=>{const dt=f/SR;ph+=dt;if(ph>=1)ph-=1;return 2*ph-1-blep(ph,dt);};}

const RELEASE={piano:.45,rhodes:.5,guitar:.3,marimba:.2,bell:1.2,flute:.18,pluck:.2,bass:.08,softbass:.1,pad:1.1,strings:.9};
function voice(midi,duration,instrument,vel){
 const f=hz(midi),rel=RELEASE[instrument],n=Math.ceil((duration+rel)*SR),v=new Float32Array(n);
 const off=t=>t<duration?1:Math.max(0,1-(t-duration)/rel);
 if(instrument==='piano'){
  // Slightly stretched partials, two detuned strings and a soft hammer.
  const parts=[],bright=.55+.45*vel,scale=Math.sqrt(f/262);
  for(let k=1;k<=7;k++){const fk=k*f*Math.sqrt(1+.00035*k*k);if(fk>SR*.4)break;parts.push([fk,bright**(k-1)/k**1.25,(1.1+k*.75)*scale]);}
  const hp=filter(1);
  for(let i=0;i<n;i++){const t=i/SR;let s=0;for(const [fk,a,d]of parts)s+=a*(Math.sin(TAU*fk*t)+.7*Math.sin(TAU*fk*1.0007*t))*Math.exp(-t*d);
   s=s*.42+hp((rand()*2-1)*Math.exp(-t*120),2600,1.2)*.09*vel;
   const damper=t<duration?1:Math.exp(-(t-duration)*11);v[i]=s*Math.min(1,t/.003)*damper;}
 }else if(instrument==='rhodes'){
  for(let i=0;i<n;i++){const t=i/SR,p=TAU*f*t,index=(.4+1.5*vel)*Math.exp(-t*4.5)+.18;
   let s=Math.sin(p+index*Math.sin(p))*Math.exp(-t*1.3)*.62;if(f*14<SR*.4)s+=Math.sin(p*14)*.05*vel*Math.exp(-t*28);
   v[i]=s*Math.min(1,t/.002)*off(t);}
 }else if(instrument==='guitar'){
  // Karplus-Strong string with a pick-position comb and soft body tone.
  const len=Math.max(2,Math.round(SR/f)),line=new Float32Array(len),lp=filter(0);
  for(let i=0;i<len;i++)line[i]=lp(rand()*2-1,1800+2600*vel,.7);
  const pick=Math.floor(len*.18);for(let i=len-1;i>=pick;i--)line[i]-=line[i-pick]*.6;
  let idx=0;for(let i=0;i<n;i++){const t=i/SR,j=idx,next=(idx+1)%len,s=line[j];const damp=t<duration?.4985:.47;line[j]=damp*(line[j]+line[next]);idx=next;
   v[i]=(s*.75+Math.sin(TAU*f*t)*.12*Math.exp(-t*3))*off(t);}
 }else if(instrument==='marimba'){
  for(let i=0;i<n;i++){const t=i/SR,p=TAU*f*t;let s=Math.sin(p)*Math.exp(-t*4.2);if(f*3.93<SR*.4)s+=.3*Math.sin(p*3.93)*Math.exp(-t*13);if(f*10.7<SR*.4)s+=.08*Math.sin(p*10.7)*Math.exp(-t*34);
   v[i]=s*.8*Math.min(1,t/.0015)*off(t);}
 }else if(instrument==='bell'){
  for(let i=0;i<n;i++){const t=i/SR,p=TAU*f*t,index=1.6*Math.exp(-t*2.2)+.2;
   v[i]=Math.sin(p+index*Math.sin(p*3.5))*Math.exp(-t*1.7)*.5*Math.min(1,t/.002)*off(t);}
 }else if(instrument==='flute'){
  const breath=filter(1);
  for(let i=0;i<n;i++){const t=i/SR,vib=1+.0055*Math.sin(TAU*5.2*t)*Math.min(1,Math.max(0,(t-.22)/.3)),p=TAU*f*vib*t;
   const s=Math.sin(p)+.22*Math.sin(2*p)+.06*Math.sin(3*p)+breath(rand()*2-1,f*2,3)*.45;
   v[i]=s*.48*Math.min(1,t/.055)*off(t);}
 }else if(instrument==='pluck'){
  const osc=saw(),osc2=saw(),lp=filter(0);
  for(let i=0;i<n;i++){const t=i/SR,s=osc(f)+osc2(f*1.004);
   v[i]=lp(s,f*1.5+4200*vel*Math.exp(-t*13),.9)*.38*Math.exp(-t*3.2)*Math.min(1,t/.002)*off(t);}
 }else if(instrument==='bass'||instrument==='softbass'){
  const osc=saw(),lp=filter(0),soft=instrument==='softbass';
  for(let i=0;i<n;i++){const t=i/SR,sub=Math.sin(TAU*f*t),edge=lp(osc(f),soft?260:220+1100*vel*Math.exp(-t*11),soft?.6:1.1);
   const body=soft?sub*.85+edge*.25:sub*.55+edge*.6,env=Math.min(1,t/.004)*(.72+.28*Math.exp(-t*6));
   v[i]=Math.tanh(body*1.4)*.62*env*off(t);}
 }else if(instrument==='pad'||instrument==='strings'){
  // Five detuned saws through a gentle low-pass; strings breathe a little brighter.
  const oscs=[-11,-5,0,5,11].map(()=>saw()),cents=[-11,-5,0,5,11],lp=filter(0),strings=instrument==='strings',attack=strings?.25:.45;
  for(let i=0;i<n;i++){const t=i/SR;let s=0;for(let k=0;k<5;k++)s+=oscs[k](f*2**(cents[k]/1200));
   const cut=(strings?2200:1300)+(strings?1400:900)*vel+160*Math.sin(TAU*.15*t);
   v[i]=lp(s,cut,.6)*.16*Math.min(1,t/attack)*off(t);}
 }
 return v;
}

function drum(kind){
 const dur={kick:.42,snare:.24,clap:.3,rim:.08,hat:.06,open:.32,shaker:.07,tamb:.16,crash:2.4,tom:.32}[kind],v=new Float32Array(Math.ceil(dur*SR));
 const hp=filter(2),bp=filter(1),bp2=filter(1);let phase=0;
 const metal=[205.3,304.4,369.6,522.7,540,800].map(x=>x*1.7),mph=metal.map(()=>rand());
 for(let i=0;i<v.length;i++){const t=i/SR,noise=rand()*2-1;let s=0;
  if(kind==='kick'){phase+=TAU*(46+120*Math.exp(-t*34))/SR;s=Math.tanh(Math.sin(phase)*1.6*Math.exp(-t*9))*.9+hp(noise,3500)*.25*Math.exp(-t*160);}
  else if(kind==='snare'){s=(Math.sin(TAU*185*t)*.5+Math.sin(TAU*330*t)*.25)*Math.exp(-t*24)+bp(noise,3200,.8)*.75*Math.exp(-t*17);}
  else if(kind==='clap'){let e=0;for(const o of [0,.011,.022])if(t>=o)e+=Math.exp(-(t-o)*(o<.02?180:22));s=bp(noise,1300,1.1)*e*.9;}
  else if(kind==='rim'){s=(Math.sin(TAU*820*t)*.6+bp(noise,2400,2)*.6)*Math.exp(-t*55);}
  else if(kind==='hat'||kind==='open'||kind==='crash'){let sq=0;for(let k=0;k<6;k++){mph[k]=(mph[k]+metal[k]/SR)%1;sq+=mph[k]<.5?1:-1;}
   const tone=hp(sq*.12+noise*.55,kind==='crash'?4500:7000,.8);s=tone*Math.exp(-t*(kind==='hat'?70:kind==='open'?10:1.9))*(kind==='crash'?.55:.6);}
  else if(kind==='shaker'){s=bp(noise,6500,1.4)*Math.min(1,t/.012)*Math.exp(-t*55)*.8;}
  else if(kind==='tamb'){let sq=0;for(let k=0;k<6;k++){mph[k]=(mph[k]+metal[k]*2.3/SR)%1;sq+=mph[k]<.5?1:-1;}s=bp2(sq*.1+noise*.6,8000,1.5)*Math.exp(-t*20)*.8;}
  else if(kind==='tom'){phase+=TAU*(105+60*Math.exp(-t*20))/SR;s=Math.sin(phase)*Math.exp(-t*11)*.8+bp(noise,900,1)*.15*Math.exp(-t*40);}
  v[i]=s;}
 return v;
}

// Freeverb-style stereo room.
function reverb(inL,inR,N,room=.84,damp=.28){
 const combs=[1116,1188,1277,1356,1422,1491,1557,1617],alls=[556,441,341,225],outL=new Float32Array(N),outR=new Float32Array(N);
 for(const [input,output,spread]of [[inL,outL,0],[inR,outR,23]]){
  const cb=combs.map(c=>({buf:new Float32Array(c+spread),i:0,store:0})),ab=alls.map(a=>({buf:new Float32Array(a+spread),i:0}));
  for(let n=0;n<N;n++){const x=input[n]*.015;let s=0;
   for(const c of cb){const y=c.buf[c.i];c.store=y*(1-damp)+c.store*damp;c.buf[c.i]=x+c.store*room;c.i=(c.i+1)%c.buf.length;s+=y;}
   for(const a of ab){const b=a.buf[a.i];a.buf[a.i]=s+b*.5;a.i=(a.i+1)%a.buf.length;s=b-s;}
   output[n]=s*3;}
 }
 return [outL,outR];
}

const STYLE={
 'Piano Pop':{comp:'piano',bass:'bass',swing:.02,duck:.28,pad:'pad',seventh:false},
 Acoustic:{comp:'guitar',bass:'softbass',swing:.05,duck:.12,pad:'strings',seventh:false},
 Disco:{comp:'rhodes',bass:'bass',swing:0,duck:.5,pad:'strings',seventh:true},
 Chill:{comp:'rhodes',bass:'softbass',swing:.09,duck:.22,pad:'pad',seventh:true},
};
const reports=[];
for(const track of TRACKS){
 if(only&&track.id!==only)continue;
 seed=track.index*7919+31;
 const style=STYLE[track.genre],beat=60/track.bpm,duration=96*beat+1.5,N=Math.ceil(duration*SR),cache=new Map(),kicks=[];
 const bus=()=>[new Float32Array(N),new Float32Array(N)],main=bus(),duck=bus(),rev=bus(),dly=bus();
 // Swing pushes off-beat eighths late; small random offsets keep it from sounding gridded.
 const when=b=>{const frac=b%1;return (b+(Math.abs(frac-.5)<.01?style.swing:0))*beat+(rand()-.5)*.006;};
 function mix(samples,start,gain,pan=0,{target=main,send=.15,echo=0}={}){
  const o=Math.floor(start*SR),lg=Math.sqrt((1-pan)/2)*gain,rg=Math.sqrt((1+pan)/2)*gain;
  for(let i=0;i<samples.length;i++){const j=o+i;if(j<0)continue;if(j>=N)break;const s=samples[i],l=s*lg,r=s*rg;target[0][j]+=l;target[1][j]+=r;if(send){rev[0][j]+=l*send;rev[1][j]+=r*send;}if(echo){dly[0][j]+=l*echo;dly[1][j]+=r*echo;}}
 }
 function note(midi,b,len,gain,instrument,pan=0,opts={}){
  const vel=Math.min(1,Math.max(.3,opts.vel??.8)),d=Math.max(.06,len*beat),key=`${midi}/${d.toFixed(2)}/${instrument}/${vel.toFixed(1)}`;
  if(!cache.has(key))cache.set(key,voice(midi,d,instrument,Math.round(vel*10)/10));
  mix(cache.get(key),opts.exact?b*beat:when(b),gain*(.85+.3*vel),pan,{target:opts.target||main,send:opts.send??.18,echo:opts.echo||0});
 }
 const kit={};for(const k of ['kick','snare','clap','rim','hat','open','shaker','tamb','crash','tom'])kit[k]=drum(k);
 function hit(kind,b,gain,pan=0,send=.06){const t=kind==='kick'?b*beat:when(b);if(kind==='kick')kicks.push(t);mix(kit[kind],t,gain*(.92+rand()*.16),pan,{send});}

 // Voice leading: each chord tone takes the octave nearest the previous voicing.
 let center=track.root+5;
 function voicing(chord,extra){
  const degrees=style.seventh?[chord,chord+2,chord+4,chord+6]:[chord,chord+2,chord+4,chord+7];if(extra)degrees.push(chord+8);
  const notes=degrees.map(d=>{let m=scaleNote(track,d);while(m<center-7)m+=12;while(m>center+6)m-=12;return m;}).sort((a,b)=>a-b);
  center=Math.round(notes.reduce((a,b)=>a+b,0)/notes.length*.5+(track.root+5)*.5);return notes;
 }
 const chordTones=chord=>[chord,chord+2,chord+4];
 function snap(degree,chord){let bestD=degree,bestGap=9;for(const c of chordTones(chord))for(const o of [-7,0,7]){const d=c+o,gap=Math.abs(d-degree);if(gap<bestGap){bestGap=gap;bestD=d;}}return bestD;}
 const rhythmSets=[[0,.5,1.5,2.5],[0,.75,1.5,3],[0,1,2,2.5],[.5,1,2,3.5],[0,1.5,2.5,3]];
 const leadInstrument=track.instrument,leadUp=leadInstrument==='bell'||leadInstrument==='marimba'?12:0;

 for(let bar=0;bar<24;bar++){
  const b=bar*4,chord=track.chords[bar%track.chords.length],next=track.chords[(bar+1)%track.chords.length];
  const intro=bar<4,verse=bar>=4&&bar<12,bridge=bar>=12&&bar<16,chorus=bar>=16&&bar<22,outro=bar>=22,phraseEnd=bar%4===3;
  const energy=intro?.62:verse?.82:bridge?.7:chorus?1:.7,v=voicing(chord,track.genre==='Chill'&&chorus);
  const padPan=k=>(k/(v.length-1)-.5)*.7;

  // Harmony bed.
  if(!(intro&&bar<1&&track.genre==='Disco'))for(const [k,m]of v.entries())note(m,b,4,.13*energy*(intro?.8:1),style.pad,padPan(k),{target:duck,send:.35,exact:true,vel:intro?.35:chorus?.95:.6});
  // Rhythm section comping per genre.
  if(style.comp==='piano'){
   const hits=intro?[[0,3.5,.7]]:bridge?[[0,2,.75],[2,1.8,.6]]:[[0,1.4,.85],[1.5,.45,.55],[2,.9,.65],[3,.45,.5],[3.5,.45,.6]];
   for(const [at,len,vel]of hits)for(const [k,m]of v.entries())note(m,b+at+k*.008,len,.15*energy,'piano',padPan(k)*.8,{target:duck,vel,send:.22});
  }else if(style.comp==='guitar'){
   // Down . down up . up down up strum, upstrokes lighter and reversed.
   const strum=intro?[[0,1]]:[[0,1],[1,1],[1.5,0],[2.5,0],[3,1],[3.5,0]],strings=[...v,v[0]+12];
   for(const [at,down]of strum){const order=down?strings:[...strings].reverse().slice(0,4);for(const [k,m]of order.entries())note(m,b+at+k*.011,at===0?1.2:.55,(down?.13:.085)*energy,'guitar',(k/order.length-.5)*.6,{target:duck,vel:down?.85:.55,send:.2});}
  }else if(track.genre==='Disco'){
   if(!intro||bar>=2)for(const at of [.5,1.5,2.5,3.5])for(const [k,m]of v.entries())note(m+12,b+at,.32,.1*energy,'rhodes',padPan(k),{target:duck,vel:.7,send:.18});
  }else{
   const hits=bridge?[[0,3.6]]:[[0,1.6],[2.75,1.1]];
   for(const [at,len]of hits)for(const [k,m]of v.entries())note(m,b+at+k*.018,len,.15*energy,'rhodes',padPan(k),{target:duck,vel:.6,send:.3,echo:.12});
  }

  // Bass line.
  let low=scaleNote(track,chord);while(low>45)low-=12;while(low<33)low+=12;
  const fifth=scaleNote(track,chord+4)-scaleNote(track,chord)+low,approach=(()=>{let m=scaleNote(track,next);while(m>45)m-=12;while(m<33)m+=12;return m+(m>low?-1:1);})();
  const bassLine=intro&&bar<2?[[0,low,3.6]]:
   track.genre==='Disco'?[0,.5,1,1.5,2,2.5,3,3.5].map((at,i)=>[at,i%2?low+12:low,.38]):
   track.genre==='Chill'?[[0,low,1.4],[1.5,low,.4],[2.5,fifth,1],[3.75,approach,.25]]:
   track.genre==='Acoustic'?[[0,low,1.4],[2,fifth,1.4],[3.5,phraseEnd?approach:low,.45]]:
   [[0,low,1.3],[1.5,low,.4],[2,low,.9],[3,fifth,.45],[3.5,phraseEnd?approach:low,.45]];
  if(!(bridge&&bar<14&&track.genre!=='Chill'))for(const [at,m,len]of bassLine)note(m,b+at,len,.3*energy,style.bass,0,{target:duck,send:0,vel:at===0?.95:.75});
  else note(low,b,3.8,.26*energy,style.bass,0,{target:duck,send:0,vel:.6});

  // Melody: the track motif, with strong beats resolved to chord tones and phrases landing on the root.
  if(!intro||bar>=2){
   const rhythm=rhythmSets[(track.index+(bridge?2:chorus?1:0))%rhythmSets.length],motif=(bar%4)*4,shift=bridge?2:0;
   const line=rhythm.map((at,k)=>{let d=track.melody[motif+k]+shift;if(at%2===0)d=snap(d,chord);return [at,d];});
   if(phraseEnd){line.length=Math.min(line.length,3);line.push([line.at(-1)[0]+.5<3?3:line.at(-1)[0]+.5,snap(chord,chord)]);}
   if(chorus){const filled=[];for(let k=0;k<line.length;k++){filled.push(line[k]);const nx=line[k+1];if(nx&&nx[0]-line[k][0]>=1&&Math.abs(nx[1]-line[k][1])>=2)filled.push([line[k][0]+.5,Math.round((line[k][1]+nx[1])/2)]);}line.splice(0,line.length,...filled);}
   const sparse=bridge||outro;
   for(let k=0;k<line.length;k++){
    if(sparse&&k%2===1&&!phraseEnd)continue;
    const [at,d]=line[k],gap=(line[k+1]?.[0]??4)-at,len=Math.min(phraseEnd&&k===line.length-1?4-at:gap*.92,1.8),pitch=scaleNote(track,d)+leadUp;
    const vel=(at%1===0?.9:.72)+(rand()-.5)*.1;
    note(pitch,b+at,len,.3*energy,leadInstrument,.08,{vel,send:.26,echo:chorus?.2:.12});
    if(chorus){note(scaleNote(track,d+2)+leadUp,b+at,len,.085,'flute',-.3,{vel:.6,send:.3});if(at%1===0)note(pitch+12,b+at,len*.7,.05,'bell',.35,{vel:.6,send:.4,echo:.25});}
   }
  }
  // Sparkle arpeggio over the chorus, a lighter one in the verse.
  if(chorus||verse){const arp=chorus?[0,1,2,1,3,2,1,2]:[0,2,1,3],step=chorus?.5:1,inst=track.genre==='Acoustic'?'marimba':track.genre==='Chill'?'bell':'pluck';
   for(const [i,idx]of arp.entries())note(v[idx%v.length]+12,b+i*step+(chorus?0:.5),step*.9,(chorus?.06:.045)*energy,inst,i%2?.55:-.55,{vel:.6,send:.3,echo:.18});}

  // Drums. Phrase ends leave a fill where the chart takes a breath.
  const g=energy,disco=track.genre==='Disco',chill=track.genre==='Chill',acoustic=track.genre==='Acoustic';
  if(bar===4||bar===16)hit('crash',b,.32,-.25,.2);
  for(let q=0;q<16;q++){
   const at=b+q*.25,eighth=q%2===0,quarter=q%4===0,beatNo=Math.floor(q/4),fill=phraseEnd&&!outro&&q>=12&&bar!==23;
   if(fill)continue;
   // Kick
   const kickHere=disco?quarter&&!(bridge&&bar<14)&&!(intro&&bar<1&&q>0):
    chill?(q===0||q===10||(q===14&&!bridge)):
    acoustic?(q===0||q===8||(q===11&&chorus)):
    (q===0||q===6||q===8||(q===11&&chorus));
   if(kickHere&&!(intro&&bar===0&&q>0&&!disco))hit('kick',at,.5*g);
   // Backbeat
   if((beatNo===1||beatNo===3)&&quarter&&bar>0&&!(bridge&&bar<14&&!disco)){
    if(acoustic&&!chorus)hit('rim',at,.3*g,.1);else{hit('snare',at+(chill?.06:0),.34*g,.05,.12);if(disco||chorus)hit('clap',at,.2*g,-.05,.18);}
    if(acoustic&&chorus)hit('tamb',at,.16*g,.4);
   }
   // Hats and shakers
   if(eighth&&(!intro||bar>=1)){const offbeat=q%4===2;if(disco&&offbeat)hit('open',at,.17*g,.3);else hit('hat',at,(offbeat?.2:.13)*g,.3);}
   else if(!eighth&&(chorus||disco)&&!chill)hit('hat',at,.075*g,.3);
   if((acoustic||chill)&&!intro&&!eighth)hit('shaker',at,.09*g,-.35);
  }
  if(phraseEnd&&!outro&&bar!==23){
   if(disco||bar===15)for(let k=0;k<8;k++)hit('snare',b+3+k*.125,.1+k*.028,(k%2-.5)*.2,.15);
   else for(let k=0;k<4;k++)mix(kit.tom,(b+3+k*.25)*beat,.32*g,.4-k*.27,{send:.15});
  }
  // Rising noise into the chorus.
  if(bar===15){const len=Math.floor(4*beat*SR),sweep=new Float32Array(len),bp=filter(1);for(let i=0;i<len;i++){const x=i/len;sweep[i]=bp(rand()*2-1,500+7000*x*x,1.4)*x*x*.5;}mix(sweep,b*beat,.5,0,{send:.3});}
 }
 // Final chord lands right after the last chart note and rings out.
 hit('kick',94,.6);hit('crash',94,.34,-.2,.3);
 for(const [k,m]of voicing(track.chords[0]).entries()){note(m,94,2,.16,style.comp==='guitar'?'guitar':style.comp,padPan2(k),{exact:true,vel:.75,send:.4});note(m,94,2.2,.11,style.pad,padPan2(k),{exact:true,vel:.5,send:.45});}
 function padPan2(k){return (k/3-.5)*.7;}
 note(scaleNote(track,0)-24,94,2,.28,style.bass,0,{exact:true,send:0,vel:.8});

 // Sidechain: harmony and bass dip under each kick.
 const env=new Float32Array(N).fill(1),release=.16;
 for(const t of kicks){const o=Math.floor(t*SR);for(let i=0;i<release*3*SR&&o+i<N;i++){const r=1-style.duck*Math.exp(-i/SR/release)*Math.min(1,i/(SR*.004));if(o+i>=0&&r<env[o+i])env[o+i]=r;}}
 // Ping-pong delay on a dotted eighth.
 const dl=Math.round(.75*beat*SR),echoL=new Float32Array(N),echoR=new Float32Array(N),lpL=filter(0),lpR=filter(0);
 for(let i=0;i<N;i++){const fl=i>=dl?echoR[i-dl]:0,fr=i>=dl?echoL[i-dl]:0;echoL[i]=dly[0][i]+lpL(fl,3200)*.38;echoR[i]=dly[1][i]*.6+lpR(fr,3200)*.38;}
 // Pre-delayed, high-passed room.
 const pre=Math.round(.022*SR),hpL=filter(2),hpR=filter(2),inL=new Float32Array(N),inR=new Float32Array(N);
 for(let i=0;i<N;i++){inL[i]=hpL(i>=pre?rev[0][i-pre]+echoL[i-pre]*.4:0,220);inR[i]=hpR(i>=pre?rev[1][i-pre]+echoR[i-pre]*.4:0,220);}
 const [wetL,wetR]=reverb(inL,inR,N);
 const L=new Float32Array(N),R=new Float32Array(N);
 for(let i=0;i<N;i++){L[i]=main[0][i]+duck[0][i]*env[i]+wetL[i]*.55+echoL[i]*.5;R[i]=main[1][i]+duck[1][i]*env[i]+wetR[i]*.55+echoR[i]*.5;}
 // Gentle bus compression (2:1 above the average level), then a soft knee limiter.
 let sum=0;for(let i=0;i<N;i++)sum+=L[i]*L[i]+R[i]*R[i];const rms=Math.sqrt(sum/(2*N)),thresh=rms*1.4;let level=0;
 for(let i=0;i<N;i++){const x=Math.max(Math.abs(L[i]),Math.abs(R[i]));level=x>level?level+(x-level)*.002:level+(x-level)*.00012;const gr=level>thresh?(thresh+(level-thresh)*.5)/level:1;L[i]*=gr;R[i]*=gr;}
 const fade=i=>Math.min(1,i/(SR*.01),Math.max(0,(duration-i/SR)/.9));
 let peak=0;for(let i=0;i<N;i++){peak=Math.max(peak,Math.abs(L[i]),Math.abs(R[i]));}
 const pcm=Buffer.alloc(N*8),pre2=.7/peak;for(let i=0;i<N;i++){const f=fade(i);pcm.writeFloatLE(L[i]*pre2*f,i*8);pcm.writeFloatLE(R[i]*pre2*f,i*8+4);}
 const raw=`${TMP}/${track.id}.f32`;await writeFile(raw,pcm);
 // Two-pass loudness match to the previous renders (about -14.5 LUFS, -1 dBTP).
 const input=['-hide_banner','-f','f32le','-ar',String(SR),'-ac','2','-i',raw];
 // Master EQ: clear the sub rumble and low-mid mud, open up presence and air.
 const eq='highpass=f=32:p=2,equalizer=f=320:t=q:w=1.1:g=-2.5,equalizer=f=3000:t=q:w=.9:g=5,treble=g=6:f=7000:t=s';
 const pass1=spawnSync('ffmpeg',[...input,'-af',`${eq},loudnorm=I=-14.5:TP=-1.2:LRA=11:print_format=json`,'-f','null','-'],{encoding:'utf8'});
 const m=JSON.parse(pass1.stderr.match(/\{[^{}]*\}/g).at(-1));
 const ln=`loudnorm=I=-14.5:TP=-1.2:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
 const res=spawnSync('ffmpeg',[...input,'-loglevel','error','-y','-af',`${eq},${ln},aresample=44100`,'-c:a','libmp3lame','-b:a','160k','-metadata',`title=${track.name}`,'-metadata','artist=AFTERHOURS Original Sessions',path.join(out,track.id+'.mp3')],{encoding:'utf8'});if(res.status!==0)throw Error(res.stderr);
 reports.push({id:track.id,bpm:track.bpm,seconds:duration,inputLufs:Number(m.input_i),kicks:kicks.length});console.log(`${track.index+1}/20 ${track.name} · ${duration.toFixed(1)}s`);
}
if(!only)await writeFile(path.join(out,'render-report.json'),JSON.stringify(reports,null,2)+'\n');
