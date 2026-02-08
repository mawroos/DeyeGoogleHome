<#
.SYNOPSIS
    Stops the Deye Google Home Docker container.

.DESCRIPTION
    Stops and removes the running Docker container and optionally removes the image.

.PARAMETER RemoveImage
    If specified, also removes the Docker image after stopping the container.

.EXAMPLE
    .\scripts\stop.ps1
    .\scripts\stop.ps1 -RemoveImage
#>
param(
    [switch]$RemoveImage
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot

Push-Location $ProjectRoot
try {
    Write-Host "Stopping containers..." -ForegroundColor Yellow
    docker compose down --remove-orphans

    if ($RemoveImage) {
        Write-Host "Removing Docker image..." -ForegroundColor Yellow
        $imageName = docker compose config --images 2>$null
        if ($imageName) {
            docker rmi $imageName -f
        }
    }

    Write-Host "Stopped successfully." -ForegroundColor Green
} finally {
    Pop-Location
}
