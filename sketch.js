const COL_Y=[255,233,109],  // Yellow
      COL_R=[206,41,35],    // Red
      COL_B=[130,180,255],  // Blue
      COL_K=[30];

const BAND_RATIO=0.025, HEADER_TEXT='SPACE TO SWITCH', EPS=0.015;
let mode='A', nextVertical={A:Math.random()<.5,B:Math.random()<.5};
let vertsA=[], horzsA=[], intersectionColors=new Map();
let vertsB=[], horzsB=[], filledCells=new Map();
let animating=false, action='band', animStart=0, animBand=null;
let headerColors=[], headerLastUpdate=0;

let noiseSpeed = 0.01;
let bandShakeAmp = 0.02;
let cellShakeAmp = 0.02;

let catImg;
let catActive=false, catCell=null;
let catX, catY, catSize;
let targetX, targetY, targetSize;
let catSpeed=0.08, catHoldTime=500;
let catTimer=0, catFlip=false;

let paused=false; // 鼠标悬停暂停标记

function preload(){
  catImg = loadImage("cat.png"); // 请将 cat.png 放在同目录
}

function setup(){
  createCanvas(windowWidth,windowHeight);
  frameRate(60); noStroke(); textFont('sans-serif');
  headerInit(); headerColorsReset(); timerNext();

  catX = width/2; catY = height/2; catSize = 50;
  targetX = catX; targetY = catY; targetSize = catSize;

  // 鼠标悬停暂停
  let c = document.querySelector('canvas');
  c.addEventListener('mouseenter',()=>paused=true);
  c.addEventListener('mouseleave',()=>paused=false);
}

function windowResized(){ resizeCanvas(windowWidth,windowHeight); headerLayout(); }

function draw(){
  background(255);
  headerDraw();

  if(paused){
    push();
    textAlign(CENTER,CENTER);
    textSize(min(width,height)*0.08);
    fill(0,150);
    text('PAUSED', width/2, height/2);
    pop();
    return;
  }

  const now=millis(), t=bandThickness();
  const n=noise(frameCount*noiseSpeed);

  if(mode==='A'){
    const bandCol=color(...colorByNoise(n));
    drawBands(vertsA,horzsA,t,bandCol);
    if(animating && action==='band') bandAnim(animBand,bandCol,n);
    for(const [k,col] of intersectionColors){
      const [xs,ys]=k.split('|');
      const x=parseFloat(xs)*width,y=parseFloat(ys)*height;
      fill(col); rectMode(CENTER); rect(x,y,t,t);
    }
    if(vertsA.length>=19 || horzsA.length>=19) resetA();
  } else {
    cellsDraw(n);
    const bandCol=color(...colorByNoise(n));
    drawBands(vertsB,horzsB,t,bandCol);
    if(animating && action==='band') bandAnim(animBand,bandCol,n);
    catCellLogic(n,now);
    if(vertsB.length>=19 || horzsB.length>=19 || filledCells.size>=19) resetB();
  }

  if(now-headerLastUpdate>3000) headerColorsReset();
  if(animating && (now-animStart)/1000>=1){
    animating=false;
    finalizeBand(animBand);
    timerNext();
  }
}

// ============================
// 重置 A/B 模式
// ============================
function resetA(){ vertsA=[]; horzsA=[]; intersectionColors.clear(); nextVertical.A=Math.random()<.5; }
function resetB(){ vertsB=[]; horzsB=[]; filledCells.clear(); nextVertical.B=Math.random()<.5; catActive=false; catCell=null; }

// ============================
// 猫头逻辑
// ============================
function catCellLogic(n, now){
  if(!catImg || vertsB.length<2 || horzsB.length<2) return;
  const E=innerEdges();

  if(!catActive){
    const candidates=[];
    for(let i=0;i<E.vx.length-1;i++){
      for(let j=0;j<E.hy.length-1;j++){
        const key=`${i}|${j}`;
        if(!filledCells.has(key)) candidates.push({i,j});
      }
    }
    if(candidates.length>0){
      catCell=random(candidates);
      const x1=E.xR[catCell.i], x2=E.xL[catCell.i+1];
      const y1=E.yB[catCell.j], y2=E.yT[catCell.j+1];
      targetX=(x1+x2)/2; targetY=(y1+y2)/2;
      targetSize=min(x2-x1, y2-y1)*0.9;
      catX=targetX; catY=targetY; catSize=0;
      catActive=true; catTimer=now;
      catFlip=random([true,false]);
    }
  } else {
    catX=lerp(catX,targetX,catSpeed);
    catY=lerp(catY,targetY,catSpeed);

    const appearT=min(1,(now-catTimer)/300);
    catSize=lerp(catSize,targetSize,catSpeed*appearT+0.05);

    push();
    imageMode(CENTER);
    translate(catX,catY);
    if(catFlip) scale(-1,1);
    tint(255,180+75*n);
    image(catImg,0,0,catSize,catSize);
    pop();
    noTint();

    if(dist(catX,catY,targetX,targetY)<1 && now-catTimer>catHoldTime){
      const fadeTime=300;
      const remain=catHoldTime+fadeTime-(now-catTimer);
      if(remain>0){ catSize=targetSize*remain/fadeTime; }
      else{ catActive=false; catCell=null; }
    }
  }
}

// ============================
// 核心动画函数
// ============================
function bandThickness(){ return min(width,height)*BAND_RATIO; }
function timerNext(){ setTimeout(()=>beginNext(),500); }

function beginNext(){
  animStart=millis(); animating=true;
  if(mode==='A'){ action='band'; animBand=nextBand('A'); }
  else{
    const haveCells=vertsB.length>=2 && horzsB.length>=2;
    action=haveCells ? (action==='band'?'fill':'band') : 'band';
    if(action==='band'){ animBand=nextBand('B'); }
    else{
      const f=cellPick();
      if(f) cellFinalize(f);
      animating=false;
      timerNext();
      return;
    }
  }
}

function nextBand(which){ 
  const margin=.05, vertical=nextVertical[which]; 
  nextVertical[which]=!nextVertical[which]; 
  return {vertical, posRel:random(margin,1-margin), direction:random(['forward','backward'])}; 
}

// ============================
// 带动画 & 震动
// ============================
function bandAnim(b,col,n){ 
  const t=bandThickness()*(0.8+0.4*n), p=constrain((millis()-animStart)/1000,0,1);
  fill(col);

  const base=min(width,height);
  const amp=bandShakeAmp*base;
  const seed=(b.vertical?0.7:1.3)+(b.posRel*10);
  const shake=map(noise(frameCount*noiseSpeed+seed),0,1,-amp,amp);

  if(b.vertical){ 
    const x=b.posRel*width+shake;
    const len=height*p; 
    if(b.direction==='forward') rectMode(CENTER),rect(x,len/2,t,len); 
    else rectMode(CENTER),rect(x,height-len/2,t,len); 
  } else { 
    const y=b.posRel*height+shake;
    const len=width*p; 
    if(b.direction==='forward') rectMode(CENTER),rect(len/2,y,len,t); 
    else rectMode(CENTER),rect(width-len/2,y,len,t); 
  } 
}

function finalizeBand(b){ 
  const pos=b.posRel, vertical=b.vertical; 
  if(mode==='A'){ 
    if(vertical){ vertsA.push(pos); for(const y of horzsA) touchIntersection(pos,y); mergeNear(vertsA); } 
    else{ horzsA.push(pos); for(const x of vertsA) touchIntersection(x,pos); mergeNear(horzsA); } 
  } else { 
    if(vertical){ vertsB.push(pos); mergeNear(vertsB); splitFilled('v', indexOfLine(vertsB,pos)); } 
    else{ horzsB.push(pos); mergeNear(horzsB); splitFilled('h', indexOfLine(horzsB,pos)); } 
  } 
}

function touchIntersection(x,y){ 
  const k=keyVH(x,y); 
  if(!intersectionColors.has(k)) intersectionColors.set(k,color(...randomColor())); 
}

function mergeNear(arr){ 
  arr.sort((a,b)=>a-b); const out=[]; let i=0; 
  while(i<arr.length){ let j=i+1,s=arr[i],c=1; 
    while(j<arr.length && Math.abs(arr[j]-arr[i])<EPS){ s+=arr[j]; c++; j++; } 
    out.push(s/c); i=j; 
  } 
  arr.length=0; for(const v of out) arr.push(v); 
}

function indexOfLine(arr,pos){ for(let i=0;i<arr.length;i++) if(Math.abs(arr[i]-pos)<1e-4) return i; return 0; }
function splitFilled(ori,k){ 
  const keys=[...filledCells.keys()]; 
  if(ori==='v'){ 
    for(const key of keys){ const [is,js]=key.split('|'); const i=int(is), j=int(js); 
      if(i===k-1){ const col=filledCells.get(key).color; const right=`${k}|${j}`; 
        if(!filledCells.has(right)) filledCells.set(right,{color:col}); 
      } 
    } 
  } else { 
    for(const key of keys){ const [is,js]=key.split('|'); const i=int(is), j=int(js); 
      if(j===k-1){ const col=filledCells.get(key).color; const bot=`${i}|${k}`; 
        if(!filledCells.has(bot)) filledCells.set(bot,{color:col}); 
      } 
    } 
  } 
}

function innerEdges(){ 
  const t=bandThickness(); 
  const vx=[...vertsB].sort((a,b)=>a-b), hy=[...horzsB].sort((a,b)=>a-b); 
  return {vx, hy, xL:vx.map(v=>v*width+t/2), xR:vx.map(v=>v*width-t/2), yT:hy.map(h=>h*height+t/2), yB:hy.map(h=>h*height-t/2)}; 
}

function cellPick(){ 
  if(vertsB.length<2 || horzsB.length<2) return null; 
  const E=innerEdges(); const cands=[]; 
  for(let i=0;i<E.vx.length-1;i++){ 
    for(let j=0;j<E.hy.length-1;j++){ 
      const key=`${i}|${j}`; if(!filledCells.has(key)) cands.push({i,j}); 
    } 
  } 
  if(cands.length===0) return null; 
  const ch=random(cands);
  const col=color(...randomColor());
  return {i:ch.i,j:ch.j,color:col}; 
}

function cellFinalize(f){ if(f) filledCells.set(`${f.i}|${f.j}`,{color:f.color}); }

function cellsDraw(n){ 
  if(vertsB.length<2 || horzsB.length<2) return; 
  const E=innerEdges(); 
  for(const [key,e] of filledCells){ 
    const [is,js]=key.split('|'); 
    const i=int(is), j=int(js); 
    const x1=E.xR[i], x2=E.xL[i+1], y1=E.yB[j], y2=E.yT[j+1]; 
    if(x2<=x1 || y2<=y1) continue; 
    const shake = map(noise(frameCount*noiseSpeed + i*0.3 + j*0.7),0,1,-cellShakeAmp*min(width,height),cellShakeAmp*min(width,height));
    const c=color(red(e.color)*(0.8+0.2*n),green(e.color)*(0.8+0.2*n),blue(e.color)*(0.8+0.2*n)); 
    fill(c); rectMode(CORNER); rect(x1+shake,y1+shake,x2-x1,y2-y1); 
  } 
}

// ============================
// 绘制条带
// ============================
function drawBands(verts,horzs,t,col){
  rectMode(CENTER);
  fill(col);
  const base=min(width,height);
  const amp=bandShakeAmp*base;
  for(let idx=0;idx<verts.length;idx++){
    const xRel=verts[idx];
    const seed=idx*0.345+0.12;
    const shake=map(noise(frameCount*noiseSpeed+seed),0,1,-amp,amp);
    rect(xRel*width+shake,height/2,t,height);
  }
  for(let idx=0;idx<horzs.length;idx++){
    const yRel=horzs[idx];
    const seed=idx*0.789+0.6;
    const shake=map(noise(frameCount*noiseSpeed+seed),0,1,-amp,amp);
    rect(width/2,yRel*height+shake,width,t);
  }
}

// ============================
// 工具函数
// ============================
function keyVH(vx,hy){ return `${vx.toFixed(4)}|${hy.toFixed(4)}`; }
function colorByNoise(n){
  if(n<0.33){ let t=map(n,0,0.33,0,1); return [lerp(COL_R[0],COL_Y[0],t),lerp(COL_R[1],COL_Y[1],t),lerp(COL_R[2],COL_Y[2],t)]; } 
  else if(n<0.66){ let t=map(n,0.33,0.66,0,1); return [lerp(COL_Y[0],COL_B[0],t),lerp(COL_Y[1],COL_B[1],t),lerp(COL_Y[2],COL_B[2],t)]; } 
  else{ let t=map(n,0.66,1,0,1); return [lerp(COL_B[0],COL_R[0],t),lerp(COL_B[1],COL_R[1],t),lerp(COL_B[2],COL_R[2],t)]; } 
}
function randomColor(){ return random([COL_R,COL_Y,COL_B]); }

// ============================
// Header
// ============================
function headerInit(){ const div=document.createElement('div'); div.id='headerText'; div.style.display='flex'; div.style.justifyContent='center'; div.style.fontFamily='sans-serif'; div.style.fontWeight='700'; div.style.margin='10px 0'; document.body.prepend(div); headerLayout(); }
function headerLayout(){ const div=document.getElementById('headerText'); const fs=Math.max(18,Math.min(42,Math.round(window.innerWidth/28))); div.style.fontSize=fs+'px'; }
function headerDraw(){ const div=document.getElementById('headerText'); let html=''; const n=noise(frameCount*noiseSpeed*2); const cMix=color(...colorByNoise(n)); for(let i=0;i<HEADER_TEXT.length;i++){ const rgb=`rgb(${red(cMix)},${green(cMix)},${blue(cMix)})`; html+=`<span style="display:inline-block;width:1.2em;text-align:center;color:${rgb}">${HEADER_TEXT[i]}</span>`; } div.innerHTML=html; }
function headerColorsReset(){ headerColors.length=0; for(let i=0;i<HEADER_TEXT.length;i++) headerColors.push(color(...colorByNoise(noise(i*0.2)))); headerLastUpdate=millis(); headerDraw(); }

// ============================
// 切换模式
// ============================
function keyPressed(){ 
  if(key===' '){
    animating=false; action='band'; animBand=null;
    if(mode==='A'){ resetB(); mode='B'; } 
    else{ resetA(); mode='A'; }
    headerColorsReset(); timerNext();
  }
}
