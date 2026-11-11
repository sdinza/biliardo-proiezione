'use strict';
(function(){
  const $=id=>document.getElementById(id),canvas=$('screen'),c=canvas.getContext('2d'),S=Diapositive;
  const defaultQuad=()=>[[.05,.1],[.95,.1],[.95,.9],[.05,.9]];
  let exercises=[],current=0,stage=1,grid=true,theme='white',rotation=false,light=true,calibrating=false,q=defaultQuad(),noticeTimer;
  function parseCollectionText(text){let data;if(text.trimStart().startsWith('<')){const match=text.match(/<script\b[^>]*\bid=["']embedded["'][^>]*>([\s\S]*?)<\/script>/i);if(!match)throw Error('Ce fichier HTML ne contient pas de collection Billard Studio.');data=JSON.parse(match[1]);}else data=JSON.parse(text);return data;}
  function say(text){$('notice').textContent=text;$('notice').hidden=false;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('notice').hidden=true,4500);}
  function safeStore(key,data){try{localStorage.setItem(key,JSON.stringify(data));return true;}catch{say("Stockage indisponible ou plein. Conservez le fichier exporté.");return false;}}
  function download(data,name,type='application/json'){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([data],{type}));a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
  function readCollection(data){
    if(data?.format!=='biliardo-studio-proiezione'||data.version!==1||!Array.isArray(data.exercises)||data.exercises.length<1||data.exercises.length>100)throw Error("Collection non reconnue (100 exercices maximum).");
    const point=p=>{if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<80||p.x>1120||p.y<75||p.y>595)throw Error("Coordonnées incorrectes dans la collection.");return {x:p.x,y:p.y};};
    return data.exercises.map((e,i)=>{
      const d=e.doc;if(!d||!Array.isArray(d.balls)||d.balls.length>4)throw Error("Billes incorrectes.");
      const doc={title:String(d.title||"Exercice "+(i+1)).slice(0,120),notes:String(d.notes||'').slice(0,10000),table:d.table==='pins'?'pins':'carom',target:[2,3,4].includes(d.target)?d.target:2,balls:d.balls.map(b=>({...point(b),c:/^#[a-f0-9]{6}$/i.test(b.c)?b.c:'#faf7e8'})),marks:[],shot:{power:Math.max(1,Math.min(100,Number(d.shot?.power)||50)),side:Math.max(-1,Math.min(1,Number(d.shot?.side)||0)),top:Math.max(-1,Math.min(1,Number(d.shot?.top)||0))},presentation:S.presentation(d.presentation),aim:null};
      if(d.aim&&Number.isFinite(d.aim.dx)&&Number.isFinite(d.aim.dy))doc.aim={dx:d.aim.dx,dy:d.aim.dy};
      for(const m of (Array.isArray(d.marks)?d.marks:[]).slice(0,400)){
        if(!['line','dash','text','target'].includes(m.type))continue;
        const clean={...point(m),type:m.type,c:/^#[a-f0-9]{6}$/i.test(m.c)?m.c:'#888888'};
        if(m.type==='line'||m.type==='dash'){const p=point({x:m.x2,y:m.y2});clean.x2=p.x;clean.y2=p.y;}
        if(m.type==='text')clean.text=String(m.text||'').slice(0,120);
        if(m.type==='target'){if(!Number.isFinite(m.r)||m.r<5||m.r>200)throw Error("Cible incorrecte.");clean.r=m.r;}doc.marks.push(clean);
      }
      let result=null;
      if(e.result){const r=e.result;if(!Array.isArray(r.paths)||r.paths.length>4||!Array.isArray(r.events)||r.events.length>2000)throw Error("Trajectoires incorrectes.");
        const paths=r.paths.map(p=>{if(!Array.isArray(p)||p.length>20000)throw Error("Trajectoire trop longue.");return p.map(point);});
        const events=r.events.map(v=>{if(!['rail','ball'].includes(v.type))throw Error("Impact incorrect.");const e={...point(v),type:v.type};if(v.type==='rail'){if(!Number.isInteger(v.ball)||v.ball<0||v.ball>3)throw Error("Bille incorrecte.");e.ball=v.ball;e.side=String(v.side||'');}else{if(![v.a,v.b].every(n=>Number.isInteger(n)&&n>=0&&n<4))throw Error("Contact incorrect.");e.a=v.a;e.b=v.b;e.positions=(v.positions||[]).slice(0,2).map(p=>({...point(p),ball:p.ball}));}return e;});
        result={paths,events,complete:r.complete!==false,overlap:Number.isFinite(r.overlap)?Math.max(0,Math.min(1,r.overlap)):null,cutAngle:Number.isFinite(r.cutAngle)?r.cutAngle:null,cutSign:r.cutSign===-1?-1:1,finals:(r.finals||[]).slice(0,4).map(p=>({...point(p),ball:p.ball}))};
      }
      return {id:String(e.id||i),doc,result};
    });
  }
  function draw(){
    c.setTransform(1,0,0,1,0,0);c.fillStyle='#000';c.fillRect(0,0,1040,520);
    if(light){c.save();c.translate(-80,-75);if(exercises.length)S.render(c,exercises[current].doc,exercises[current].result,stage,{grid,theme,rotation});else{c.fillStyle='#fff';c.fillRect(80,75,1040,520);}c.restore();}
    if(calibrating){c.strokeStyle='#00ff72';c.lineWidth=5;c.strokeRect(3,3,1034,514);c.strokeStyle='#777';c.lineWidth=1;for(let i=1;i<8;i++){c.beginPath();c.moveTo(i*130,0);c.lineTo(i*130,520);c.stroke();}for(let j=1;j<4;j++){c.beginPath();c.moveTo(0,j*130);c.lineTo(1040,j*130);c.stroke();}c.fillStyle='#ff4d4d';c.font='bold 35px Segoe UI';c.textAlign='center';for(const [label,x,y]of[['A',22,40],['B',1018,40],['C',1018,505],['D',22,505]])c.fillText(label,x,y);}
    canvas.style.transform='matrix3d('+S.matrix(q,innerWidth,innerHeight).join(',')+')';
    $('empty').hidden=exercises.length>0;$('caption').textContent=exercises.length?(current+1)+'/'+exercises.length+' · '+exercises[current].doc.title+' · '+stage+'/3 '+['',"Préparation","Explication","Objectif"][stage]:"Aucune collection";
    $('previous').disabled=$('next').disabled=!exercises.length;
  }
  function toggleMenu(){light=true;$('menu').hidden=!$('menu').hidden;draw();}
  function choose(index){current=index;stage=1;light=true;$('chooser').close();$('menu').hidden=true;draw();}
  function filtered(){const text=$('search').value.toLocaleLowerCase('fr').trim(),discipline=$('discipline').value;return exercises.map((e,i)=>({e,i})).filter(({e,i})=>(discipline==='all'||e.doc.table===discipline)&&((i+1)+' '+e.doc.title).toLocaleLowerCase('fr').includes(text));}
  function list(){const entries=filtered();$('drills').replaceChildren();$('count').textContent='('+entries.length+')';for(const {e,i}of entries){const button=document.createElement('button');button.className='drill';const preview=document.createElement('canvas');preview.width=320;preview.height=160;const x=preview.getContext('2d');x.scale(320/1040,160/520);x.translate(-80,-75);S.render(x,e.doc,e.result,1,{grid:true,theme:'white'});const title=document.createElement('span');title.textContent=(i+1)+' · '+e.doc.title;button.append(preview,title);button.onclick=()=>choose(i);$('drills').append(button);}if(!entries.length){const p=document.createElement('p');p.textContent="Aucun exercice trouvé.";$('drills').append(p);}}
  $('tap').onclick=toggleMenu;$('tap').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggleMenu();}};
  $('settings').onclick=()=>$('settingsDialog').showModal();$('closeSettings').onclick=()=>$('settingsDialog').close();
  $('closeMenu').onclick=()=>$('menu').hidden=true;
  for(const [id,delta]of[['previous',-1],['next',1]])$(id).onclick=()=>{stage=S.next(stage,delta);$('menu').hidden=true;light=true;draw();};
  $('go').onclick=()=>{list();$('chooser').showModal();};$('closeChooser').onclick=()=>$('chooser').close();$('search').oninput=$('discipline').onchange=list;
  $('random').onclick=()=>{const a=filtered();if(a.length)choose(a[Math.floor(Math.random()*a.length)].i);};
  $('rotate').onclick=()=>{$('settingsDialog').close();rotation=!rotation;$('menu').hidden=true;draw();};$('grid').onclick=()=>{$('settingsDialog').close();grid=!grid;$('menu').hidden=true;draw();};$('theme').onclick=()=>{$('settingsDialog').close();theme=theme==='white'?'black':'white';$('menu').hidden=true;draw();};$('light').onclick=()=>{light=false;$('menu').hidden=true;draw();};
  $('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();$('menu').hidden=true;}catch{say("Plein écran indisponible. Ouvrez l’application depuis son icône.");}};
  document.addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)||$('chooser').open||$('calib').open||$('settingsDialog').open)return;if(e.key==='ArrowRight')$('next').click();if(e.key==='ArrowLeft')$('previous').click();if(e.key==='Escape'){$('menu').hidden=false;light=true;draw();}});
  for(const id of ['openFile','emptyOpen','chooserOpen','menuOpen'])$(id).onclick=()=>{$('settingsDialog').close();$('file').click();};
  $('file').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>40*1024*1024)throw Error("Fichier trop volumineux (40 Mo maximum).");const data=parseCollectionText(await f.text());const next=readCollection(data);exercises=next;current=0;stage=1;light=true;let saved=true;await ClubStorage.put(data).catch(()=>{saved=false;});if($('chooser').open)$('chooser').close();$('menu').hidden=true;draw();say(saved?'Collection enregistrée : '+exercises.length+' exercices.':'Collection ouverte, mais non enregistrée. Conservez votre fichier et vérifiez l’espace disponible.');}catch(err){say(err.message);}e.target.value='';};
  function cornerFields(){const p=q[Number($('corner').value)||0];$('cornerX').value=(p[0]*100).toFixed(1);$('cornerY').value=(p[1]*100).toFixed(1);}
  function setCorner(x,y){const index=Number($('corner').value)||0,next=q.map(p=>p.slice());next[index]=[x/100,y/100];try{S.homography(next);q=next;cornerFields();draw();}catch(err){say(err.message);cornerFields();}}
  $('calibrate').onclick=()=>{$('settingsDialog').close();calibrating=true;light=true;cornerFields();$('calib').showModal();draw();};$('corner').onchange=cornerFields;$('applyCorner').onclick=()=>setCorner(Number($('cornerX').value),Number($('cornerY').value));
  document.querySelectorAll('[data-nudge]').forEach(button=>button.onclick=()=>{const [dx,dy]=button.dataset.nudge.split(',').map(Number),p=q[Number($('corner').value)||0],step=Number($('step').value);setCorner(p[0]*100+dx*step,p[1]*100+dy*step);});
  $('saveCalibration').onclick=()=>{if(safeStore('biliardo-proiezione-allineamento-v1',{quad:q,aspect:innerWidth/innerHeight}))say("Alignement enregistré sur cet appareil.");};
  $('resetCalibration').onclick=()=>{q=defaultQuad();cornerFields();draw();};
  $('endCalib').onclick=()=>$('calib').close();$('calib').addEventListener('close',()=>{calibrating=false;$('menu').hidden=true;draw();});
  $('exportCalibration').onclick=()=>download(JSON.stringify({format:'biliardo-allineamento',version:1,quad:q,aspect:innerWidth/innerHeight}),'allineamento-biliardo.json');$('importCalibration').onclick=()=>$('calibrationFile').click();
  $('calibrationFile').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>10000)throw Error("Fichier d’alignement trop volumineux.");const v=JSON.parse(await f.text());if(v.format!=='biliardo-allineamento'||v.version!==1)throw Error("Format d’alignement incorrect.");S.homography(v.quad);q=v.quad;cornerFields();draw();say("Alignement importé : vérifiez les coins, puis enregistrez.");}catch(err){say(err.message);}e.target.value='';};
  try{const v=JSON.parse(localStorage.getItem('biliardo-proiezione-allineamento-v1'));if(v){S.homography(v.quad);q=v.quad;}}catch{}
  async function initialize(){
    let shared=null;try{shared=await ClubStorage.inbox();}catch{}
    if(shared)try{const data=parseCollectionText(shared);const next=readCollection(data);await ClubStorage.put(data);await ClubStorage.clearInbox();exercises=next;draw();$('menu').hidden=true;say('Exercices reçus et enregistrés sur cette tablette.');return;}catch(err){say('Importation impossible : '+err.message);try{await ClubStorage.clearInbox();}catch{}}
    if(new URLSearchParams(location.search).has('shareError'))say('Fichier non reçu. Utilisez Importer des exercices dans le menu.');
    let stored=null;try{stored=await ClubStorage.get();}catch{}
    let loaded=false;if(stored)try{exercises=readCollection(stored);loaded=true;}catch{}
    if(!loaded)try{const embedded=JSON.parse($('embedded').textContent);if(embedded.exercises?.length)exercises=readCollection(embedded);}catch(err){say("Collection non chargée : "+err.message);}
    draw();if(exercises.length)$('menu').hidden=true;
  }
  window.addEventListener('resize',draw);draw();window.ClubReady=initialize();
  // API di sola lettura esposta per le verifiche del visualizzatore.
  window.ProjectionCheck={readCollection,state:()=>({current,stage,count:exercises.length,quad:q.map(p=>p.slice())})};
})();
