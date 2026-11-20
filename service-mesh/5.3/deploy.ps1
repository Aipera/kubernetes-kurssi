param(
    [ValidatePattern('^k3d-')]
    [string]$Context = 'k3d-istio-lab',
    [switch]$Basic,
    [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Set-Location $repoRoot

function Invoke-Kube {
    $ErrorActionPreference = 'Continue'
    & kubectl "--context=$Context" @args
    if ($LASTEXITCODE -ne 0) { throw "Kubectl command failed." }
}

Get-Command kubectl -ErrorAction Stop | Out-Null
Invoke-Kube get nodes --request-timeout=15s
Invoke-Kube -n istio-system rollout status deployment/istiod --timeout=60s
Invoke-Kube get storageclass local-path

if (-not $SkipBuild) {
    Get-Command docker -ErrorAction Stop | Out-Null
    $k3d = Get-Command k3d -ErrorAction SilentlyContinue
    if ($k3d) {
        $k3d = $k3d.Source
    } else {
        $k3d = Join-Path $env:USERPROFILE 'tools\k3d-5.9.0\k3d.exe'
        if (-not (Test-Path -LiteralPath $k3d)) { throw "k3d was not found." }
    }

    $ErrorActionPreference = 'Continue'
    docker info --format '{{.ServerVersion}}'
    if ($LASTEXITCODE -ne 0) { throw "Start Docker Desktop first." }

    foreach ($app in @('log-output', 'ping-pong', 'greeter')) {
        docker build --platform linux/amd64 --provenance=false -t "$($app):5.3" "./$app"
        if ($LASTEXITCODE -ne 0) { throw "Image build failed: $app" }
    }

    $cluster = $Context.Substring(4)
    & $k3d image import log-output:5.3 ping-pong:5.3 greeter:5.3 --cluster $cluster
    if ($LASTEXITCODE -ne 0) { throw "Image import failed." }
    $ErrorActionPreference = 'Stop'
}

Invoke-Kube apply -f (Join-Path $PSScriptRoot 'namespace.yaml')
$existingSecret = Invoke-Kube -n exercises get secret ping-pong-postgres-auth --ignore-not-found -o name
if (-not $existingSecret) {
    $password = [guid]::NewGuid().ToString('N')
    Invoke-Kube -n exercises create secret generic ping-pong-postgres-auth "--from-literal=password=$password"
}

if ($Basic) {
    $files = @('waypoint.yaml', 'configmap.yaml', 'postgres.yaml', 'ping-pong.yaml',
               'log-output.yaml', 'greeter-v1.yaml', 'gateway.yaml')
    foreach ($file in $files) {
        Invoke-Kube apply -f (Join-Path $PSScriptRoot $file)
    }
} else {
    Invoke-Kube apply -k $PSScriptRoot
}

Invoke-Kube -n exercises wait gateways.gateway.networking.k8s.io/waypoint --for=condition=Programmed --timeout=180s
Invoke-Kube -n exercises rollout status statefulset/ping-pong-postgres --timeout=300s

$deployments = @('ping-pong', 'greeter-v1')
if (-not $Basic) { $deployments += 'greeter-v2' }
$deployments += 'log-output'
foreach ($deployment in $deployments) {
    Invoke-Kube -n exercises rollout status "deployment/$deployment" --timeout=300s
}

Invoke-Kube -n exercises wait gateways.gateway.networking.k8s.io/log-gateway --for=condition=Programmed --timeout=180s
Invoke-Kube -n exercises get 'pods,svc,httproute'
Write-Host 'Ready. Port-forward svc/log-gateway-istio in namespace exercises to 8085:80.'
if ($Basic) {
    Write-Host 'Basic setup uses greeter v1. Run this script without -Basic to add v2 and the 75/25 route.'
}
