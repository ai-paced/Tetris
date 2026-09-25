(function(root){
'use strict';
const SHAPES=[[[1,1,1,1]],[[1,1],[1,1]],[[0,1,0],[1,1,1]],[[0,1,1],[1,1,0]],[[1,1,0],[0,1,1]],[[1,0,0],[1,1,1]],[[0,0,1],[1,1,1]]];
const COLORS=['#24d5ff','#ffcf28','#bc45ff','#7ddd27','#ff435b','#3974ff','#ff951e'];
class Tetris{
constructor(random=Math.random){this.random=random;this.reset();}
reset(){this.board=Array.from({length:20},()=>Array(10).fill(0));this.bag=[];this.score=0;this.lines=0;this.level=1;this.over=false;this.lastCleared=[];this.next=this.pick();this.spawn();}
pick(){if(!this.bag.length){this.bag=[0,1,2,3,4,5,6];for(let i=6;i>0;i--){let j=Math.floor(this.random()*(i+1));[this.bag[i],this.bag[j]]=[this.bag[j],this.bag[i]];}}return this.bag.pop();}
spawn(){this.kind=this.next;this.next=this.pick();this.shape=SHAPES[this.kind].map(r=>r.slice());this.x=Math.floor((10-this.shape[0].length)/2);this.y=0;if(!this.valid(this.shape,this.x,this.y))this.over=true;}
valid(shape,x,y){return shape.every((row,dy)=>row.every((v,dx)=>!v||(x+dx>=0&&x+dx<10&&y+dy<20&&(y+dy<0||!this.board[y+dy][x+dx]))));}
move(dx,dy){if(this.over||!this.valid(this.shape,this.x+dx,this.y+dy))return false;this.x+=dx;this.y+=dy;return true;}
rotate(){if(this.over)return false;const s=this.shape[0].map((_,x)=>this.shape.map(row=>row[this.shape[0].length-1-x]));for(const dx of [0,-1,1,-2,2]){if(this.valid(s,this.x+dx,this.y)){this.shape=s;this.x+=dx;return true;}}return false;}
lock(){if(this.over)return;this.shape.forEach((r,dy)=>r.forEach((v,dx)=>{if(v&&this.y+dy>=0)this.board[this.y+dy][this.x+dx]=this.kind+1;}));this.lastCleared=[];this.board.forEach((r,i)=>{if(r.every(Boolean))this.lastCleared.push(i)});let n=this.lastCleared.length;this.board=this.board.filter(r=>!r.every(Boolean));while(this.board.length<20)this.board.unshift(Array(10).fill(0));this.score+=[0,100,300,500,800][n]*this.level;this.lines+=n;this.level=1+Math.floor(this.lines/10);this.spawn();}
drop(){if(this.over)return;while(this.move(0,1))this.score+=2;this.lock();}
}
root.BeachTetris={Tetris,SHAPES,COLORS};if(typeof module!=='undefined')module.exports=root.BeachTetris;
})(globalThis);
