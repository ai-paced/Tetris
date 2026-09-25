'use strict';
if(new URLSearchParams(location.search).get('view')==='mobile'){document.querySelector('#mobile-style').media='all';document.querySelector('#stage').style.maxWidth='390px';}

const {Tetris,SHAPES,COLORS}=BeachTetris;
const game=new Tetris();
const $=s=>document.querySelector(s),board=$('#board'),ctx=board.getContext('2d'),overlay=$('#overlay');
let mode='ready',fall=0,ground=0,resets=0,last=0,flashUntil=0,flashRows=[];
const held=new Map();
function block(c,x,y,w,h,color){c.save();c.shadowColor=color;c.shadowBlur=7;let g=c.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,'#e4fdff');g.addColorStop(.12,color);g.addColorStop(1,color);c.fillStyle=g;c.fillRect(x+2,y+2,w-4,h-4);c.shadowBlur=0;c.fillStyle='#00000023';c.fillRect(x+6,y+h-8,w-12,4);c.strokeStyle='#ffffffb0';c.lineWidth=1.4;c.strokeRect(x+4,y+4,w-8,h-8);c.fillStyle='#ffffff55';c.fillRect(x+6,y+6,w-12,2);c.restore();}
function preview(id,shape,color){const c=$(id).getContext('2d'),{width:w,height:h}=c.canvas;c.clearRect(0,0,w,h);const size=Math.min(38,(w-28)/shape[0].length,(h-24)/shape.length);shape.forEach((r,y)=>r.forEach((v,x)=>{if(v)block(c,(w-shape[0].length*size)/2+x*size,(h-shape.length*size)/2+y*size,size,size,color)}));}
const CELL=40,GRID_X=48,GRID_Y=6,BOARD_WIDTH=472,BOARD_HEIGHT=840;
function sizeCanvas(){
 const rect=board.getBoundingClientRect(),dpr=window.devicePixelRatio||1;
 const width=Math.max(1,Math.round(rect.width*dpr)),height=Math.max(1,Math.round(rect.height*dpr));
 if(board.width!==width||board.height!==height){board.width=width;board.height=height;}
 ctx.setTransform(width/BOARD_WIDTH,0,0,height/BOARD_HEIGHT,0,0);
}
function draw(){
 sizeCanvas();
 const bg=ctx.createLinearGradient(0,0,0,BOARD_HEIGHT);bg.addColorStop(0,'#08283d');bg.addColorStop(1,'#123d4b');
 ctx.fillStyle=bg;ctx.fillRect(0,0,BOARD_WIDTH,BOARD_HEIGHT);
 ctx.strokeStyle='#7cadbf44';ctx.lineWidth=1;
 ctx.beginPath();
 for(let x=0;x<=10;x++){ctx.moveTo(GRID_X+x*CELL,GRID_Y);ctx.lineTo(GRID_X+x*CELL,GRID_Y+20*CELL);}
 for(let y=0;y<=20;y++){ctx.moveTo(GRID_X,GRID_Y+y*CELL);ctx.lineTo(GRID_X+10*CELL,GRID_Y+y*CELL);}
 ctx.stroke();ctx.fillStyle='#d6eaf2';ctx.font='16px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';
 for(let y=0;y<20;y++)ctx.fillText(20-y,25,GRID_Y+(y+.5)*CELL);
 for(let x=0;x<10;x++)ctx.fillText(x+1,GRID_X+(x+.5)*CELL,825);
 game.board.forEach((r,y)=>r.forEach((v,x)=>{if(v)block(ctx,GRID_X+x*CELL,GRID_Y+y*CELL,CELL,CELL,COLORS[v-1]);}));
 if(mode!=='ready'&&!game.over)game.shape.forEach((r,y)=>r.forEach((v,x)=>{if(v)block(ctx,GRID_X+(game.x+x)*CELL,GRID_Y+(game.y+y)*CELL,CELL,CELL,COLORS[game.kind]);}));
 if(performance.now()<flashUntil){ctx.fillStyle='#d7fbff99';flashRows.forEach(y=>ctx.fillRect(GRID_X,GRID_Y+y*CELL,10*CELL,CELL));}
 preview('#active',game.shape,COLORS[game.kind]);preview('#next',SHAPES[game.next],COLORS[game.next]);
 $('#score').textContent=game.score.toLocaleString('de-DE');$('#level').textContent=game.level;$('#lines').textContent=game.lines;
}

function show(title,message,label){$('#heading').textContent=title;$('#message').textContent=message;$('#start').textContent=label;overlay.hidden=false;$('#restart').hidden=mode!=='paused';}
function clearHeld(){held.clear();document.querySelectorAll('.pressed').forEach(b=>b.classList.remove('pressed'));}
function start(){if(mode==='paused'){mode='playing';overlay.hidden=true;last=performance.now();return;}game.reset();mode='playing';fall=ground=resets=0;flashRows=[];flashUntil=0;clearHeld();overlay.hidden=true;last=performance.now();draw();}
function pause(){if(mode==='playing'){mode='paused';clearHeld();show('Kurze Strandpause','Bereit? Dann geht die Runde weiter.','Weiterspielen');}else if(mode==='paused')start();}
function afterLock(){fall=ground=resets=0;if(game.lastCleared.length){flashRows=game.lastCleared.slice();flashUntil=performance.now()+180;$('#status').textContent=game.lastCleared.length+' Reihen entfernt. '+game.score+' Punkte.';}if(game.over){mode='over';clearHeld();show('Gut gespielt!',game.score.toLocaleString('de-DE')+' Punkte · '+game.lines+' Reihen','Noch einmal spielen');}}
function action(a){if(a==='pause'){pause();return;}if(mode!=='playing')return;let changed=false;if(a==='left')changed=game.move(-1,0);if(a==='right')changed=game.move(1,0);if(a==='rotate')changed=game.rotate();if(a==='down'&&game.move(0,1)){game.score++;ground=0;fall=0;}if(a==='drop'){game.drop();afterLock();}if(changed&&resets<12){ground=0;resets++;}draw();}
function press(key,a){if(held.has(key))return;action(a);if(mode==='playing'&&['left','right','down'].includes(a))held.set(key,{a,next:performance.now()+(a==='down'?80:260)});}
// Accept native pointer input, legacy touch input and click-only board drivers.
for(const b of document.querySelectorAll('[data-action]')){
 let suppressClickUntil=0;
 const begin=(key)=>{suppressClickUntil=performance.now()+1000;b.classList.add('pressed');press(key,b.dataset.action);};
 const end=(key)=>{held.delete(key);b.classList.remove('pressed');suppressClickUntil=performance.now()+1000;};
 if(window.PointerEvent){
  b.addEventListener('pointerdown',e=>{
   if(e.button!==undefined&&e.button!==0)return;
   e.preventDefault();begin('p'+e.pointerId);
   // Some board/browser combinations cannot capture the pointer.
   try{b.setPointerCapture(e.pointerId);}catch{}
  });
  const release=e=>{if(held.has('p'+e.pointerId)||b.classList.contains('pressed'))end('p'+e.pointerId);};
  window.addEventListener('pointerup',release);
  window.addEventListener('pointercancel',release);
  b.addEventListener('lostpointercapture',release);
 }else{
  b.addEventListener('touchstart',e=>{e.preventDefault();for(const t of e.changedTouches)begin('t'+t.identifier);},{passive:false});
  const release=e=>{for(const t of e.changedTouches)if(held.has('t'+t.identifier)||b.classList.contains('pressed'))end('t'+t.identifier);};
  window.addEventListener('touchend',release);
  window.addEventListener('touchcancel',release);
 }
 b.addEventListener('click',()=>{
  // A touch often emits a subsequent click. Never execute the action twice.
  if(performance.now()<suppressClickUntil)return;
  action(b.dataset.action);
 });
}

const keys={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'rotate',ArrowDown:'down',Space:'drop',KeyP:'pause',Escape:'pause'};
window.addEventListener('keydown',e=>{if(!keys[e.code])return;if((mode==='ready'||mode==='over')&&e.code==='Space'&&e.target.tagName==='BUTTON')return;e.preventDefault();if(!e.repeat)press('k'+e.code,keys[e.code]);});window.addEventListener('keyup',e=>held.delete('k'+e.code));window.addEventListener('blur',()=>{if(mode==='playing')pause();else clearHeld();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='playing')pause();});$('#start').addEventListener('click',start);
$('#restart').addEventListener('click',()=>{mode='ready';start();});
$('#fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{$('#status').textContent='Vollbild ist in diesem Browser nicht verfügbar.';}});
function frame(now){let dt=Math.min(now-last,60);last=now;if(mode==='playing'){for(const value of held.values())if(now>=value.next){action(value.a);value.next=now+(value.a==='down'?45:90);}fall+=dt;const interval=Math.max(100,750*Math.pow(.82,game.level-1));if(fall>=interval){game.move(0,1);fall=0;}if(!game.valid(game.shape,game.x,game.y+1)){ground+=dt;if(ground>=450){game.lock();afterLock();}}else ground=0;}draw();requestAnimationFrame(frame);}draw();requestAnimationFrame(frame);
if(document.modelContext?.registerTool){try{Promise.resolve(document.modelContext.registerTool({name:'read_tetris_state',description:'Liest den aktuellen Stand der Beach-Tetris-Partie.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>({mode,score:game.score,level:game.level,lines:game.lines})})).catch(()=>{});}catch{}}
