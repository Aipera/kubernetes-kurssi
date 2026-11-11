#!/usr/bin/env bash
set -euo pipefail

branch="$GITHUB_REF_NAME"
namespace=project

if [[ "$branch" != main ]]; then
  if [[ ! "$branch" =~ ^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$ ]]; then
    printf 'Branch name must be a valid Kubernetes namespace name: %s\n' "$branch" >&2
    exit 1
  fi

  namespace="preview-$branch"
  if (( ${#namespace} > 63 )); then
    branch_hash="$(printf '%s' "$branch" | sha256sum)"
    namespace="preview-${branch:0:42}-${branch_hash:0:12}"
  fi

  existing_namespace="$(kubectl get namespace "$namespace" --ignore-not-found -o name)"
  if [[ -z "$existing_namespace" ]]; then
    kubectl create -f - <<EOF
apiVersion: v1
kind: Namespace
metadata:
  name: $namespace
  labels:
    kurssi-gateway: enabled
    kurssi-preview-branch: "$branch"
EOF
  else
    namespace_branch="$(kubectl get namespace "$namespace" -o 'jsonpath={.metadata.labels.kurssi-preview-branch}')"
    if [[ "$namespace_branch" != "$branch" ]]; then
      printf 'Namespace %s is already assigned outside branch %s\n' "$namespace" "$branch" >&2
      exit 1
    fi
  fi

  binding="$(kubectl -n "$namespace" get rolebinding todo-ci-deployer --ignore-not-found -o name)"
  if [[ -z "$binding" ]]; then
    ci_user="$(kubectl auth whoami -o 'jsonpath={.status.userInfo.username}')"
    kubectl -n "$namespace" create rolebinding todo-ci-deployer --clusterrole=todo-preview-workloads --user="$ci_user"
  fi

  secret="$(kubectl -n "$namespace" get secret todo-postgres-auth --ignore-not-found -o name)"
  if [[ -z "$secret" ]]; then
    password="$(openssl rand -hex 24)"
    kubectl -n "$namespace" create secret generic todo-postgres-auth --from-literal="password=$password"
  fi

  preview_host="$namespace.$TODO_GATEWAY_IP.sslip.io"
  cat > .todo-preview-route-patch.yaml <<EOF
- op: add
  path: /spec/hostnames
  value:
    - $preview_host
EOF

  kustomize edit add patch --path .todo-preview-route-patch.yaml --kind HTTPRoute --name todo-route
  printf 'Preview URL: http://%s/\n' "$preview_host"
fi

kustomize edit set namespace "$namespace"
kustomize edit set image "todo-app=$TODO_APP_IMAGE" "todo-backend=$TODO_BACKEND_IMAGE"
kubectl -n "$namespace" apply -k .
kubectl -n "$namespace" rollout status statefulset/todo-postgres --timeout=300s
kubectl -n "$namespace" rollout status deployment/todo-backend --timeout=300s
kubectl -n "$namespace" rollout status deployment/todo-app --timeout=300s
kubectl -n "$namespace" get deployment todo-app todo-backend -o wide
