#!/bin/sh
set -eu

fetch_script="${SCRIPT_DIRECTORY:-/scripts}/fetch-page.sh"
random_url="${RANDOM_PAGE_URL:-https://en.wikipedia.org/wiki/Special:Random}"
trap 'exit 0' INT TERM

while :; do
  random="$(od -An -N4 -tu4 /dev/urandom | tr -d '[:space:]')"
  delay="$((300 + random % 601))"
  printf '%s Waiting %s seconds before fetching a random Wikipedia page\n' \
    "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$delay"

  # Waiting in the background lets the shell handle termination promptly.
  sleep "$delay" &
  wait "$!"

  if /bin/sh "$fetch_script" "$random_url"; then
    :
  else
    printf '%s Download failed; keeping the previous page\n' \
      "$(date -u +%Y-%m-%dT%H:%M:%SZ)" >&2
  fi
done
