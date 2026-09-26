$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$backupDir = Join-Path $projectRoot "backups"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$dbName = "asset-tracker"
$dbUser = "postgres"
$containerName = "asset-tracker-db"
$backupPath = Join-Path $backupDir "asset-tracker-backup_$timestamp.sql"

Write-Host "Ensuring the database container is running..."
docker compose -f (Join-Path $projectRoot "docker-compose.yml") up -d db

Write-Host "Creating PostgreSQL backup for '$dbName'..."
docker exec $containerName pg_dump -U $dbUser -d $dbName --clean --if-exists --no-owner --no-privileges --quote-all-identifiers | Out-File -Encoding utf8 -FilePath $backupPath

$bytes = (Get-Item $backupPath).Length
Write-Host "Backup created successfully: $backupPath"
Write-Host "Backup size: $bytes bytes"
