<#
.SYNOPSIS
    Deploys the DeyeGoogleHome application using Docker on Windows.
.DESCRIPTION
    Builds the Docker image, stops any existing container, and starts a new one.
    Requires Docker Desktop for Windows to be installed and running.
.PARAMETER EnvFile
    Path to the .env file. Defaults to '.env' in the repository root.
.PARAMETER Port
    Host port to map to the container. Defaults to 3000.
.EXAMPLE
    .\scripts\deploy.ps1
.EXAMPLE
    .\scripts\deploy.ps1 -Port 8080 -EnvFile "C:\config\.env"
#>

param(
    [string]$EnvFile = ".env",
    [int]$Port = 3000
)

$ErrorActionPreference = "Stop"
$ContainerName = "deye-google-home"
$ImageName = "deye-google-home:latest"

Write-Host "=== DeyeGoogleHome Docker Deployment ===" -ForegroundColor Cyan

# Verify Docker is available
try {
    docker info | Out-Null
} catch {
    Write-Error "Docker is not running. Please start Docker Desktop and try again."
    exit 1
}

# Verify .env file exists
if (-not (Test-Path $EnvFile)) {
    Write-Error "Environment file '$EnvFile' not found. Copy .env.example to .env and configure it."
    exit 1
}

# Build the image
Write-Host "`n[1/4] Building Docker image..." -ForegroundColor Yellow
docker build -t $ImageName .
if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker build failed."
    exit 1
}

# Stop and remove existing container
Write-Host "`n[2/4] Stopping existing container..." -ForegroundColor Yellow
docker stop $ContainerName 2>$null
docker rm $ContainerName 2>$null

# Start new container
Write-Host "`n[3/4] Starting new container on port $Port..." -ForegroundColor Yellow
docker run -d `
    --name $ContainerName `
    --restart unless-stopped `
    --env-file $EnvFile `
    -p "${Port}:3000" `
    $ImageName

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to start container."
    exit 1
}

# Verify the deployment
Write-Host "`n[4/4] Verifying deployment..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
try {
    $response = Invoke-WebRequest -Uri "http://localhost:$Port/health" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "`nDeployment successful! Application is running on port $Port" -ForegroundColor Green
    } else {
        Write-Warning "Health check returned status $($response.StatusCode)"
    }
} catch {
    Write-Warning "Health check endpoint not available. Check container logs with: docker logs $ContainerName"
}

# Clean up dangling images
docker image prune -f | Out-Null

Write-Host "`n=== Deployment complete ===" -ForegroundColor Cyan
