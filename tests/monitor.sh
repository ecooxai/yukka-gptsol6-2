#!/usr/bin/env bash
set -u
out="$1"
printf 'timestamp,cpu_percent,ram_used_mb,ram_total_mb,chromium_rss_mb,node_rss_mb\n' > "$out"
read -r _ u n s i w ir si st _ < /proc/stat
prev=$((u+n+s+i+w+ir+si+st)); idle=$((i+w))
while sleep 1; do
 read -r _ u n s i w ir si st _ < /proc/stat
 total=$((u+n+s+i+w+ir+si+st)); nowidle=$((i+w)); delta=$((total-prev)); d=$((nowidle-idle))
 cpu=$((100*(delta-d)/(delta>0?delta:1))); prev=$total; idle=$nowidle
 read -r mt ma < <(awk '/MemTotal:/{t=$2}/MemAvailable:/{a=$2}END{print t,a}' /proc/meminfo)
 read -r ch no < <(ps -eo comm,rss | awk '/chromium|chrome/{c+=$2}/node/{n+=$2}END{printf "%.1f %.1f\n",c/1024,n/1024}')
 printf '%s,%s,%s,%s,%s,%s\n' "$(date +%FT%T%z)" "$cpu" "$(((mt-ma)/1024))" "$((mt/1024))" "$ch" "$no" >> "$out"
done
