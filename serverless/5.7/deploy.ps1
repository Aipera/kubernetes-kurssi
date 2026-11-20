param(
    [ValidatePattern('^k3d-')]
    [string]$Context = 'k3d-knative-lab',
    [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Set-Location $repoRoot

function Invoke-Kube {
    $ErrorActionPreference = 'Continue'
    & kubectl "--context=$Context" @args
    if ($LASTEXITCODE -ne 0) { throw 'Kubectl command failed.' }
}

Get-Command kubectl -ErrorAction Stop | Out-Null
Invoke-Kube get nodes --request-timeout=15s
Invoke-Kube get crd services.serving.knative.dev
Invoke-Kube -n knative-serving rollout status deployment/controller --timeout=60s
Invoke-Kube -n kourier-system rollout status deployment/3scale-kourier-gateway --timeout=60s
Invoke-Kube get storageclass local-path

if (-not $SkipBuild) {
    Get-Command docker -ErrorAction Stop | Out-Null
    $k3d = Get-Command k3d -ErrorAction SilentlyContinue
    if ($k3d) {
        $k3d = $k3d.Source
    } else {
        $k3d = Join-Path $env:USERPROFILE 'tools\k3d-5.9.0\k3d.exe'
        if (-not (Test-Path -LiteralPath $k3d)) { throw 'k3d was not found.' }
    }

    $ErrorActionPreference = 'Continue'
    docker info --format '{{.ServerVersion}}'
    if ($LASTEXITCODE -ne 0) { throw 'Start Docker Desktop first.' }

    foreach ($app in @('log-output', 'ping-pong', 'greeter')) {
        docker build --platform linux/amd64 --provenance=false `
            -t "dev.local/$($app):5.7" "./$app"
        if ($LASTEXITCODE -ne 0) { throw "Image build failed for $app" }
    }

    $cluster = $Context.Substring(4)
    & $k3d image import dev.local/log-output:5.7 dev.local/ping-pong:5.7 `
        dev.local/greeter:5.7 --cluster $cluster
    if ($LASTEXITCODE -ne 0) { throw 'Image import failed.' }
    $ErrorActionPreference = 'Stop'
}

Invoke-Kube apply -f (Join-Path $PSScriptRoot 'namespace.yaml')
$existingSecret = Invoke-Kube -n exercises get secret ping-pong-postgres-auth `
    --ignore-not-found -o name
if (-not $existingSecret) {
    $password = [guid]::NewGuid().ToString('N')
    Invoke-Kube -n exercises create secret generic ping-pong-postgres-auth `
        "--from-literal=password=$password"
}

Invoke-Kube apply -k $PSScriptRoot
Invoke-Kube -n exercises rollout status statefulset/ping-pong-postgres --timeout=300s
Invoke-Kube -n exercises wait ksvc/pingpong --for=condition=Ready --timeout=300s
Invoke-Kube -n exercises rollout status deployment/greeter --timeout=180s
Invoke-Kube -n exercises rollout status deployment/log-output --timeout=180s
Invoke-Kube -n exercises get 'ksvc,pods,svc'

Write-Host 'Ready. Run this in a separate terminal and keep it open.'
Write-Host "kubectl --context=$Context -n exercises port-forward svc/log-output-svc 8088:80"
Write-Host 'Open http://localhost:8088/log and run serverless/5.7/test-serverless.ps1.'
