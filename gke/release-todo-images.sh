#!/usr/bin/env bash
set -euo pipefail

if [[ ${GITHUB_ACTIONS:-} != true ]]; then
  printf 'This script must run in GitHub Actions, not in a local checkout.\n' >&2
  exit 1
fi
: "${TODO_RELEASE_SHA:?TODO_RELEASE_SHA is required}"
: "${TODO_APP_IMAGE:?TODO_APP_IMAGE is required}"
: "${TODO_BACKEND_IMAGE:?TODO_BACKEND_IMAGE is required}"
: "${BROADCASTER_IMAGE:?BROADCASTER_IMAGE is required}"

if [[ $GITHUB_REF_TYPE == tag ]]; then
  environment=production
else
  environment=staging
fi

git config user.name 'github-actions[bot]'
git config user.email '41898282+github-actions[bot]@users.noreply.github.com'
for attempt in 1 2 3; do
  git fetch origin main
  if [[ $environment == staging ]] && ! git diff --quiet "$TODO_RELEASE_SHA" origin/main -- todo-app todo-backend broadcaster; then
    printf 'Newer Todo source exists. Its workflow will publish staging.\n'
    exit 0
  fi
  git checkout -B todo-environment-release origin/main
  if [[ $environment == staging ]]; then
    (
      cd overlays/staging
      kustomize edit set image \
        "${TODO_APP_IMAGE%:*}=$TODO_APP_IMAGE" \
        "${TODO_BACKEND_IMAGE%:*}=$TODO_BACKEND_IMAGE" \
        "${BROADCASTER_IMAGE%:*}=$BROADCASTER_IMAGE"
      kustomize build . >/dev/null
    )
    git add -- overlays/staging/kustomization.yaml
  else
    node gke/update-production-release.js
    kustomize build gitops/todo-apps >/dev/null
    git add -- gitops/todo-apps/production-release.json
  fi
  if git diff --cached --quiet; then
    printf '%s release is already committed.\n' "$environment"
    exit 0
  fi
  git commit -m "Release Todo $environment from $TODO_RELEASE_SHA"
  if git push origin HEAD:main; then exit 0; fi
  printf 'Push failed on attempt %s. Refreshing main before retry.\n' "$attempt"
done
printf 'Could not publish the %s release.\n' "$environment" >&2
exit 1
