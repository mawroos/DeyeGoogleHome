<#
.SYNOPSIS
    Deploys the Deye Google Home application using Docker.

.DESCRIPTION
    Builds and starts the Docker container for the Deye Google Home integration.
    Requires Docker Desktop to be running on Windows.

.PARAMETER EnvFile
    Path to the .env file. Defaults to .env in the project root.

.EXAMPLE
    .\scripts\deploy.ps1
    .\scripts\deploy.ps1 -EnvFile "C:\config\.env"
#>
param(
    [string]$EnvFile = ".env"
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot

Push-Location $ProjectRoot
try {
    # Verify Docker is available
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Error "Docker is not installed or not in PATH."
        exit 1
    }

    # Verify .env file exists
    if (-not (Test-Path $EnvFile)) {
        Write-Error "Environment file not found: $EnvFile. Copy .env.example to .env and configure it."
        exit 1
    }

    Write-Host "Stopping existing containers..." -ForegroundColor Yellow
    docker compose down --remove-orphans

    Write-Host "Building Docker image..." -ForegroundColor Yellow
    docker compose build --no-cache

    Write-Host "Starting container..." -ForegroundColor Yellow
    docker compose up -d

    # Wait for health check
    Write-Host "Waiting for service to become healthy..." -ForegroundColor Yellow
    $maxRetries = 10
    $delay = 5
    $port = 3000

    # Try to read port from .env
    $envContent = Get-Content $EnvFile -ErrorAction SilentlyContinue
    foreach ($line in $envContent) {
        if ($line -match "^PORT=(\d+)") {
            $port = $Matches[1]
        }
    }

    for ($i = 1; $i -le $maxRetries; $i++) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$port/" -UseBasicParsing -TimeoutSec 5
            if ($response.StatusCode -eq 200) {
                Write-Host "Service is healthy and running on port $port" -ForegroundColor Green
                docker ps --filter "name=deye-google-home"
                exit 0
            }
        } catch {
            Write-Host "  Attempt $i/$maxRetries - waiting ${delay}s..." -ForegroundColor Gray
        }
        Start-Sleep -Seconds $delay
    }

    Write-Error "Service failed to become healthy after $maxRetries attempts."
    docker logs deye-google-home --tail 50
    exit 1
} finally {
    Pop-Location
}
