import {mkdir,copyFile,cp} from 'node:fs/promises';
await mkdir(new URL('dist/',import.meta.url),{recursive:true});
for(const file of ['index.html','style.css','game.js','engine.js','music.js','tracks.js','leaderboard.js','leaderboard-config.js','rankings.js','totals.js'])await copyFile(new URL(file,import.meta.url),new URL('dist/'+file,import.meta.url));
console.log('Built static game in dist/');

await cp(new URL('audio/',import.meta.url),new URL('dist/audio/',import.meta.url),{recursive:true});
