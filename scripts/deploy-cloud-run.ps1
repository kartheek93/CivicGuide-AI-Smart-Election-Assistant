param(
    [string]$ProjectId = "crowdflow-ai-493114",
    [string]$Region = "asia-south1",
    [string]$ServiceName = "civicguide-ai",
    [string]$RepositoryName = "civicguide-repo",
    [string]$ImageName = "civicguide-ai",
    [string]$GeminiSecretName = "gemini-api-key",
    [switch]$EnsureRepository
)

$ErrorActionPreference = "Stop"

function Invoke-Gcloud {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Arguments
    )

    & gcloud @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "gcloud command failed: gcloud $($Arguments -join ' ')"
    }
}

$imageUri = "{0}-docker.pkg.dev/{1}/{2}/{3}:latest" -f $Region, $ProjectId, $RepositoryName, $ImageName
$envVars = @(
    "NODE_ENV=production",
    "AUTH_REQUIRED=false",
    "GOOGLE_CLOUD_PROJECT_ID=$ProjectId",
    "GOOGLE_USE_METADATA_SERVER=true",
    "GOOGLE_TRANSLATE_ENABLED=true",
    "GOOGLE_TTS_ENABLED=true",
    "GEMINI_API_KEY_SECRET=$GeminiSecretName"
) -join ","

Write-Host "Deploying CivicGuide AI to Cloud Run..." -ForegroundColor Cyan
Write-Host "Project: $ProjectId" -ForegroundColor DarkCyan
Write-Host "Region: $Region" -ForegroundColor DarkCyan
Write-Host "Image: $imageUri" -ForegroundColor DarkCyan

if ($EnsureRepository) {
    & gcloud artifacts repositories describe $RepositoryName --location=$Region --project=$ProjectId *> $null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Artifact Registry repository not found. Creating $RepositoryName..." -ForegroundColor Yellow
        Invoke-Gcloud -Arguments @(
            "artifacts", "repositories", "create", $RepositoryName,
            "--repository-format=docker",
            "--location=$Region",
            "--project=$ProjectId"
        )
    }
}

Invoke-Gcloud -Arguments @(
    "builds", "submit",
    "--project=$ProjectId",
    "--tag", $imageUri
)

Invoke-Gcloud -Arguments @(
    "run", "deploy", $ServiceName,
    "--project=$ProjectId",
    "--image", $imageUri,
    "--region", $Region,
    "--allow-unauthenticated",
    "--port", "8080",
    "--set-env-vars", $envVars
)

Write-Host "Deployment finished." -ForegroundColor Green
Write-Host "Open the service URL from the Cloud Run output above." -ForegroundColor Green
