#!/usr/bin/env bash
set -euo pipefail

if [[ ${GITHUB_ACTIONS:-} != true ]]; then
  printf 'This script must run in GitHub Actions, not in a local checkout.\n' >&2
  exit 1
fi

: "${GITHUB_SHA:?GITHUB_SHA is required}"
: "${TODO_APP_IMAGE:?TODO_APP_IMAGE is required}"
: "${TODO_BACKEND_IMAGE:?TODO_BACKEND_IMAGE is required}"
: "${BROADCASTER_IMAGE:?BROADCASTER_IMAGE is required}"

git config user.name 'github-actions[bot]'
git config user.email '41898282+github-actions[bot]@users.noreply.github.com'

# Run only in the disposable GitHub Actions checkout.
# Preserve concurrent commits, including releases by the Log output workflow.
for attempt in 1 2 3; do
  git fetch origin main

  if ! git diff --quiet "$GITHUB_SHA" origin/main -- todo-app todo-backend broadcaster; then
    printf 'Newer Todo source exists. Its workflow will publish the images.\n'
    exit 0
  fi

  git checkout -B todo-image-release origin/main
  kustomize edit set image \
    "todo-app=$TODO_APP_IMAGE" \
    "todo-backend=$TODO_BACKEND_IMAGE" \
    "broadcaster=$BROADCASTER_IMAGE"
  kustomize build . >/dev/null

  git add -- kustomization.yaml
  if git diff --cached --quiet; then
    printf 'Image versions are already committed.\n'
    exit 0
  fi

  git commit -m "Update Todo images to $GITHUB_SHA"
  if git push origin HEAD:main; then
    exit 0
  fi
  printf 'Push failed on attempt %s. Refreshing main before retry.\n' "$attempt"
done

printf 'Could not commit the Todo image versions to main.\n' >&2
exit 1
