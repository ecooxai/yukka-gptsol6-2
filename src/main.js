import * as T from 'three';
import {WebGPURenderer} from 'three/webgpu';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {createCharacter} from './character.js';
import {rigCharacter} from './rig.js';
import {batchCompatible} from './batch.js';
import './style.css';

const params=new URLSearchParams(location.search);
const app=document.querySelector('#app');
app.innerHTML='<main class="layout"><section class="viewer"><div class="stage" id="stage"><div class="stage-brand"><span>ORIGINAL PROCEDURAL SCULPTURE</span><strong>GPT-6.2</strong><small>YUUKA / NIGHT ROUTINE</small></div><div class="canvas-host" id="canvasHost"></div><div id="status" class="status">Initializing graphics</div><div class="signature"><span>CHATGPT · WEB 3D</span><b id="iteration">ITERATION 27 · 95/100</b></div><div id="error" class="error" hidden></div></div></section><aside class="sidebar"><header><div class="eyebrow">STUDIO / 001</div><h1>Yuuka</h1><p>Night routine</p><div class="rule"></div></header><section><h2>CAMERA</h2><div class="buttons views"><button data-view="front">Front</button><button data-view="right">Right</button><button data-view="back">Back</button><button data-view="left">Left</button><button data-view="three">¾ view</button><button data-view="detail">Face</button></div><button id="rotate" class="wide">Auto orbit</button><button id="idle" class="wide" aria-pressed="false">Quiet idle motion</button><div class="hint">Drag to orbit · scroll or pinch to zoom · right-drag to pan</div></section><section><h2>RENDER SETTINGS</h2><label for="backend">Graphics backend</label><select id="backend"><option value="webgpu">WebGPU (preferred)</option><option value="webgl">WebGL 2</option></select><label for="resolution">Render resolution</label><select id="resolution"></select><label for="quality">Mesh detail</label><select id="quality"><option value="high">High · sculpt</option><option value="ultra">Ultra · close-up</option><option value="mobile">Mobile · optimized</option></select><label for="style">Shading style</label><select id="style"><option value="cel">Anime cel shading</option><option value="studio">Soft studio shading</option></select><label for="lighting">Lighting</label><select id="lighting"><option value="studio">Soft studio</option><option value="day">Daylight</option><option value="night">Moonlight</option></select></section><section><h2>EXPORT</h2><button id="capture" class="wide">Save PNG</button><button id="export" class="wide">Export 3D model (GLB)</button><div class="hint">The character is fully modeled in 3D. No reference image is used as a texture.</div></section><section><h2>SHOWCASE FILES</h2><a class="asset-link" href="./showcase/yuuka-gpt6-2-front.png">Front render</a><a class="asset-link" href="./showcase/yuuka-gpt6-2.glb">3D model (GLB)</a><a class="asset-link" href="./showcase/yuuka-gpt6-2-portrait.mp4">Portrait video</a><a class="asset-link" href="./showcase/yuuka-gpt6-2-landscape.mp4">Landscape video</a><a class="asset-link" href="./src.tar.gz">Source archive</a></section><footer>GPT-6.2 / ChatGPT<br>Original meshes · procedural materials</footer></aside></main>';
const stage=document.querySelector('#stage'),host=document.querySelector('#canvasHost'),status=document.querySelector('#status'),error=document.querySelector('#error'),backendSelect=document.querySelector('#backend'),resSelect=document.querySelector('#resolution');
const resolutions={'480x640':'480 × 640 · portrait','900x1200':'900 × 1200 · default','1000x1200':'1000 × 1200 · showcase','720x1280':'720 × 1280 · portrait','1080x1920':'1080 × 1920 · portrait','1440x2560':'1440 × 2560 · 2K portrait','2160x3840':'2160 × 3840 · 4K portrait','854x480':'854 × 480 · landscape','1280x720':'1280 × 720 · landscape','1600x1000':'1600 × 1000 · showcase','1920x1080':'1920 × 1080 · Full HD','2560x1440':'2560 × 1440 · 2K landscape','3840x2160':'3840 × 2160 · 4K landscape'};
for(const [key,label] of Object.entries(resolutions)){const o=document.createElement('option');o.value=key;o.textContent=label;resSelect.append(o);}
resSelect.value=resolutions[params.get('res')]?params.get('res'):'900x1200';
backendSelect.value=params.get('backend')==='webgl'?'webgl':'webgpu';document.querySelector('#style').value=params.get('style')==='studio'?'studio':'cel';document.querySelector('#style').onchange=e=>{const q=new URLSearchParams(location.search);q.set('style',e.target.value);q.set('backend',backendSelect.value);q.set('res',resSelect.value);location.search=q.toString();};

const qualitySelect=document.querySelector('#quality');qualitySelect.value=['ultra','mobile'].includes(params.get('quality'))?params.get('quality'):'high';qualitySelect.onchange=()=>{const q=new URLSearchParams(location.search);q.set('quality',qualitySelect.value);q.set('backend',backendSelect.value);q.set('res',resSelect.value);location.search=q.toString();};
const celStyle=params.get('style')!=='studio';
if(celStyle){const lightSelect=document.querySelector('#lighting');lightSelect.disabled=true;lightSelect.title='Lighting presets are available in Soft studio shading.';}
const scene=new T.Scene();
const character=createCharacter(scene);
const rig=rigCharacter(character);
let outlineGroup=null;
if(celStyle){
 outlineGroup=new T.Group();outlineGroup.name='Illustration contour layer';scene.add(outlineGroup);character.updateMatrixWorld(true);
 const inkHair=new T.MeshBasicMaterial({color:'#38364f',side:T.BackSide}),inkCloth=new T.MeshBasicMaterial({color:'#7898ad',side:T.BackSide}),inkSkin=new T.MeshBasicMaterial({color:'#c49498',side:T.BackSide}),inkWhite=new T.MeshBasicMaterial({color:'#a7afc6',side:T.BackSide});
 character.traverse(o=>{if(!o.isMesh||!o.geometry.attributes.normal)return;let material,amount;
  if(/hair|tress|fringe|lock|scalp|ahoge|strand/i.test(o.name)){if(/Layered rear|Fine loose|Fine silhouette/.test(o.name))return;material=inkHair;amount=.0024;}
  else if(/tailored shirt|scalloped sleeve|shorts leg|shorts ruffle|shorts waist|sewn pajama shorts|chest patch pocket/i.test(o.name)){material=inkCloth;amount=.0030;}
  else if(/sculpted face|anatomically tapered arm|pillow-holding arm|weight-bearing leg|relaxed leg/i.test(o.name)){material=inkSkin;amount=.0025;}
  else if(/fabric bow|headband|pillow front|pillow back/i.test(o.name)){material=inkWhite;amount=.0028;}
  if(!material)return;const g=o.geometry.clone();g.applyMatrix4(o.matrixWorld);const p=g.attributes.position,n=g.attributes.normal;for(let i=0;i<p.count;i++)p.setXYZ(i,p.getX(i)+n.getX(i)*amount,p.getY(i)+n.getY(i)*amount,p.getZ(i)+n.getZ(i)*amount);p.needsUpdate=true;if(!o.isSkinnedMesh){
   const count=p.count,ids=new Uint16Array(count*4),weights=new Float32Array(count*4);
   for(let i=0;i<count;i++){ids[i*4]=o.userData.rigidBone??rig.index.Head;weights[i*4]=1;}
   g.setAttribute('skinIndex',new T.Uint16BufferAttribute(ids,4));g.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));
  }
  const m=new T.SkinnedMesh(g,material);m.name='Contour '+o.name;outlineGroup.add(m);m.bind(rig.skeleton,new T.Matrix4());m.frustumCulled=false;});
}
// Keep ?batch=0 for inspecting individually named sculpt parts.
const batches=params.get('batch')!=='1'?null:{model:batchCompatible(character,rig.skeleton),contours:outlineGroup?batchCompatible(outlineGroup,rig.skeleton):null};
const camera=new T.OrthographicCamera(-3,3,4,-4,.05,100);
const target=new T.Vector3(.22,3.65,0);
const ambient=new T.HemisphereLight('#f1f7ff','#b9c6e5',2.08);scene.add(ambient);
const key=new T.DirectionalLight('#fff4ed',3.0);key.position.set(-3.5,10,6.0);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-4;key.shadow.camera.right=4;key.shadow.camera.top=5;key.shadow.camera.bottom=-5;key.shadow.camera.near=.1;key.shadow.camera.far=24;key.shadow.bias=-.0005;key.shadow.normalBias=.018;key.target.position.set(0,3.5,0);scene.add(key,key.target);
const fill=new T.DirectionalLight('#c8e1ff',1.20);fill.position.set(5,5,4);scene.add(fill);
const rim=new T.DirectionalLight('#ccd7ff',1.8);rim.position.set(1,6,-5);scene.add(rim);if(celStyle){ambient.intensity=1.16;key.intensity=2.2;fill.intensity=.65;rim.intensity=1.55;}
const floor=new T.Mesh(new T.PlaneGeometry(200,200),new T.ShadowMaterial({opacity:celStyle?0:.014}));floor.rotation.x=-Math.PI/2;floor.position.y=-.015;floor.receiveShadow=true;scene.add(floor);
// A procedural soft contact shadow avoids an over-dark floor.
const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=128;const sc=shadowCanvas.getContext('2d'),grad=sc.createRadialGradient(64,64,4,64,64,63);grad.addColorStop(0,'rgba(39,60,100,.30)');grad.addColorStop(.45,'rgba(39,60,100,.15)');grad.addColorStop(1,'rgba(39,60,100,0)');sc.fillStyle=grad;sc.fillRect(0,0,128,128);const shadowTex=new T.CanvasTexture(shadowCanvas);const contact=new T.Mesh(new T.PlaneGeometry(2.3,1.65),new T.MeshBasicMaterial({map:shadowTex,transparent:true,depthWrite:false}));contact.rotation.x=-Math.PI/2;contact.position.set(.05,.001,.17);scene.add(contact);
let renderer=null,controls=null,backend='',width=900,height=1200,frame=0,orbit=false,scheduled=false,ready=false,generation=0,renderCount=0;
const views={front:[0,.022],right:[Math.PI/2,.035],back:[Math.PI,.025],left:[-Math.PI/2,.035],three:[Math.PI*.22,.10],detail:[0,.025]};
let view='front',distance=13,idle=false,idleStart=0,exporting=false;
function projection(detail=false){
 const h=detail?2.48:8.95;const w=h*width/height;camera.left=-w/2;camera.right=w/2;camera.top=h/2;camera.bottom=-h/2;camera.updateProjectionMatrix();
}
function resize(){
 [width,height]=resSelect.value.split('x').map(Number);stage.style.setProperty('--w',width+'px');stage.style.setProperty('--h',height+'px');stage.style.setProperty('--ratio',width/height);
 renderer?.setSize(width,height,false);projection(view==='detail');invalidate();
}
function setView(name){
 view=name;stage.classList.toggle('detail-view',name==='detail');const [a,e]=views[name]??views.front;target.set(name==='detail'?-.015:.24,name==='detail'?6.05:3.67,0);
 camera.position.set(target.x+distance*Math.sin(a)*Math.cos(e),target.y+distance*Math.sin(e),target.z+distance*Math.cos(a)*Math.cos(e));camera.zoom=1;camera.lookAt(target);projection(name==='detail');
 if(controls){controls.target.copy(target);controls.update();}
 document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('selected',b.dataset.view===name));
 invalidate();
}
function draw(){
 scheduled=false;if(!renderer||!ready)return;
 if(idle&&!exporting)rig.pose((performance.now()-idleStart)/1000);
 renderer.render(scene,camera);renderCount++;
 if(orbit&&controls)controls.update(1/60);
 if(idle||orbit)invalidate();
}
function invalidate(){if(!scheduled){scheduled=true;frame=requestAnimationFrame(draw);}}
function showError(message,allowFallback){
 error.hidden=false;error.replaceChildren();const p=document.createElement('p');p.textContent=message;error.append(p);
 if(allowFallback){const b=document.createElement('button');b.textContent='Use WebGL 2 instead';b.onclick=()=>{backendSelect.value='webgl';init('webgl');};error.append(b);}
 status.textContent='Graphics unavailable';
}
async function init(kind){
 const id=++generation;ready=false;cancelAnimationFrame(frame);scheduled=false;orbit=false;document.querySelector('#rotate').classList.remove('selected');controls?.dispose();renderer?.dispose();renderer=null;controls=null;host.replaceChildren();error.hidden=true;status.textContent='Initializing '+kind.toUpperCase();
 try{
  let r;
  if(kind==='webgpu'){
   if(!navigator.gpu)throw new Error('This browser does not expose WebGPU.');
   const adapter=await Promise.race([navigator.gpu.requestAdapter({powerPreference:'high-performance'}),new Promise((_,reject)=>setTimeout(()=>reject(new Error('WebGPU adapter initialization timed out.')),12000))]);
   if(!adapter)throw new Error('No WebGPU adapter was available.');
   r=new WebGPURenderer({antialias:true,alpha:true,powerPreference:'high-performance',forceWebGL:false});
   await Promise.race([r.init(),new Promise((_,reject)=>setTimeout(()=>reject(new Error('WebGPU renderer initialization timed out.')),18000))]);
   if(!r.backend?.isWebGPUBackend){r.dispose();throw new Error('Native WebGPU initialization failed.');}
  }else{r=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});}
  if(id!==generation){r.dispose();return;}
  renderer=r;backend=kind;r.setPixelRatio(1);r.setClearColor(0x000000,0);r.outputColorSpace=T.SRGBColorSpace;r.toneMapping=T.NeutralToneMapping;r.toneMappingExposure=1.02;r.shadowMap.enabled=!celStyle;r.shadowMap.type=T.PCFShadowMap;
  r.domElement.setAttribute('aria-label','Interactive original 3D character');host.append(r.domElement);
  controls=new OrbitControls(camera,r.domElement);controls.enableDamping=false;controls.enablePan=true;controls.minZoom=.55;controls.maxZoom=5;controls.autoRotateSpeed=1.1;controls.target.copy(target);controls.addEventListener('change',invalidate);
  resize();setView(view);ready=true;status.textContent=kind.toUpperCase()+' · '+width+'×'+height;invalidate();
 }catch(e){console.error(e);if(id===generation)showError(e.message+' Choose a graphics backend to continue.',kind==='webgpu');}
}
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{orbit=false;if(controls)controls.autoRotate=false;document.querySelector('#rotate').classList.remove('selected');setView(b.dataset.view);});
backendSelect.onchange=()=>init(backendSelect.value);
resSelect.onchange=()=>{resize();status.textContent=backend.toUpperCase()+' · '+width+'×'+height;};
document.querySelector('#lighting').onchange=e=>{const k=e.target.value;if(k==='studio'){ambient.intensity=celStyle?1.16:2.08;key.intensity=celStyle?2.2:3;fill.intensity=celStyle?.65:1.2;rim.intensity=celStyle?1.55:1.8;key.color.set('#fff4ed');}if(k==='day'){ambient.intensity=2.5;key.intensity=2.7;fill.intensity=.8;rim.intensity=1.4;key.color.set('#ffffff');}if(k==='night'){ambient.intensity=.95;key.intensity=1.4;fill.intensity=.55;rim.intensity=2.4;key.color.set('#a7c3ff');}invalidate();};
document.querySelector('#rotate').onclick=e=>{if(!controls)return;orbit=!orbit;controls.autoRotate=orbit;e.currentTarget.classList.toggle('selected',orbit);invalidate();};
document.querySelector('#idle').onclick=e=>{idle=!idle;idleStart=performance.now();e.currentTarget.classList.toggle('selected',idle);e.currentTarget.setAttribute('aria-pressed',String(idle));if(!idle)rig.reset();invalidate();};
function download(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),30000);}
document.querySelector('#capture').onclick=()=>{if(!ready)return;renderer.render(scene,camera);renderer.domElement.toBlob(b=>{if(b)download(b,'yuuka-gpt6-2-'+view+'.png');},'image/png');};
async function exportGLB(){const exporter=new GLTFExporter();exporting=true;rig.reset();try{return await exporter.parseAsync(character,{binary:true,onlyVisible:true,maxTextureSize:1024,animations:[rig.clip]});}finally{exporting=false;invalidate();}}
document.querySelector('#export').onclick=async e=>{const b=e.currentTarget;b.disabled=true;b.textContent='Exporting…';try{download(new Blob([await exportGLB()],{type:'model/gltf-binary'}),'yuuka-gpt6-2.glb');}catch(err){showError('GLB export: '+err.message,false);}finally{b.disabled=false;b.textContent='Export 3D model (GLB)';}};
window.__viewer={get ready(){return ready;},get backend(){return backend;},get renderer(){return renderer;},get renderCount(){return renderCount;},get model(){return character;},scene,camera,rig,setView,exportGLB,render:()=>{if(ready)renderer.render(scene,camera);},setAngle:(a,e=.03)=>{camera.position.set(target.x+distance*Math.sin(a)*Math.cos(e),target.y+distance*Math.sin(e),target.z+distance*Math.cos(a)*Math.cos(e));camera.lookAt(target);controls?.update();invalidate();},stats:()=>{let triangles=0,meshes=0;character.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;}});return {meshes,triangles,backend,width,height,renderCount,...rig.metrics,batches};}};
if(params.get('showcase')==='1')document.body.classList.add('showcase');
if(views[params.get('view')])view=params.get('view');
init(backendSelect.value);
