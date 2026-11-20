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

source_dir="$(git rev-parse --show-toplevel)"
config_dir="$(cd "${TODO_CONFIG_DIR:-$source_dir/config-repository}" && pwd)"
if [[ "$(git -C "$config_dir" rev-parse --show-toplevel)" == "$source_dir" ]]; then
  printf 'A separate configuration repository checkout is required.\n' >&2
  exit 1
fi
# Code and configuration commits are different histories. Production is pinned
# to the configuration snapshot checked out at the start of this workflow.
export TODO_CONFIG_SNAPSHOT_SHA="$(git -C "$config_dir" rev-parse HEAD)"
export TODO_CONFIG_DIR="$config_dir"
if [[ ${GITHUB_REF_TYPE:-} == tag ]]; then
  environment=production
else
  environment=staging
fi

git -C "$config_dir" config user.name 'github-actions[bot]'
git -C "$config_dir" config user.email '41898282+github-actions[bot]@users.noreply.github.com'
for attempt in 1 2 3; do
  git -C "$source_dir" fetch origin main
  if [[ $environment == staging ]] && ! git -C "$source_dir" diff --quiet "$TODO_RELEASE_SHA" origin/main -- todo-app todo-backend broadcaster; then
    printf 'Newer Todo source exists. Its workflow will publish staging.\n'
    exit 0
  fi
  git -C "$config_dir" fetch origin main
  git -C "$config_dir" checkout -B todo-environment-release origin/main
  if [[ $environment == staging ]]; then
    (
      cd "$config_dir/overlays/staging"
      kustomize edit set image \
        "${TODO_APP_IMAGE%:*}=$TODO_APP_IMAGE" \
        "${TODO_BACKEND_IMAGE%:*}=$TODO_BACKEND_IMAGE" \
        "${BROADCASTER_IMAGE%:*}=$BROADCASTER_IMAGE"
      kustomize build . >/dev/null
    )
    git -C "$config_dir" add -- overlays/staging/kustomization.yaml
  else
    node "$source_dir/gke/update-production-release.js"
    kustomize build "$config_dir/gitops/todo-apps" >/dev/null
    git -C "$config_dir" add -- gitops/todo-apps/production-release.json
  fi
  if git -C "$config_dir" diff --cached --quiet; then
    printf '%s release is already committed.\n' "$environment"
    exit 0
  fi
  git -C "$config_dir" commit -m "Release Todo $environment from $TODO_RELEASE_SHA"
  if git -C "$config_dir" push origin HEAD:main; then exit 0; fi
  printf 'Push failed on attempt %s. Refreshing main before retry.\n' "$attempt"
done
printf 'Could not publish the %s release.\n' "$environment" >&2
exit 1
