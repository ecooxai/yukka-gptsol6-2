import {chromium} from 'playwright';import {writeFile,mkdir} from 'node:fs/promises';import {performance} from 'node:perf_hooks';
const dir=process.env.OUT||'artifacts/performance';await mkdir(dir,{recursive:true});
const env={...process.env};for(const k of ['VK_DRIVER_FILES','VK_ICD_FILENAMES','__NV_PRIME_RENDER_OFFLOAD','__GLX_VENDOR_LIBRARY_NAME','__EGL_VENDOR_LIBRARY_FILENAMES','__VK_LAYER_NV_optimus','DRI_PRIME'])delete env[k];
if(process.env.VK_TEST_DRIVER)env.VK_DRIVER_FILES=process.env.VK_TEST_DRIVER;
const backend=process.env.BACKEND||'webgl';
const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/home/a/.local/archpkg/pacman/usr/lib/chromium/chromium',env,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=gl-egl','--ignore-gpu-blocklist','--enable-unsafe-webgpu','--enable-features=Vulkan','--disable-background-timer-throttling']});
const result={backend,cases:[]};
try{
 for(const mode of ['0','1']){
  const p=await b.newPage({viewport:{width:1260,height:1260}}),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text().slice(0,300));});
  const t=performance.now();await p.goto((process.env.URL||'http://127.0.0.1:4201')+'/?backend='+backend+'&batch='+mode,{waitUntil:'domcontentloaded',timeout:60000});
  await p.waitForFunction(()=>window.__viewer?.ready,null,{timeout:60000});
  const init=performance.now()-t;await p.waitForTimeout(300);
  await p.locator('#stage').screenshot({path:dir+'/batch-'+mode+'.png'});
  const test=await p.evaluate(async()=>{
   const v=window.__viewer,stats=v.stats();v.rig.reset();v.render();
   const renderer=v.renderer,info=renderer.info;const start=v.renderCount;
   document.querySelector('#idle').click();
   const t0=performance.now();await new Promise(r=>setTimeout(r,1600));const dt=performance.now()-t0,frames=v.renderCount-start;
   document.querySelector('#idle').click();
   const mem=performance.memory?{jsHeap:performance.memory.usedJSHeapSize,totalHeap:performance.memory.totalJSHeapSize}:null;
   return {stats,frames,elapsedMs:dt,fps:frames*1000/dt,drawCalls:info?.render?.calls??info?.render?.drawCalls??null,mem};
  });
  result.cases.push({batch:mode,initMs:Math.round(init),...test,errors});await p.close();
 }
 console.log(JSON.stringify(result));await writeFile(dir+'/results.json',JSON.stringify(result,null,2));
}finally{await b.close();}
