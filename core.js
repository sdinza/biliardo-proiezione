'use strict';
(function(root){
  const box={x:80,y:75,w:1040,h:520},palette={1:'#fff9df',2:'#e64748',3:'#efc743',4:'#398ce8'};
  const number=b=>({'#faf7e8':1,'#ffffff':1,'#e34a51':2,'#ff0000':2,'#edc84c':3,'#ffff00':3,'#2478df':4,'#0000ff':4})[(b?.c||'').toLowerCase()]||1;
  function drawCue(c,ball,aim){
    if(!ball||!aim||!Number.isFinite(aim.dx)||!Number.isFinite(aim.dy)||!Math.hypot(aim.dx,aim.dy))return;
    c.save();c.translate(ball.x,ball.y);c.rotate(Math.atan2(aim.dy,aim.dx));c.setLineDash([]);
    // La punta è vicina alla bianca; il calcio si allarga allontanandosi.
    const part=(a,b,wa,wb,color)=>{c.fillStyle=color;c.beginPath();c.moveTo(-a,-wa);c.lineTo(-b,-wb);c.lineTo(-b,wb);c.lineTo(-a,wa);c.closePath();c.fill();};
    part(18,168,1.8,4.7,'#182126');
    part(22,100,1.3,2.8,'#dbb77c');
    part(23,99,.45,1.05,'#f6dfb0');
    part(18,21,1.7,1.8,'#398cbd');
    part(21,27,1.6,1.8,'#fff2d5');
    part(99,104,2.9,3.1,'#d9dce0');
    part(104,163,3.1,4.4,'#643d29');
    part(112,146,3.35,4.05,'#242a2c');
    c.strokeStyle='#b9aa8b';c.lineWidth=.55;
    for(let x=115;x<145;x+=3){c.beginPath();c.moveTo(-x,-3);c.lineTo(-x-1,3);c.stroke();}
    part(149,152,4.1,4.2,'#dfbf7f');
    part(163,168,4.4,4.6,'#20262b');
    c.restore();
  }
  function finite(v,min,max,fallback){return typeof v==='number'&&Number.isFinite(v)?Math.max(min,Math.min(max,v)):fallback;}
  function presentation(p={}){
    if(!p||typeof p!=='object')p={};
    const info=p.info||{};
    return {info:{x:finite(info.x,80,960,450),y:finite(info.y,75,475,270),w:finite(info.w,140,420,260),h:finite(info.h,105,300,185)},targets:Array.isArray(p.targets)?p.targets.slice(0,4).filter(t=>[1,2,3,4].includes(t.ball)).map(t=>({ball:t.ball,x:finite(t.x,80,1100,80),y:finite(t.y,75,575,75),w:finite(t.w,20,1040,104),h:finite(t.h,20,520,78),enabled:t.enabled!==false,showInitial:t.showInitial===true})):null};
  }
  function proposals(d,result){
    return (result?.finals||[]).filter(f=>{const b=d.balls.find(b=>number(b)===f.ball);return b&&Math.hypot(f.x-b.x,f.y-b.y)>1;}).map(f=>({ball:f.ball,x:Math.max(80,Math.min(1016,f.x-52)),y:Math.max(75,Math.min(517,f.y-39)),w:104,h:78,enabled:true,showInitial:false})).slice(0,3);
  }
  function targets(d,result){return presentation(d.presentation).targets??proposals(d,result);}
  function arrow(c,p,q,color){const a=Math.atan2(q.y-p.y,q.x-p.x);c.strokeStyle=color;c.fillStyle=color;c.lineWidth=2.5;c.beginPath();c.moveTo(p.x,p.y);c.lineTo(q.x,q.y);c.stroke();c.beginPath();c.moveTo(q.x,q.y);c.lineTo(q.x-10*Math.cos(a-.4),q.y-10*Math.sin(a-.4));c.lineTo(q.x-10*Math.cos(a+.4),q.y-10*Math.sin(a+.4));c.closePath();c.fill();}
  function ball(c,b){const n=number(b);c.fillStyle=palette[n];c.strokeStyle='#333';c.lineWidth=1.5;c.beginPath();c.arc(b.x,b.y,12,0,Math.PI*2);c.fill();c.stroke();c.fillStyle='#111';c.font='bold 11px Segoe UI';c.textAlign='center';c.fillText(String(n),b.x,b.y+4);}
  function effectDegrees(shot){return Math.abs(shot?.side||0)+Math.abs(shot?.top||0)<.001?0:Math.round(Math.atan2(shot.side||0,shot.top||0)*180/Math.PI);}
  function quantity(f){if(f===null||!Number.isFinite(f))return '—';for(const [v,label]of [[1,"Pleine"],[.75,'3/4'],[.5,'1/2'],[.25,'1/4']])if(Math.abs(f-v)<.025)return label;return Math.round(f*100)+'%';}
  function info(c,d,result,theme){
    const r=presentation(d.presentation).info;
    // Quantità effettiva al primo contatto della bianca; per tiri indiretti non si usa la mira iniziale verso la sponda.
    const hit=result?.events?.find(e=>e.type==='ball'&&(e.a===0||e.b===0)),target=hit?((hit.a===0?hit.b:hit.a)+1):(d.table==='pins'?(d.target||2):2),fraction=typeof result?.overlap==='number'?result.overlap:null;
    c.save();c.translate(r.x,r.y);c.scale(r.w/260,r.h/185);c.fillStyle=theme==='black'?'#111e':'#ffffffdf';c.fillRect(0,0,260,185);c.strokeStyle=theme==='black'?'#bbb':'#444';c.strokeRect(0,0,260,185);
    const x=100+(fraction===null?0:(1-fraction)*74)*(result?.cutSign||1);
    c.fillStyle=palette[target];c.beginPath();c.arc(100,76,37,0,Math.PI*2);c.fill();
    c.fillStyle='#ffffff77';c.strokeStyle=theme==='black'?'#fff':'#333';c.beginPath();c.arc(x,76,37,0,Math.PI*2);c.fill();c.stroke();
    c.beginPath();c.moveTo(x-37,76);c.lineTo(x+37,76);c.moveTo(x,39);c.lineTo(x,113);c.stroke();
    const shot=d.shot||{side:0,top:0};c.fillStyle='#09a9e9';c.beginPath();c.arc(x+(shot.side||0)*27,76-(shot.top||0)*27,5,0,Math.PI*2);c.fill();
    c.fillStyle=theme==='black'?'#fff':'#111';c.font='14px Segoe UI';c.textAlign='left';
    const angle=effectDegrees(shot);c.textAlign='center';c.font='bold 22px Segoe UI';c.fillText(angle+'°',100,26);c.fillText(quantity(fraction),100,145);c.restore();
  }
  function render(c,d,result,stage=1,options={}){
    const theme=options.theme||'white',ink=theme==='black'?'#fff':'#111';
    c.save();c.fillStyle=theme==='black'?'#000':'#fff';c.fillRect(80,75,1040,520);
    if(options.rotation){c.translate(600,335);c.rotate(Math.PI);c.translate(-600,-335);}
    c.save();c.beginPath();c.rect(80,75,1040,520);c.clip();
    if(options.grid!==false){c.strokeStyle=theme==='black'?'#666':'#bbb';c.lineWidth=.8;for(let i=1;i<8;i++){c.beginPath();c.moveTo(80+i*130,75);c.lineTo(80+i*130,595);c.stroke();}for(let j=1;j<4;j++){c.beginPath();c.moveTo(80,75+j*130);c.lineTo(1120,75+j*130);c.stroke();}}
    if(stage===3||stage===1||stage===2)for(const t of targets(d,result)){if(!t.enabled||(stage!==3&&!t.showInitial))continue;c.fillStyle=theme==='black'?'#3bff632e':'#5fff5f66';c.strokeStyle='#26b649';c.lineWidth=2;c.fillRect(t.x,t.y,t.w,t.h);c.strokeRect(t.x,t.y,t.w,t.h);c.fillStyle=ink;c.font='14px Segoe UI';c.textAlign='left';c.fillText("Arrivée "+t.ball,t.x+5,t.y+17);}
    // Annotazioni dell'autore solo nelle viste di spiegazione e obiettivo.
    if(stage>=2){
      for(const m of d.marks||[]){c.strokeStyle=m.c;c.fillStyle=m.c;if(m.type==='line'||m.type==='dash'){c.setLineDash(m.type==='dash'?[8,6]:[]);arrow(c,m,{x:m.x2,y:m.y2},m.c);c.setLineDash([]);}if(m.type==='target'){c.beginPath();c.arc(m.x,m.y,m.r,0,Math.PI*2);c.stroke();}if(m.type==='text'){c.font='18px Segoe UI';c.textAlign='left';c.fillText(m.text,m.x,m.y);}}
      (result?.paths||[]).forEach((points,i)=>{if(points.length<2||!points.some(p=>Math.hypot(p.x-points[0].x,p.y-points[0].y)>1))return;const col=['#1867d8','#e53d3d','#be9815','#8c53d6'][i];c.strokeStyle=col;c.lineWidth=2.5;c.beginPath();points.forEach((p,k)=>k?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();let distance=0;for(let k=1;k<points.length;k++){distance+=Math.hypot(points[k].x-points[k-1].x,points[k].y-points[k-1].y);if(distance>160){arrow(c,points[k-1],points[k],col);distance=0;}}});
      const first=result?.events?.find(e=>e.type==='ball'&&(e.a===0||e.b===0));if(first){const p=first.positions?.find(p=>p.ball===0);if(p){c.strokeStyle='#777';c.beginPath();c.arc(p.x,p.y,12,0,Math.PI*2);c.stroke();}}
      const cue=d.balls.find(b=>number(b)===1);drawCue(c,cue,d.aim);
    }
    if(d.table==='pins')for(const [x,y] of [[600,335],[581,335],[619,335],[600,316],[600,354]]){c.fillStyle=x===600&&y===335?'#e33939':theme==='black'?'#fff':'#555';c.beginPath();c.arc(x,y,4,0,Math.PI*2);c.fill();}
    d.balls.forEach(b=>ball(c,b));
    c.fillStyle=ink;c.font='bold 22px Segoe UI';c.textAlign='left';c.fillText(d.title||"Exercice",100,107,900);
    if(stage>=2)info(c,d,result,theme);
    c.restore();
    // Riferimenti interni al perimetro: inclusi nella calibrazione del panno.
    for(let i=0;i<=80;i++){const x=80+i*13;c.strokeStyle=i%10===0?'#18c342':ink;c.lineWidth=i%10===0?3:1;c.beginPath();c.moveTo(x,75);c.lineTo(x,75+(i%5===0?9:5));c.moveTo(x,595);c.lineTo(x,595-(i%5===0?9:5));c.stroke();}
    for(let i=0;i<=40;i++){const y=75+i*13;c.strokeStyle=i%10===0?'#18c342':ink;c.lineWidth=i%10===0?3:1;c.beginPath();c.moveTo(80,y);c.lineTo(80+(i%5===0?9:5),y);c.moveTo(1120,y);c.lineTo(1120-(i%5===0?9:5),y);c.stroke();}
    c.fillStyle=ink;c.font='11px Segoe UI';c.textAlign='center';for(let j=0;j<=4;j++){const y=75+j*130;c.fillText(String(40-j*10),94,Math.max(88,Math.min(587,y+4)));c.fillText(String(40-j*10),1106,Math.max(88,Math.min(587,y+4)));}
    c.restore();
  }
  function next(stage,delta=1){return ((stage-1+delta)%3+3)%3+1;}
  function quadValid(q){if(!Array.isArray(q)||q.length!==4||q.some(p=>!Array.isArray(p)||p.length!==2||p.some(v=>!Number.isFinite(v)||v<0||v>1)))return false;for(let i=0;i<4;i++){const a=q[i],b=q[(i+1)%4],c=q[(i+2)%4];if((b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0])<.001)return false;}return true;}
  function homography(q){
    if(!quadValid(q))throw Error("Les coins doivent former un rectangle ou un trapèze sans croisement.");
    const rows=[],src=[[0,0],[1,0],[1,1],[0,1]];
    src.forEach(([u,v],i)=>{const [x,y]=q[i];rows.push([u,v,1,0,0,0,-x*u,-x*v,x],[0,0,0,u,v,1,-y*u,-y*v,y]);});
    for(let k=0;k<8;k++){let p=k;for(let j=k+1;j<8;j++)if(Math.abs(rows[j][k])>Math.abs(rows[p][k]))p=j;[rows[k],rows[p]]=[rows[p],rows[k]];if(Math.abs(rows[k][k])<1e-10)throw Error("Alignement trop étroit.");const scale=rows[k][k];for(let j=k;j<9;j++)rows[k][j]/=scale;for(let i=0;i<8;i++)if(i!==k){const f=rows[i][k];for(let j=k;j<9;j++)rows[i][j]-=f*rows[k][j];}}
    return rows.map(r=>r[8]);
  }
  function matrix(q,w,h){const a=homography(q);return [a[0],a[3]*h/w,0,a[6]/w,a[1]*w/h,a[4],0,a[7]/h,0,0,1,0,a[2]*w,a[5]*h,0,1];}
  const api={drawCue,effectDegrees,quantity,box,number,presentation,proposals,targets,render,next,quadValid,homography,matrix};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Diapositive=api;
})(globalThis);
