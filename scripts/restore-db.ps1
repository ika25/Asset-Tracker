param(
    [Parameter(Mandatory = $true)]
    [string]$BackupFile
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $BackupFile)) {
    throw "Backup file not found: $BackupFile"
}

$dbName = "asset-tracker"
$dbUser = "postgres"
$containerName = "asset-tracker-db"

Write-Host "Restoring database '$dbName' from $BackupFile..."
docker compose -f (Join-Path (Split-Path -Parent $PSScriptRoot) "docker-compose.yml") up -d db

docker exec -i $containerName psql -U $dbUser -d $dbName < $BackupFile

Write-Host "Restore complete."
