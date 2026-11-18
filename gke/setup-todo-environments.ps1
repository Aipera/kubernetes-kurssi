param(
    [string]$Context = 'gke_project-e08f1dba-8ab7-491a-90a_europe-north1-b_dwk-cluster'
)
$ErrorActionPreference = 'Stop'
function Invoke-Kube {
    $ErrorActionPreference = 'Continue'
    & kubectl "--context=$Context" @args
    if ($LASTEXITCODE -ne 0) { throw 'Kubernetes command failed.' }
}
function Invoke-GCloud {
    # Windows PowerShell 5 can treat native informational stderr as errors.
    $ErrorActionPreference = 'Continue'
    & gcloud.cmd @args
    if ($LASTEXITCODE -ne 0) { throw 'Google Cloud command failed.' }
}
Push-Location (Join-Path $PSScriptRoot '..')
try {
    $rendered = & kubectl kustomize overlays/staging
    if ($LASTEXITCODE -ne 0) { throw 'Could not render staging manifests.' }
    $images = @($rendered | Select-String -Pattern '^\s*image:\s*.*:[a-f0-9]{40}\s*$')
    if ($images.Count -ne 3) {
        throw 'Wait for Build Todo for GitOps to finish, then git pull --ff-only origin main.'
    }

    # Keep the existing repository/owner restrictions and allow release tags.
    $projectId = 'project-e08f1dba-8ab7-491a-90a'
    $provider = (Invoke-GCloud iam workload-identity-pools providers describe github-main --workload-identity-pool=todo-github --location=global "--project=$projectId" --format=json | Out-String) | ConvertFrom-Json
    if ($provider.oidc.issuerUri.TrimEnd('/') -ne 'https://token.actions.githubusercontent.com') {
        throw 'The configured provider is not a GitHub Actions provider.'
    }
    $condition = [string]$provider.attributeCondition
    $allowedRefs = "(assertion.ref == 'refs/heads/main' || assertion.ref.startsWith('refs/tags/'))"
    $updatedCondition = $condition
    if (-not $condition.Contains('refs/tags/')) {
        foreach ($oldRef in @("assertion.ref.startsWith('refs/heads/')", "assertion.ref == 'refs/heads/main'", "assertion.ref=='refs/heads/main'")) {
            if ($condition.Contains($oldRef)) {
                $updatedCondition = $condition.Replace($oldRef, $allowedRefs)
                break
            }
        }
    }
    if ($updatedCondition -ne $condition) {
        Invoke-GCloud iam workload-identity-pools providers update-oidc github-main --workload-identity-pool=todo-github --location=global "--project=$projectId" "--attribute-condition=$updatedCondition" | Out-Null
        Write-Host 'Enabled GitHub release-tag authentication with existing repository restrictions.'
    }
    elseif ($condition.Contains('assertion.ref') -and -not $condition.Contains('refs/tags/')) {
        throw "Unrecognized GitHub ref condition. Keep repository restrictions when enabling tags: $condition"
    }
    Invoke-Kube apply -f project-namespace.yaml
    Invoke-Kube -n project get secret todo-postgres-auth broadcaster-webhook -o name | Out-Null
    Invoke-Kube apply -f overlays/staging/namespace.yaml
    $secret = Invoke-Kube -n staging get secret todo-postgres-auth --ignore-not-found -o name
    if (-not $secret) {
        $bytes = New-Object byte[] 24
        $random = [System.Security.Cryptography.RandomNumberGenerator]::Create()
        try { $random.GetBytes($bytes) } finally { $random.Dispose() }
        $password = [Convert]::ToBase64String($bytes)
        Invoke-Kube -n staging create secret generic todo-postgres-auth "--from-literal=password=$password" | Out-Null
        Write-Host 'Created the staging database Secret.'
    }
    Invoke-Kube apply -f gitops/todo-application.yaml
    Write-Host 'Created the parent Application. Wait for todo-project and todo-staging to become Healthy.'
}
finally { Pop-Location }
