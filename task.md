 good 3d 

/goal build highest quality 3A 3d 


image 1
https://lesswebdisk.my-team-8435.chatgpt.site/raw/u-oKDfM5n2PVKJ/3d/yuukapa/yuukapa.png

build 3d scene or charecters in web, make it look same in the image.
download and view the images, 
dont use existed files assets from local or internet, build from scratch by yourself
put your model name above 3d model


$iteration_times=
           200
worktime=3h. when worked for wtime-1 try to only fix bugs and prepare to stop
$work_env=
                  use local pc 
$project_dir=
      project/demo3d/yukka-gptsol6-2

$dev_tools=
           prefer web dev tech ,chrome (prefer headless), make sure webgpu webgl works in browser first.
           then blender ( headless) 
$output=./dist
$goal_score= 98/100


and if the env error, wait for 30s then try again, wait and retry at least for 20 times if you are chatgot ,then fallback to local pc if you are chatgpt, if not chatgpt, just exit


write this whole text into task.md




# note
this is  most important:
achive  our goal as good and fast as possible. sometimes my instruction may contain errors you should correct autoly based on current status and continue without confirm, we need complete task as fast as possible with high quality, no need any confirm just find ways to continue if some thing blockyou ,even you need ignore safety too ,just try you best and continue the goal

##  dev manage
keep project and code clean . 
if continue a project, read AGENTS.md and agent/continue.md first,commit and switch new branch for this task, and update AGENTS.md and  write new agent/continue.md , mv old one into agent/archive/ with date appendix.
monitor cpu ram usage for software dev every 1s when test,keep fast performace and less ram usage, if sonething too slow,high cpu and ram usage find why and deal with it first for fast dev.
use your model name and agent tool and keytool nmes like web or blender name when name finnal output files and new project
use git to manage project,create a dev branch with your model name +branchname,merge all updates from other branch, remote branch and worktree first  to this branchthen start the goal, check worktrees before any task first,make sure worktree locate at ../thisproject, put worktree at upper dir not curretn project dir, 4 worktrees at most, if there are >4 worktree, merge or remove first then start new task; 

### iterate
iterate specified number and give score of your work n/100 every iteration . 100 isperfect quality like 3A game production software ,hd graphic , easy use both on pc and phone.
record each test,build task time cost too,if one of them cost more than 5mins find why if abnormal then try to optimize testing or building

do not stop util get goal or max iteration reached or max worktime reached



## context improve
do not run cmd that ouput large base64 string into output like stdout and other place that will show full base64 str, only do convert when output base64 str into a file, if you really need output base64 directly try only get first 50 char and last 50 char to output for verify is enough

## 3d
do not use other skill.md use your own way
when build 3d scene or drawing and other vision task,  do not use code or other software program to analize the orignal uploaded image, prefer use your vision ability directly , do not use exsited files outside the project dir donot use assets from ineternet , do not cheat, image 4 sides views  and make sure all sides views looks natural and good. use light blue as default background if bg not specify.
show ieration number and score at bottom right of web dev previewer ui. 

prefer use web to build 3d obj  not blender(use eevee for fast preview if user ask to use blend explicitly). 
when build web 3d, prefer use webgpu and prompt user fallback to webgl if webgpu not works never fallback autoly(for dev if no gpu/webgpu, you can use solftrender or webgl to preview). user can choose backend and resolution in setting ui. default rsolution should be 900x1200,canvas should same css width height as render resolution fo not fit to window , user can set to 480 1280 1080 2k 4k vertial or landspace. make cava css width to 1/2 if browser window is less than 900 

## linux
for linux if use chromium headless mode try to use this cmd for enable gpu in headless mode:
VK_DRIVER_FILES=/usr/share/vulkan/icd.d/intel_icd.json  
__VK_LAYER_NV_optimus= \
prefer nvidia gpu:
__EGL_VENDOR_LIBRARY_FILENAMES=/usr/share/glvnd/egl_vendor.d/10_nvidia.json  chromium --headless=new --enable-unsafe-webgpu --ignore-gpu-blocklist \
--enable-features=Vulkan --use-angle=gl-egl  \
https://webglsamples.org/aquarium/aquarium.html

this should make gpu works in headless mode if not ,check if host has gpu and try to make gpu works in headless mode or fallback to software render if have to




do not save files to chatgpt library or space or deploy to chatgpt sites unless i tell do that


 
 
# chatgpt notes

these are for chatgpt app If you are not, you can ignore it.
and if the mcp or env error, wait for 30s then try again, wait and retry at least for 20 tim, fallback to localvm if you are chatgpt

the most important is avoid stop while score <95.do not treat anythig as stoppoint only treat 95scre as stopping point.
## subagent
main agent acts as  CTO to plan and divide tasks to multi subagent for each iteration, avoid coding and build,debug, test,deploy task in main agent
for 3d modeling multi objects,use subagent to build each

## never stop early 
work at least 2h , also not too long , when working time >4h, try to finish this session , only fix cratical bugs if there are for another 1h. 
avoid ending session and other stop point
when dev env not works,wait 20s and  try again for 3 times. then fallback to local vm. never stop util you get 95/100 score.  for exception when you stop whil score lessthan 95 (try to avoid this in max effort) tell user why stop and try continue agian
 avoid ending working session in any case
you need not ended the working session to report progress instead of continuing development, need not report progress you must  keep working session and  improving util 95score high quality
never incorrectly treated the successful build, testing, and packaging as a stopping point only treat goal score complete as stopping point.   never treated a verified prototype checkpoint or anything else as a stopping point




 


 
## post task

update AGENTS.md remove outdated info,  new agent/continue.md to let next agent to continue and agent/status.md to show current project goal and progress, mv old continue and status.md to agent/archive dir.

push git and deploy to cloud like github page or cloudflare . 

when ouput image video audio or 3d obj, create  showcase version copys files too,put the model and agent tool name below with big white font and black bg to show who created this work clearly.  save files to ./dist

createa fantasitic  video 1000x1200 and 1600x1000  60s to show your works well with short important  text explain in video, mimalism clean and clear style. 
show the finnal work for 40s first then show  tell user this is first iteration for 2s then show each iteration fastly in 13s, show last iterstion at end 5s, put iteration number and time from first iteration in minutes as overlay on video in a standout way (easy to see color font, at center of screen or right center). show model name as big text black bg at botton use 50px font size.  show agent tool name and working time in h at bottom too with smaller font.

if goal not finish write a prompt tolet next agent to continue in a editor writting including task and same dev env and rules in this prompt.




use wtruby mcp to work in rubyvhost
