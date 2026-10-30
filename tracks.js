// Original instrumental compositions. No third-party recordings or samples.
const songs=[
 ['sunroom','SUNROOM','晴天客厅',108,60,'major','Piano Pop','piano',[0,4,5,3],[0,2,4,6,4,2,1,2,4,2,0,1,2,4,1,0]],
 ['peach-soda','PEACH SODA','蜜桃汽水',116,62,'major','Piano Pop','marimba',[0,5,3,4],[4,2,0,2,4,5,4,2,1,2,4,2,0,1,2,0]],
 ['paper-planes','PAPER PLANES','纸飞机',104,65,'major','Piano Pop','piano',[0,3,5,4],[0,1,2,4,2,1,0,2,3,4,5,4,2,1,2,0]],
 ['golden-hour','GOLDEN HOUR','金色时刻',100,57,'major','Piano Pop','guitar',[0,4,3,4],[2,4,6,4,2,0,1,2,4,6,7,6,4,2,1,0]],
 ['daydream','DAYDREAM','白日梦',96,60,'major','Piano Pop','rhodes',[0,5,1,4],[4,3,2,0,1,2,4,2,6,4,2,1,0,2,1,0]],
 ['coastline','COASTLINE','海岸线',112,62,'major','Acoustic','guitar',[0,4,5,3],[0,2,1,4,2,0,4,5,4,2,1,2,0,1,2,0]],
 ['lemon-grove','LEMON GROVE','柠檬树下',106,67,'major','Acoustic','marimba',[0,3,4,0],[2,0,2,4,5,4,2,1,0,2,3,2,1,0,1,0]],
 ['sunday-bike','SUNDAY BIKE','周日单车',118,60,'major','Acoustic','guitar',[0,5,3,4],[0,4,2,4,6,4,2,0,1,4,2,1,0,2,4,0]],
 ['sea-glass','SEA GLASS','海玻璃',102,64,'major','Acoustic','flute',[0,3,1,4],[4,6,4,2,0,1,2,4,2,3,4,2,1,2,1,0]],
 ['postcard','POSTCARD','远方来信',110,59,'major','Acoustic','piano',[0,4,1,3],[0,1,4,2,1,2,4,6,5,4,2,0,2,1,4,0]],
 ['roller-skates','ROLLER SKATES','轮滑派对',122,60,'major','Disco','rhodes',[0,5,1,4],[0,2,4,2,6,4,7,6,4,2,1,4,2,0,1,0]],
 ['confetti','CONFETTI','彩纸飞扬',128,65,'major','Disco','pluck',[0,4,5,3],[4,4,2,0,2,4,6,4,2,1,0,2,4,2,1,0]],
 ['poolside','POOLSIDE','泳池边',120,62,'dorian','Disco','rhodes',[0,3,0,4],[0,2,4,6,5,4,2,1,4,2,0,2,3,2,1,0]],
 ['carousel','CAROUSEL','旋转木马',126,67,'major','Disco','marimba',[0,3,5,4],[0,4,7,6,4,2,0,2,4,5,4,3,2,1,2,0]],
 ['pink-sky','PINK SKY','粉色天空',124,57,'major','Disco','piano',[0,5,3,4],[2,4,2,1,0,2,4,6,7,6,4,2,3,2,1,0]],
 ['cloud-nine','CLOUD NINE','云端漫步',98,62,'major','Chill','rhodes',[0,3,1,4],[0,2,4,6,4,1,2,0,4,6,5,4,2,0,1,0]],
 ['lavender','LAVENDER','薰衣草',92,57,'minor','Chill','piano',[0,5,2,6],[0,2,4,2,1,0,2,4,5,4,2,1,2,0,1,0]],
 ['moon-picnic','MOON PICNIC','月下野餐',102,60,'major','Chill','bell',[0,5,1,4],[4,2,0,1,2,4,6,4,2,0,1,2,4,2,1,0]],
 ['soft-focus','SOFT FOCUS','柔焦时光',94,65,'dorian','Chill','rhodes',[0,3,6,0],[0,1,2,4,6,4,2,1,0,2,4,3,2,1,2,0]],
 ['bluebird','BLUEBIRD','青鸟',114,64,'major','Chill','flute',[0,4,5,3],[0,2,4,7,6,4,2,4,5,4,2,1,2,0,1,0]],
];
const palettes={'Piano Pop':'#c75542',Acoustic:'#287f79',Disco:'#9d4980',Chill:'#6860a7'};
export const TRACKS=songs.map(([id,name,title,bpm,root,scale,genre,instrument,chords,melody],index)=>({id,name,title,bpm,root,scale,genre,instrument,chords,melody,color:palettes[genre],index,audio:`audio/${id}.mp3`,subtitle:`${title} · ${genre}`}));
export const SCALES={major:[0,2,4,5,7,9,11],minor:[0,2,3,5,7,8,10],dorian:[0,2,3,5,7,9,10]};
export function scaleNote(track,degree){const octave=Math.floor(degree/7),index=((degree%7)+7)%7;return track.root+SCALES[track.scale][index]+12*octave;}
