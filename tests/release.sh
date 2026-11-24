#!/usr/bin/env bash
set -euo pipefail
n=$(python -c 'import json; print(json.load(open("agent/history.json"))[-1]["n"])')
revision=$(git rev-parse HEAD)
root="artifacts/release-$n"
mkdir -p "$root"
port=4194
tests/monitor.sh "$root/resources.csv" & mon=$!
trap 'kill "$mon" "\${server:-0}" 2>/dev/null || true' EXIT
TIMEFORMAT='BUILD_SECONDS=%3R'; time npm run build 2>&1 | tee "$root/build.log"
mkdir -p dist/showcase/{iterations,metrics}
python - <<'PY'
import json,shutil
from pathlib import Path
for h in json.load(open('agent/history.json')):
 shutil.copy2(h['path'],Path('dist/showcase/iterations')/('iteration-'+str(h['n'])+'.png'))
PY
node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port "$port" --strictPort > "$root/preview.log" 2>&1 & server=$!
for i in $(seq 1 25); do curl -fs "http://127.0.0.1:$port/" >/dev/null && break; sleep 1; done
export URL="http://127.0.0.1:$port"
TIMEFORMAT='RENDER_SECONDS=%3R'; time OUT="$root/render" node tests/render.mjs
TIMEFORMAT='WEBGPU_SECONDS=%3R'; time OUT="$root/webgpu" VK_TEST_DRIVER=/usr/share/vulkan/icd.d/intel_icd.json node tests/webgpu.mjs
TIMEFORMAT='INTERACTION_SECONDS=%3R'; time OUT="$root/interaction" node tests/interaction.mjs
TIMEFORMAT='RIG_GL_SECONDS=%3R'; time OUT="$root/rig-webgl" node tests/rig.mjs
TIMEFORMAT='RIG_GPU_SECONDS=%3R'; time OUT="$root/rig-webgpu" BACKEND=webgpu VK_TEST_DRIVER=/usr/share/vulkan/icd.d/intel_icd.json node tests/rig.mjs
for v in front three right back left detail mobile; do cp "$root/render/$v.png" "dist/showcase/yuuka-gpt6-2-$v.png"; done
cp "$root/render/yuuka-gpt6-2.glb" dist/showcase/
cp "$root/interaction/yuuka-gpt6-2-studio.glb" dist/showcase/
cp "$root/interaction/transparent.png" dist/showcase/yuuka-gpt6-2-transparent.png
for t in render webgpu interaction rig-webgl rig-webgpu; do cp "$root/$t/results.json" "dist/showcase/$t-test.json"; done
cp "$root/render/results.json" dist/showcase/webgl-test.json
cp "$root/rig-webgl/blink-detail.png" dist/showcase/yuuka-gpt6-2-blink.png
TIMEFORMAT='SHOWCASE_SECONDS=%3R'; time node tests/showcase.mjs
for v in portrait landscape; do
 ffmpeg -y -hide_banner -loglevel error -i "artifacts/showcase/$v.webm" -vf 'fps=24,tpad=stop_mode=clone:stop_duration=2' -t 60 -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p -movflags +faststart "dist/showcase/yuuka-gpt6-2-$v.mp4"
 ffmpeg -y -hide_banner -loglevel error -ss 2 -i "dist/showcase/yuuka-gpt6-2-$v.mp4" -frames:v 1 "dist/showcase/yuuka-gpt6-2-$v.png"
 ffprobe -v error -show_entries stream=width,height,codec_name,r_frame_rate:format=duration -of json "dist/showcase/yuuka-gpt6-2-$v.mp4"
done
cp artifacts/showcase/recording.json dist/showcase/
cp "$root/resources.csv" dist/showcase/metrics/
for d in artifacts/refine-*; do if [ -f "$d/resources.csv" ]; then cp "$d/resources.csv" "dist/showcase/metrics/$(basename "$d").csv"; fi; done
mkdir -p "$root/source-pack"
git archive "$revision" | tar -x -C "$root/source-pack"
git bundle create "$root/source-pack/repository.bundle" HEAD
tar -C "$root/source-pack" -czf dist/src.tar.gz .
touch dist/.nojekyll
(cd dist && find . -type f ! -name SHA256SUMS -print0 | sort -z | xargs -0 sha256sum > SHA256SUMS)
echo "CHECKPOINT_BUILT=$n SOURCE=$revision"
