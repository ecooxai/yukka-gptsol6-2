import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
const dir=process.env.OUT||'artifacts/iteration-01';await mkdir(dir,{recursive:true});
const url=process.env.URL||'http://127.0.0.1:4176';
const env={...process.env};for(const k of ['VK_DRIVER_FILES','VK_ICD_FILENAMES','__NV_PRIME_RENDER_OFFLOAD','__GLX_VENDOR_LIBRARY_NAME','__EGL_VENDOR_LIBRARY_FILENAMES','__VK_LAYER_NV_optimus','DRI_PRIME'])delete env[k];
const launch={executablePath:process.env.CHROMIUM||'/home/a/.local/archpkg/pacman/usr/lib/chromium/chromium',env,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=gl-egl','--ignore-gpu-blocklist','--disable-background-timer-throttling','--disable-renderer-backgrounding']};
const browser=await chromium.launch(launch);
const page=await browser.newPage({viewport:{width:1260,height:1260},deviceScaleFactor:1,acceptDownloads:true});const errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text().slice(0,350));});
const tests={};
try{
 const start=performance.now();
 await page.goto(url+'/?backend=webgl&showcase=1',{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.__viewer?.ready&&window.__viewer.backend==='webgl',null,{timeout:60000});
 tests.webgl={ready:true,ms:Math.round(performance.now()-start)};
 tests.stats=await page.evaluate(()=>window.__viewer.stats());
 for(const v of ['front','three','right','back','left','detail']){
  const t=performance.now();await page.evaluate(v=>window.__viewer.setView(v),v);await page.waitForTimeout(300);
  await page.locator('#stage').screenshot({path:dir+'/'+v+'.png',timeout:60000});
  tests[v]={ms:Math.round(performance.now()-t)};
 }
 const t=performance.now();const dl=page.waitForEvent('download');await page.evaluate(()=>document.querySelector('#export').click());const d=await dl;await d.saveAs(dir+'/yuuka-gpt6-2.glb');tests.glb={ms:Math.round(performance.now()-t)};
 await page.evaluate(()=>{document.body.classList.remove('showcase');window.__viewer.setView('front');});await page.setViewportSize({width:390,height:844});await page.waitForTimeout(250);
 tests.mobile=await page.evaluate(()=>({render:[document.querySelector('canvas').width,document.querySelector('canvas').height],css:[document.querySelector('canvas').clientWidth,document.querySelector('canvas').clientHeight],horizontalOverflow:document.documentElement.scrollWidth>innerWidth}));
 await page.screenshot({path:dir+'/mobile.png',fullPage:true});
 tests.errors=errors;await writeFile(dir+'/results.json',JSON.stringify(tests,null,2));console.log(JSON.stringify(tests));
}finally{await browser.close();}
