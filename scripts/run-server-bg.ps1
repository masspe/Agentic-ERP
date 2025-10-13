$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$logFile = Join-Path $repoRoot 'server.log'
$pidFile = Join-Path $repoRoot 'server.pid'

$startProcessSplat = @{
    FilePath               = 'npm'
    ArgumentList           = @('run', 'server')
    RedirectStandardOutput = $logFile
    RedirectStandardError  = $logFile
    WorkingDirectory       = $repoRoot
    PassThru               = $true
    WindowStyle            = 'Hidden'
}

$process = Start-Process @startProcessSplat

Set-Content -Path $pidFile -Value $process.Id -Encoding ASCII

Write-Host "npm server started in background (PID: $($process.Id))."
Write-Host "Logs: $logFile"
