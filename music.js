// Recorded renders of original compositions, decoded once and played on the same clock as the chart.
export class Music {
 constructor(){this.cache=new Map();this.generation=0;this.epoch=0;}
 async init(){this.ctx??=new AudioContext({latencyHint:'interactive'});await this.ctx.resume();}
 async load(track){
  if(this.cache.has(track.id))return this.cache.get(track.id);
  const response=await fetch(track.audio);if(!response.ok)throw Error('Track could not load');
  const buffer=await this.ctx.decodeAudioData(await response.arrayBuffer());
  if(this.cache.size>=3)this.cache.delete(this.cache.keys().next().value);
  this.cache.set(track.id,buffer);return buffer;
 }
 async start(track,volume,preview=false){
  this.stop();const generation=this.generation;await this.init();const buffer=await this.load(track);
  if(generation!==this.generation)return false;
  const beat=60/track.bpm;this.epoch=this.ctx.currentTime+.15;this.endTime=4*beat+buffer.duration;
  this.master=this.ctx.createGain();this.master.gain.value=volume*.85;this.master.connect(this.ctx.destination);
  this.source=this.ctx.createBufferSource();this.source.buffer=buffer;this.source.connect(this.master);
  if(preview){this.source.start(this.epoch,16*beat,12);}
  else{
   this.source.start(this.epoch+4*beat);
   for(let i=0;i<4;i++){const o=this.ctx.createOscillator(),g=this.ctx.createGain(),t=this.epoch+i*beat;o.frequency.value=i===3?880:660;g.gain.setValueAtTime(.08,t);g.gain.exponentialRampToValueAtTime(.001,t+.06);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+.07);}
  }
  return true;
 }
 get time(){return this.ctx?this.ctx.currentTime-this.epoch:0;}
 schedule(){} // The full track is scheduled once; animation never drives audio timing.
 volume(value){if(this.master)this.master.gain.setTargetAtTime(value*.85,this.ctx.currentTime,.03);}
 async pause(){if(this.ctx?.state==='running')await this.ctx.suspend();}
 async resume(){if(this.ctx?.state==='suspended')await this.ctx.resume();}
 stop(){this.generation++;if(this.source){try{this.source.stop();}catch{}this.source.disconnect();this.source=null;}if(this.master){this.master.disconnect();this.master=null;}}
}
