#!/usr/bin/env bash
set -euo pipefail

if [[ ${GITHUB_ACTIONS:-} != true ]]; then
  printf 'This script must run in GitHub Actions, not in a local checkout.\n' >&2
  exit 1
fi

: "${GITHUB_SHA:?GITHUB_SHA is required}"
: "${LOG_OUTPUT_IMAGE:?LOG_OUTPUT_IMAGE is required}"

git config user.name 'github-actions[bot]'
git config user.email '41898282+github-actions[bot]@users.noreply.github.com'

# Run only in the disposable GitHub Actions checkout.
# Keep concurrent commits and never force-push main.
for attempt in 1 2 3; do
  git fetch origin main

  if ! git diff --quiet "$GITHUB_SHA" origin/main -- \
    log-output/app.js log-output/writer.js log-output/Dockerfile log-output/.dockerignore; then
    printf 'Newer Log output source exists. Its workflow will publish the image.\n'
    exit 0
  fi

  git checkout -B log-output-image-release origin/main
  (
    cd log-output/gke
    kustomize edit set image "$LOG_OUTPUT_IMAGE=$LOG_OUTPUT_IMAGE:$GITHUB_SHA"
    kustomize build . >/dev/null
  )

  git add -- log-output/gke/kustomization.yaml
  if git diff --cached --quiet; then
    printf 'Image version is already committed.\n'
    exit 0
  fi

  git commit -m "Update Log output image to $GITHUB_SHA"
  if git push origin HEAD:main; then
    exit 0
  fi
  printf 'Push failed on attempt %s. Refreshing main before retry.\n' "$attempt"
done

printf 'Could not commit the image version to main.\n' >&2
exit 1
