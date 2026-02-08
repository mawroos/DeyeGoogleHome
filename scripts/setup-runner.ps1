<#
.SYNOPSIS
    Sets up a self-hosted GitHub Actions runner on Windows with Docker support.
.DESCRIPTION
    Downloads, configures, and installs the GitHub Actions runner as a Windows service.
    Verifies that Docker Desktop is installed and running.
.PARAMETER GitHubUrl
    The repository URL (e.g., https://github.com/mawroos/DeyeGoogleHome).
.PARAMETER Token
    The runner registration token from GitHub Settings > Actions > Runners.
.PARAMETER RunnerName
    Name for this runner instance. Defaults to the hostname.
.PARAMETER InstallDir
    Directory to install the runner. Defaults to C:\actions-runner.
.EXAMPLE
    .\scripts\setup-runner.ps1 -GitHubUrl "https://github.com/mawroos/DeyeGoogleHome" -Token "AXXXXXXXXX"
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$GitHubUrl,

    [Parameter(Mandatory=$true)]
    [string]$Token,

    [string]$RunnerName = $env:COMPUTERNAME,

    [string]$InstallDir = "C:\actions-runner"
)

$ErrorActionPreference = "Stop"
$RunnerVersion = "2.322.0"
$RunnerArchive = "actions-runner-win-x64-$RunnerVersion.zip"
$RunnerUrl = "https://github.com/actions/runner/releases/download/v$RunnerVersion/$RunnerArchive"

Write-Host "=== GitHub Actions Runner Setup ===" -ForegroundColor Cyan

# Check for administrator privileges
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Error "This script must be run as Administrator."
    exit 1
}

# Verify Docker is available
Write-Host "`n[1/5] Checking Docker installation..." -ForegroundColor Yellow
try {
    docker info | Out-Null
    Write-Host "Docker is available." -ForegroundColor Green
} catch {
    Write-Error "Docker is not installed or not running. Please install Docker Desktop for Windows first."
    exit 1
}

# Create installation directory
Write-Host "`n[2/5] Preparing installation directory..." -ForegroundColor Yellow
if (-not (Test-Path $InstallDir)) {
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
}
Set-Location $InstallDir

# Download the runner
Write-Host "`n[3/5] Downloading GitHub Actions runner v$RunnerVersion..." -ForegroundColor Yellow
if (-not (Test-Path $RunnerArchive)) {
    Invoke-WebRequest -Uri $RunnerUrl -OutFile $RunnerArchive -UseBasicParsing
}
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::ExtractToDirectory("$InstallDir\$RunnerArchive", $InstallDir)

# Configure the runner
Write-Host "`n[4/5] Configuring runner..." -ForegroundColor Yellow
.\config.cmd --url $GitHubUrl --token $Token --name $RunnerName --labels "self-hosted,Windows,docker" --runasservice --replace

# Verify installation
Write-Host "`n[5/5] Verifying runner service..." -ForegroundColor Yellow
$service = Get-Service -Name "actions.runner.*" -ErrorAction SilentlyContinue
if ($service) {
    Write-Host "Runner service installed: $($service.Name) ($($service.Status))" -ForegroundColor Green
} else {
    Write-Warning "Runner service not found. You may need to start it manually with: .\run.cmd"
}

Write-Host "`n=== Setup complete ===" -ForegroundColor Cyan
Write-Host "Runner '$RunnerName' is registered with labels: self-hosted, Windows, docker" -ForegroundColor Cyan
