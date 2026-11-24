import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
const env={...process.env};for(const k of ['VK_DRIVER_FILES','VK_ICD_FILENAMES','__NV_PRIME_RENDER_OFFLOAD','__GLX_VENDOR_LIBRARY_NAME','__EGL_VENDOR_LIBRARY_FILENAMES','__VK_LAYER_NV_optimus','DRI_PRIME'])delete env[k];
const dir=process.env.OUT||'artifacts/interaction';await mkdir(dir,{recursive:true});const url=process.env.URL||'http://127.0.0.1:4195';
const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/home/a/.local/archpkg/pacman/usr/lib/chromium/chromium',env,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=gl-egl','--ignore-gpu-blocklist']});const errors=[],result={};const start=performance.now();
try{
 const p=await b.newPage({viewport:{width:1260,height:1260},acceptDownloads:true});p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{Object.defineProperty(navigator,'gpu',{value:undefined,configurable:true});});
 await p.goto(url+'/',{waitUntil:'domcontentloaded'});await p.getByRole('button',{name:'Use WebGL 2 instead'}).waitFor();
 result.noSilentFallback=await p.evaluate(()=>!window.__viewer.ready&&window.__viewer.backend==='');
 await p.getByRole('button',{name:'Use WebGL 2 instead'}).click();await p.waitForFunction(()=>window.__viewer.ready&&window.__viewer.backend==='webgl');
 result.explicitFallback=true;
 await p.selectOption('#resolution','1280x720');await p.waitForTimeout(250);result.landscape=await p.evaluate(()=>({render:[window.__viewer.renderer.domElement.width,window.__viewer.renderer.domElement.height],css:[document.querySelector('#stage').clientWidth,document.querySelector('#stage').clientHeight]}));
 await p.selectOption('#resolution','900x1200');await p.locator('[data-view=right]').click();await p.waitForTimeout(150);result.rightView=await p.evaluate(()=>window.__viewer.camera.position.x>8);
 await p.locator('[data-view=back]').click();await p.waitForTimeout(150);result.backView=await p.evaluate(()=>window.__viewer.camera.position.z<0);
 await p.locator('[data-view=front]').click();await p.waitForTimeout(150);
 const png=p.waitForEvent('download');await p.locator('#capture').click();const pngDL=await png;await pngDL.saveAs(dir+'/transparent.png');result.png=true;
 await p.selectOption('#style','studio');await p.waitForFunction(()=>window.__viewer?.ready&&location.search.includes('style=studio'));result.studioStyle=await p.evaluate(()=>{let n=0;window.__viewer.model.traverse(o=>{if(o.isMesh&&o.material?.isMeshStandardMaterial)n++});return n>0;});
 const glb=p.waitForEvent('download');await p.locator('#export').click();const dl=await glb;await dl.saveAs(dir+'/yuuka-gpt6-2-studio.glb');result.studioGlb=true;
 await p.setViewportSize({width:390,height:844});await p.waitForTimeout(200);result.mobileOverflow=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
}finally{await b.close();result.ms=Math.round(performance.now()-start);result.errors=errors;await writeFile(dir+'/results.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));}
