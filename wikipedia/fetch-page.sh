#!/bin/sh
set -eu

url="$1"
www="${WWW_DIRECTORY:-/usr/share/nginx/html}"
temporary_file="$(mktemp "$www/.index.XXXXXX")"
trap 'rm -f "$temporary_file"' 0

final_url="$(curl --fail --silent --show-error --location --compressed \
  --connect-timeout 10 --max-time 60 \
  --retry 3 --retry-delay 5 --retry-max-time 90 \
  --max-filesize 10485760 \
  --header 'Cache-Control: no-cache' \
  --user-agent 'KubernetesCourse/5.4 (https://github.com/Aipera/kubernetes-kurssi)' \
  --output "$temporary_file" --write-out '%{url_effective}' "$url")"

# Publish only a complete, nonempty download. Nginx sees either snapshot.
test -s "$temporary_file"
chmod 644 "$temporary_file"
mv -f "$temporary_file" "$www/index.html"
printf '%s Updated index.html from %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$final_url"
