import {chromium} from 'playwright';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
const dir=process.env.OUT||'artifacts/rig';await mkdir(dir,{recursive:true});
const env={...process.env};for(const k of ['VK_DRIVER_FILES','VK_ICD_FILENAMES','__NV_PRIME_RENDER_OFFLOAD','__GLX_VENDOR_LIBRARY_NAME','__EGL_VENDOR_LIBRARY_FILENAMES','__VK_LAYER_NV_optimus','DRI_PRIME'])delete env[k];
const gpu=process.env.BACKEND==='webgpu';if(gpu&&process.env.VK_TEST_DRIVER)env.VK_DRIVER_FILES=process.env.VK_TEST_DRIVER;
const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/home/a/.local/archpkg/pacman/usr/lib/chromium/chromium',env,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=gl-egl','--ignore-gpu-blocklist','--enable-unsafe-webgpu','--enable-features=Vulkan','--disable-background-timer-throttling']});
const p=await b.newPage({viewport:{width:1260,height:1260},acceptDownloads:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text().slice(0,350));});
const start=performance.now(),result={};
try{
 await p.goto((process.env.URL||'http://127.0.0.1:4201')+'/?backend='+(gpu?'webgpu':'webgl'),{waitUntil:'domcontentloaded',timeout:60000});
 await p.waitForFunction(()=>window.__viewer?.ready,null,{timeout:60000});
 Object.assign(result,await p.evaluate(()=>{
  const v=window.__viewer,r=v.rig,b=r.bones,model=v.model,metrics=v.stats(),meshes=[];let badWeights=0,nonfinite=0,maxWeightError=0;
  model.traverse(o=>{if(o.isMesh){meshes.push(o);const p=o.geometry.attributes.position.array;for(const a of p)if(!Number.isFinite(a))nonfinite++;}
   if(o.isSkinnedMesh){const w=o.geometry.attributes.skinWeight.array,ids=o.geometry.attributes.skinIndex.array;for(let i=0;i<w.length;i+=4){const sum=w[i]+w[i+1]+w[i+2]+w[i+3];maxWeightError=Math.max(maxWeightError,Math.abs(sum-1));if(Math.abs(sum-1)>1e-5||ids[i]>=b.length||ids[i+1]>=b.length||ids[i+2]>=b.length||ids[i+3]>=b.length)badWeights++;}}
  });
  r.reset();const rest=b.map(o=>o.quaternion.toArray());r.pose(1.45);const moved=b.filter((o,i)=>o.quaternion.toArray().some((a,j)=>Math.abs(a-rest[i][j])>.0001)).length;
  const tip=b[r.index.RIndex3],p1=tip.position.clone();tip.getWorldPosition(p1);r.reset();const p2=tip.position.clone();tip.getWorldPosition(p2);
  r.pose(1.93);const closedMorphs=r.faceMorphs.filter(m=>m.morphTargetInfluences[0]>.98).length;r.reset();const morphReset=r.faceMorphs.every(m=>Math.abs(m.morphTargetInfluences[0])<1e-6);
  const resetError=Math.max(...b.map((o,i)=>Math.max(...o.quaternion.toArray().map((a,j)=>Math.abs(a-rest[i][j])))));
  return {...metrics,badWeights,nonfinite,maxWeightError,movedBones:moved,animatedFingerTipMotion:p1.distanceTo(p2),resetError,closedMorphs,morphReset};
 }));
 await p.evaluate(()=>{window.__viewer.rig.pose(2.25);window.__viewer.setView('three');window.__viewer.render();});await p.waitForTimeout(180);await p.locator('#stage').screenshot({path:dir+'/animated-three.png'});
 await p.evaluate(()=>{window.__viewer.setView('front');window.__viewer.render();});await p.waitForTimeout(180);await p.locator('#stage').screenshot({path:dir+'/animated-front.png'});
 await p.evaluate(()=>{window.__viewer.rig.pose(1.93);window.__viewer.setView('detail');window.__viewer.render();});await p.waitForTimeout(180);await p.locator('#stage').screenshot({path:dir+'/blink-detail.png'});
 await p.evaluate(()=>{window.__viewer.rig.reset();window.__viewer.setView('front');});const before=await p.evaluate(()=>window.__viewer.renderCount);
 await p.locator('#idle').click();await p.waitForTimeout(850);const after=await p.evaluate(()=>window.__viewer.renderCount);await p.locator('#idle').click();result.idleRenderFrames=after-before;
 const dl=p.waitForEvent('download');await p.locator('#export').click();const d=await dl;await d.saveAs(dir+'/rigged.glb');
 const raw=await readFile(dir+'/rigged.glb'),len=raw.readUInt32LE(12),j=JSON.parse(raw.subarray(20,20+len).toString('utf8'));
 result.glb={bytes:raw.length,skins:j.skins?.length??0,joints:j.skins?.[0]?.joints?.length??0,animations:j.animations?.map(a=>({name:a.name,channels:a.channels.length}))??[],meshCount:j.meshes?.length??0,morphTargets:j.meshes?.filter(m=>m.primitives?.some(p=>p.targets?.length)).length??0};
 result.errors=errors;result.ms=Math.round(performance.now()-start);
 if(result.badWeights||result.nonfinite||result.restError>1e-5||result.movedBones<8||result.resetError>1e-5||result.closedMorphs<12||!result.morphReset||!result.glb.morphTargets||result.idleRenderFrames<2||!result.glb.skins||!result.glb.animations.length||errors.length)throw Error('Rig invariant failed');
 console.log(JSON.stringify(result));await writeFile(dir+'/results.json',JSON.stringify(result,null,2));
}finally{await b.close();}
