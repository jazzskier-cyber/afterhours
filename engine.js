import {TRACKS} from './tracks.js';
export {TRACKS} from './tracks.js';
export const DIFFICULTIES={easy:{label:'EASY',step:2,holds:false},normal:{label:'NORMAL',step:1,holds:true},hard:{label:'HARD',step:.5,holds:true}};
export const BEATS=96,WINDOW=.18;
export function chartFor(track,difficulty='normal'){
 const config=DIFFICULTIES[difficulty],beat=60/track.bpm,notes=[],busy=[-1,-1,-1,-1];
 const pattern=[0,1,2,3,2,0,3,1,0,2,1,3,1,0,2,3];
 for(let b=0,i=0;b<BEATS-2;b+=config.step,i++){
  // Give each phrase breathing space; the bridge keeps the pulse but thins out.
  if(b%16>=14||(b>=48&&b<64&&b%2!==0))continue;
  let lane=pattern[(i+TRACKS.indexOf(track)*3)%pattern.length];
  for(let tries=0;tries<4&&busy[lane]>=b-.25;tries++)lane=(lane+1)%4;
  if(busy[lane]>=b-.25)continue;
  const hold=config.holds&&b%8===6?1.5:0;
  notes.push({lane,time:(4+b)*beat,end:(4+b+hold)*beat,hold:hold>0});busy[lane]=b+hold;
  if(difficulty==='hard'&&b%8===0&&b>0){const other=(lane+2)%4;if(busy[other]<b-.25){notes.push({lane:other,time:(4+b)*beat,end:(4+b)*beat,hold:false});busy[other]=b;}}
 }
 return notes.sort((a,b)=>a.time-b.time||a.lane-b.lane);
}
export function judgement(delta){const d=Math.abs(delta);return d<=.055?'PERFECT':d<=.105?'GREAT':d<=WINDOW?'GOOD':null;}
export class Round{
 constructor(chart){this.notes=chart.map((n,i)=>({...n,id:i,state:'waiting',tail:false}));this.score=0;this.combo=0;this.maxCombo=0;this.judged=0;this.weight=0;this.counts={PERFECT:0,GREAT:0,GOOD:0,MISS:0};this.events=[];this.strays=0;this.total=chart.reduce((n,v)=>n+1+Number(v.hold),0);}
 award(grade,lane,delta=0){const weight={PERFECT:1,GREAT:.8,GOOD:.5,MISS:0}[grade];this.judged++;this.weight+=weight;this.counts[grade]++;if(grade==='MISS')this.combo=0;else{this.combo++;this.maxCombo=Math.max(this.combo,this.maxCombo);this.score+=Math.round(weight*1000);}this.events.push({grade,lane,delta});}
 press(lane,time){const note=this.notes.find(n=>n.lane===lane&&n.state==='waiting'&&Math.abs(n.time-time)<=WINDOW);if(!note){this.strays++;this.combo=0;this.score=Math.max(0,this.score-50);this.events.push({grade:'OFF BEAT',lane,delta:0});return null;}const grade=judgement(time-note.time);note.state=note.hold?'holding':'done';this.award(grade,lane,time-note.time);return note;}
 release(lane,time){for(const n of this.notes)if(n.lane===lane&&n.state==='holding'){if(time>=n.end-.1){this.award('PERFECT',lane);n.state='done';n.tail=true;}else{this.award('MISS',lane);n.state='miss';n.tail=true;}}}
 update(time,held,grace=false){for(const n of this.notes){if(n.state==='waiting'&&time>n.time+WINDOW){n.state='miss';this.award('MISS',n.lane);if(n.hold){this.award('MISS',n.lane);n.tail=true;}}else if(n.state==='holding'){if(held.has(n.lane)&&time>=n.end){n.state='done';n.tail=true;this.award('PERFECT',n.lane);}else if(!held.has(n.lane)&&!grace){this.release(n.lane,time);}}}}
 get accuracy(){return this.judged?100*this.weight/(this.judged+this.strays*.2):100;}
 get grade(){return this.accuracy>=97?'S':this.accuracy>=90?'A':this.accuracy>=80?'B':this.accuracy>=65?'C':'D';}
 get complete(){return this.notes.every(n=>n.state==='done'||n.state==='miss');}
}
