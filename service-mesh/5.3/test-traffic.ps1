param(
    [string]$Url = 'http://localhost:8085/log',
    [ValidateRange(1, 10000)]
    [int]$Count = 200
)

$ErrorActionPreference = 'Stop'
Get-Command curl.exe -ErrorAction Stop | Out-Null
$versions = @(foreach ($i in 1..$Count) {
    Write-Progress -Activity 'Testing greeter traffic split' -Status "$i / $Count" -PercentComplete (100 * $i / $Count)
    $body = curl.exe -fsS --max-time 15 $Url
    if ($LASTEXITCODE -ne 0) { throw "Request $i failed." }

    $version = [regex]::Match(($body -join [Environment]::NewLine), '(?m)^Greeting: Hello from greeter (v[12])\s*$')
    if (-not $version.Success) { throw "Greeting was missing from response $i." }
    $version.Groups[1].Value
    Start-Sleep -Milliseconds 500
})
Write-Progress -Activity 'Testing greeter traffic split' -Completed

$versions | Group-Object | Sort-Object Name |
    Select-Object Name, Count, @{Name='Percent'; Expression={[math]::Round(100 * $_.Count / $Count, 1)}} |
    Format-Table -AutoSize
