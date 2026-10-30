import {Leaderboard} from './leaderboard.js';
import {leaderboardConfig} from './leaderboard-config.js';
import {totalBest} from './totals.js';

// Every finished run submits the player's current total; the board keeps each player's best.
export function createRankings({pause}) {
 const $=id=>document.getElementById(id),board=new Leaderboard(leaderboardConfig),embedded=window.parent!==window;
 const available=()=>embedded&&board.available('total');
 const total=()=>{try{return totalBest(localStorage);}catch{return {total:0,cleared:0,combos:60};}};
 let run=null,score=null,attempt=0,loading=0;
 async function send(){
  const current=run,value=score,version=attempt;if(!current)return;
  $('retry-score').hidden=true;$('score-status').textContent='Sending your total to AIWANNA…';
  try{const receipt=await board.submit(current,value);if(version!==attempt)return;$('score-status').textContent=`Total ${value.toLocaleString()} saved on AIWANNA`+(receipt.rank?` · #${receipt.rank}`:'');}
  catch(error){if(version!==attempt)return;$('score-status').textContent=`${error.message} Your scores are still saved on this device.`;$('retry-score').hidden=false;}
 }
 $('retry-score').onclick=send;
 $('rankings').onclick=async()=>{
  pause();const version=++loading,mine=total();$('ranking-dialog').showModal();$('ranking-list').replaceChildren();$('online-board').hidden=true;
  $('ranking-mine').textContent=`Your total: ${mine.total.toLocaleString()} · ${mine.cleared} / ${mine.combos} tracks played`;
  if(!available()){$('ranking-status').textContent=board.available('total')?'Play on AIWANNA to see the online board.':'The online board opens once AFTERHOURS is on AIWANNA.';return;}
  $('ranking-status').textContent='Loading the board…';
  try{
   const data=await board.standings('total');if(version!==loading)return;
   $('ranking-status').textContent=data.entries.length?'':'No scores yet. Finish a track to set the first total.';
   for(const entry of data.entries){const row=document.createElement('li'),name=document.createElement('span'),points=document.createElement('strong');name.textContent=`#${entry.rank} · ${entry.displayName||entry.player?.displayName||'Player'}`;points.textContent=Number(entry.score).toLocaleString();row.append(name,points);$('ranking-list').append(row);}
   if(data.me)$('ranking-mine').textContent+=` · online best ${Number(data.me.score).toLocaleString()} (#${data.me.rank})`;
   $('online-board').href=board.url('total');$('online-board').hidden=false;
  }catch(error){if(version===loading)$('ranking-status').textContent=`Could not reach the online board. ${error.message}`;}
 };
 $('close-rankings').onclick=()=>{$('ranking-dialog').close();loading++;};
 $('ranking-dialog').addEventListener('cancel',()=>loading++);
 // Keep dialog keys from starting or steering a run behind it.
 $('ranking-dialog').addEventListener('keydown',event=>event.stopPropagation());
 return {
  begin(){attempt++;score=null;run=available()?board.begin('total'):null;$('score-status').textContent='';$('retry-score').hidden=true;},
  finish(){const value=total().total;if(value<1){$('score-status').textContent='Score at least 1 point to join the board.';return;}score=value;if(run)send();else $('score-status').textContent=`Total ${value.toLocaleString()} · saved on this device. Play on AIWANNA to join the online board.`;},
 };
}
