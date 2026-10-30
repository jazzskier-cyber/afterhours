import {TRACKS} from './tracks.js';
const DIFFICULTY_KEYS=['easy','normal','hard'];
export const bestKey=(trackId,difficulty)=>`afterhours-best-v1:${trackId}:${difficulty}`;
// Sum of saved personal bests across all 60 track/difficulty combinations.
export function totalBest(storage){
 let total=0,cleared=0;
 for(const track of TRACKS)for(const difficulty of DIFFICULTY_KEYS){
  try{const value=JSON.parse(storage.getItem(bestKey(track.id,difficulty))||'null');if(Number.isSafeInteger(value?.score)&&value.score>0){total+=value.score;cleared++;}}catch{}
 }
 return {total,cleared,combos:TRACKS.length*DIFFICULTY_KEYS.length};
}
