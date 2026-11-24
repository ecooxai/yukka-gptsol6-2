import {chromium} from 'playwright';
import {writeFile,mkdir} from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
const env={...process.env};for(const k of ['VK_DRIVER_FILES','VK_ICD_FILENAMES','__NV_PRIME_RENDER_OFFLOAD','__GLX_VENDOR_LIBRARY_NAME','__EGL_VENDOR_LIBRARY_FILENAMES','__VK_LAYER_NV_optimus','DRI_PRIME'])delete env[k];
if(process.env.VK_TEST_DRIVER)env.VK_DRIVER_FILES=process.env.VK_TEST_DRIVER;
const dir=process.env.OUT||'artifacts/webgpu';await mkdir(dir,{recursive:true});const start=performance.now();const errors=[];
let b;const result={};
try{
 b=await chromium.launch({executablePath:process.env.CHROMIUM||'/home/a/.local/archpkg/pacman/usr/lib/chromium/chromium',env,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=gl-egl','--enable-unsafe-webgpu','--ignore-gpu-blocklist','--enable-features=Vulkan','--disable-background-timer-throttling'],timeout:15000});
 const p=await b.newPage({viewport:{width:1000,height:1240}});p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text().slice(0,350));});
 await p.goto((process.env.URL||'http://127.0.0.1:4193')+'/?showcase=1',{waitUntil:'domcontentloaded',timeout:30000});
 await p.waitForFunction(()=>!!window.__viewer&&(window.__viewer.ready||!document.querySelector('#error').hidden),null,{timeout:38000});
 Object.assign(result,await p.evaluate(()=>({exposed:!!navigator.gpu,ready:window.__viewer.ready,backend:window.__viewer.backend,status:document.querySelector('#status').textContent,error:document.querySelector('#error').textContent,explicitFallbackButton:!!Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Use WebGL 2 instead'&&!b.closest('[hidden]'))})));
 if(result.ready){await p.waitForTimeout(250);await p.locator('#stage').screenshot({path:dir+'/front.png',timeout:20000});}
 else if(result.explicitFallbackButton){await p.getByRole('button',{name:'Use WebGL 2 instead'}).click();await p.waitForFunction(()=>window.__viewer.ready&&window.__viewer.backend==='webgl',null,{timeout:20000});result.fallbackWorked=true;}
}catch(e){result.failure=e.message.slice(0,600);}
finally{await b?.close();result.ms=Math.round(performance.now()-start);result.errors=errors;console.log(JSON.stringify(result));await writeFile(dir+'/results.json',JSON.stringify(result,null,2));}
