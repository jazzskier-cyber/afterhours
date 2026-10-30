import test from 'node:test';
import assert from 'node:assert/strict';
import {totalBest,bestKey} from './totals.js';
const store=data=>({getItem:k=>data[k]??null});
test('total adds every saved best and ignores broken entries',()=>{
 const data={[bestKey('sunroom','normal')]:JSON.stringify({score:38050}),[bestKey('sunroom','hard')]:JSON.stringify({score:12000}),[bestKey('confetti','easy')]:'not json',[bestKey('lavender','easy')]:JSON.stringify({score:-5})};
 assert.deepEqual(totalBest(store(data)),{total:50050,cleared:2,combos:60});
});
test('empty storage totals zero',()=>assert.equal(totalBest(store({})).total,0));
