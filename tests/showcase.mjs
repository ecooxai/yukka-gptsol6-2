import {chromium} from 'playwright';
import {mkdir,stat,writeFile} from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
const env={...process.env};for(const k of ['VK_DRIVER_FILES','VK_ICD_FILENAMES','__NV_PRIME_RENDER_OFFLOAD','__GLX_VENDOR_LIBRARY_NAME','__EGL_VENDOR_LIBRARY_FILENAMES','__VK_LAYER_NV_optimus','DRI_PRIME'])delete env[k];
const dir='dist/showcase',out='artifacts/showcase';await mkdir(out,{recursive:true});
const base=await stat('artifacts/iteration-03/front.png'),start=await stat('reference/yuukapa.png');
const iters=[['03',65,'First procedural sculpture'],['04',76,'Face and garment refinement'],['06',80,'Cel shading and ink contours'],['07',83,'Pose, pillow and mesh optimization'],['08',84,'Native WebGPU and final polish']];
const history=await Promise.all(iters.map(async([n,score,note],i)=>({n:i+1,score,note,minutes:Math.max(0,Math.round(((await stat('artifacts/iteration-'+n+'/front.png')).mtimeMs-base.mtimeMs)/60000)),url:'./showcase/iterations/iteration-'+(i+1)+'.png'})));
const workHours=((Date.now()-start.mtimeMs)/3600000).toFixed(2);
const b=await chromium.launch({executablePath:'/home/a/.local/archpkg/pacman/usr/lib/chromium/chromium',env,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=gl-egl','--ignore-gpu-blocklist','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows']});
try{
 const p=await b.newPage({viewport:{width:1100,height:1250},acceptDownloads:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')console.log('BROWSER',m.text().slice(0,160));});
 await p.goto((process.env.URL||'http://127.0.0.1:4194')+'/?backend=webgl&showcase=1&res=1000x1200',{waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>window.__viewer?.ready,null,{timeout:30000});await p.waitForTimeout(250);
 const result=await p.evaluate(async({history,workHours})=>{
  const source=window.__viewer.renderer.domElement,api=window.__viewer;
  const pics=await Promise.all(history.map(h=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=h.url;})));
  const canvases=[[1000,1200,'portrait'],[1600,1000,'landscape']].map(([w,h,name])=>{const c=document.createElement('canvas');c.width=w;c.height=h;c.style.cssText='position:fixed;left:-10000px;top:0';document.body.append(c);return {c,ctx:c.getContext('2d',{alpha:false}),w,h,name};});
  function title(ctx,text,x,y,size=24,color='#22354d',weight=700,align='left'){ctx.font=weight+' '+size+'px Arial,sans-serif';ctx.textAlign=align;ctx.textBaseline='alphabetic';ctx.fillStyle=color;ctx.fillText(text,x,y);}
  function draw(spec,t){
   const {ctx,w,h}=spec,land=w>h,footer=112,ch=h-footer;
   const grad=ctx.createRadialGradient(w*.55,ch*.38,0,w*.55,ch*.38,Math.max(w,ch)*.80);grad.addColorStop(0,'#fbfdff');grad.addColorStop(.54,'#eaf5fe');grad.addColorStop(1,'#ccdfef');ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
   const modelScale=land?Math.min((ch-8)/source.height,920/source.width):Math.min((ch-6)/source.height,(w-10)/source.width),mw=source.width*modelScale,mh=source.height*modelScale,mx=land?w*.57-mw*.5:(w-mw)*.5,my=(ch-mh)*.5;
   let phase='FINAL SCULPTURE',caption='Original procedural geometry',iteration=history[4];
   if(t<40){
    if(t<5){phase='YUUKA';caption='Night routine · anime character study';}
    else if(t<26){phase='360° SCULPTURE';caption='Layered indigo hair · tailored cat-print pajamas';}
    else if(t<34){phase='FACIAL DETAIL';caption='Violet irises · blush · layered bangs';}
    else{phase='FINAL DETAILS';caption='Pillow · bow headband · luminous halo';}
    ctx.drawImage(source,mx,my,mw,mh);
   }else if(t<42){
    phase='FIRST ITERATION';caption='The original procedural blockout';iteration=history[0];
    const im=pics[0],sc=Math.min((ch-26)/(im.height-100),(land?830:w-100)/im.width),iw=im.width*sc,ih=(im.height-100)*sc;ctx.drawImage(im,0,75,im.width,im.height-100,land?w*.62-iw/2:(w-iw)/2,(ch-ih)/2,iw,ih);
   }else if(t<55){
    const i=Math.min(4,Math.floor((t-42)/2.6));iteration=history[i];phase='ITERATION '+String(i+1).padStart(2,'0');caption=iteration.note;
    const im=pics[i],sc=Math.min((ch-26)/(im.height-100),(land?830:w-100)/im.width),iw=im.width*sc,ih=(im.height-100)*sc;ctx.drawImage(im,0,75,im.width,im.height-100,land?w*.62-iw/2:(w-iw)/2,(ch-ih)/2,iw,ih);
   }else{phase='CURRENT VERSION';caption='Original meshes · two graphics backends';ctx.drawImage(source,mx,my,mw,mh);}
   const tx=land?55:30,ty=land?114:53;
   title(ctx,phase,tx,ty,land?37:27,'#23374d',800);
   title(ctx,caption,tx,ty+(land?40:28),land?18:15,'#56718c',500);
   if(t>=40&&t<55){
    const bx=land?55:30,by=land?ch*.53:ch*.62;ctx.fillStyle='rgba(239,248,255,.88)';ctx.fillRect(bx-10,by-47,land?300:220,100);
    title(ctx,'+'+iteration.minutes+' MIN',bx,by,land?40:31,'#4f5696',800);
    title(ctx,iteration.score+'/100 · SELF SCORE',bx,by+30,land?19:15,'#456078',700);
   }else{
    title(ctx,'ITERATION 05 · 84/100',land?w-42:w-26,ch-22,land?20:17,'#4a6283',700,'right');
   }
   ctx.fillStyle='#10151e';ctx.fillRect(0,ch,w,footer);
   title(ctx,'GPT-6.2',w/2,ch+57,50,'#ffffff',800,'center');
   title(ctx,'CHATGPT · WEB 3D · WORK TIME AT CAPTURE '+workHours+' H',w/2,ch+87,land?18:16,'#b9c7db',600,'center');
  }
  const mime=MediaRecorder.isTypeSupported('video/webm;codecs=vp9')?'video/webm;codecs=vp9':'video/webm;codecs=vp8';
  const recorders=canvases.map(s=>{const stream=s.c.captureStream(24);const chunks=[];const r=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:6000000});r.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};const done=new Promise(resolve=>{r.onstop=()=>resolve(new Blob(chunks,{type:'video/webm'}));});return {r,done,...s};});
  api.setView('front');api.render();for(const s of recorders)draw(s,0);
  recorders.forEach(s=>s.r.start(1000));const t0=performance.now();let frames=0,last=-1,mode='';
  await new Promise(resolve=>{
   function tick(){
    const t=(performance.now()-t0)/1000;if(t>=60){resolve();return;}
    const step=Math.floor(t*24);if(step!==last){last=step;frames++;
      if(t<5){if(mode!=='front'){api.setView('front');mode='front';}api.setAngle(.08*Math.sin(t*.45),.025);api.render();}
      else if(t<26){if(mode!=='orbit'){api.setView('front');mode='orbit';}api.setAngle((t-5)/21*Math.PI*2,.035+.035*Math.sin((t-5)/21*Math.PI));api.render();}
      else if(t<34){if(mode!=='detail'){api.setView('detail');mode='detail';}api.setAngle(.16*Math.sin((t-26)/8*Math.PI*2),.025);api.render();}
      else if(t<40){if(mode!=='three'){api.setView('three');mode='three';}api.setAngle(.70*(1-(t-34)/6),.06);api.render();}
      else if(t>=55){if(mode!=='last'){api.setView('front');mode='last';}api.setAngle(.12*Math.sin((t-55)/5*Math.PI),.025);api.render();}
      for(const s of recorders)draw(s,t);
    }requestAnimationFrame(tick);
   }requestAnimationFrame(tick);
  });
  recorders.forEach(s=>s.r.stop());const blobs=await Promise.all(recorders.map(s=>s.done));
  window.__recordings=blobs;
  window.__saveRecording=i=>{const a=document.createElement('a');a.href=URL.createObjectURL(blobs[i]);a.download='yuuka-'+recorders[i].name+'.webm';a.click();};
  return {frames,seconds:(performance.now()-t0)/1000,mime,sizes:blobs.map(b=>b.size),workHours,history};
 },{history,workHours});
 for(let i=0;i<2;i++){const pending=p.waitForEvent('download',{timeout:30000});await p.evaluate(i=>window.__saveRecording(i),i);const dl=await pending;await dl.saveAs(out+'/'+(i===0?'portrait':'landscape')+'.webm');}
 // Save branded stills directly from the last composited video canvas.
 await writeFile(out+'/recording.json',JSON.stringify({...result,errors},null,2));console.log(JSON.stringify({...result,errors}));
}finally{await b.close();}
