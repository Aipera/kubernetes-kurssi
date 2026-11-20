param(
    [ValidatePattern('^k3d-')]
    [string]$Context = 'k3d-knative-lab',
    [string]$IngressUrl = 'http://localhost:8087',
    [string]$LogUrl = 'http://localhost:8088/log',
    [ValidateRange(60, 600)]
    [int]$IdleTimeoutSeconds = 240
)

$ErrorActionPreference = 'Stop'
Get-Command kubectl, curl.exe -ErrorAction Stop | Out-Null

function Invoke-Kube {
    $ErrorActionPreference = 'Continue'
    $result = & kubectl "--context=$Context" -n exercises @args
    if ($LASTEXITCODE -ne 0) { throw 'Kubectl command failed.' }
    $result
}

function Get-Text {
    param([string]$Url, [string]$ServiceHost)
    $ErrorActionPreference = 'Continue'
    $curlArguments = @('-fsS', '--max-time', '90')
    if ($ServiceHost) { $curlArguments += @('-H', "Host: $ServiceHost") }
    $body = & curl.exe @curlArguments $Url
    if ($LASTEXITCODE -ne 0) { throw "HTTP request failed for $Url" }
    ($body -join "`n").Trim()
}

function Get-LogCount {
    $body = Get-Text -Url $LogUrl
    $match = [regex]::Match($body, '(?m)^Ping / Pongs: (\d+)\s*$')
    if (-not $match.Success) { throw 'Counter was missing from Log output.' }
    Write-Host $body
    [long]::Parse($match.Groups[1].Value)
}

$service = Invoke-Kube get ksvc pingpong -o json | ConvertFrom-Json
$serviceHost = ([uri]$service.status.url).Host
if (-not $serviceHost) { throw 'Knative service has no URL.' }
$revision = $service.status.latestReadyRevisionName
if (-not $revision) { throw 'Knative service has no ready revision.' }

$pong = Get-Text -Url "$($IngressUrl.TrimEnd('/'))/" -ServiceHost $serviceHost
$pongMatch = [regex]::Match($pong, '^pong (\d+)$')
if (-not $pongMatch.Success) { throw "Unexpected Ping-pong response $pong" }
Write-Host $pong

$expectedCount = [long]::Parse($pongMatch.Groups[1].Value) + 1
$before = Get-LogCount
if ($before -ne $expectedCount) { throw 'Log output did not show the updated counter.' }
$pods = Invoke-Kube get pods -l serving.knative.dev/service=pingpong -o json | ConvertFrom-Json
$previousUids = @($pods.items | ForEach-Object { $_.metadata.uid })

Write-Host 'Waiting for Ping-pong to scale to zero. Do not refresh /log or call Ping-pong.'
$deadline = (Get-Date).AddSeconds($IdleTimeoutSeconds)
do {
    $pods = Invoke-Kube get pods -l serving.knative.dev/service=pingpong -o json | ConvertFrom-Json
    $autoscaler = Invoke-Kube get podautoscalers.autoscaling.internal.knative.dev $revision -o json | ConvertFrom-Json
    $activePods = @($pods.items | Where-Object {
        -not $_.metadata.deletionTimestamp -and $_.status.phase -notin @('Failed', 'Succeeded')
    })
    $zeroScale = $null -ne $autoscaler.status.desiredScale -and
        $null -ne $autoscaler.status.actualScale -and
        $autoscaler.status.desiredScale -eq 0 -and $autoscaler.status.actualScale -eq 0
    if ($zeroScale -and $activePods.Count -eq 0) {
        $previousUids = @($previousUids + @($pods.items | ForEach-Object { $_.metadata.uid }))
        break
    }
    if ((Get-Date) -ge $deadline) { throw 'Ping-pong did not scale to zero in time.' }
    Write-Host ("Waiting for scale-to-zero, desired={0}, actual={1}, active pods={2}" -f
        $autoscaler.status.desiredScale, $autoscaler.status.actualScale, $activePods.Count)
    Start-Sleep -Seconds 5
} while ($true)

Write-Host 'Knative reports zero replicas and there are no active pods. Calling Log output to trigger a cold start.'
$after = Get-LogCount
if ($after -ne $before) { throw 'Counter changed across scale-to-zero.' }
$pods = Invoke-Kube get pods -l serving.knative.dev/service=pingpong -o json | ConvertFrom-Json
$newPods = @($pods.items | Where-Object {
    -not $_.metadata.deletionTimestamp -and $_.status.phase -notin @('Failed', 'Succeeded') -and
        $_.metadata.uid -notin $previousUids
})
if ($newPods.Count -eq 0) { throw 'Cold start did not create a new Ping-pong pod.' }

Write-Host "Counter persisted across scale-to-zero with value $after"
Write-Host "Cold start created a new pod $($newPods[0].metadata.name)"
Invoke-Kube get pods -l serving.knative.dev/service=pingpong
Write-Host 'Serverless test passed.'
