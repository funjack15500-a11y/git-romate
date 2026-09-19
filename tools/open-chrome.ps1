param(
  [Parameter(Mandatory = $true)]
  [string]$Target
)

$chromeCandidates = @(
  (Join-Path $env:ProgramFiles "Google\Chrome\Application\chrome.exe"),
  (Join-Path ${env:ProgramFiles(x86)} "Google\Chrome\Application\chrome.exe"),
  (Join-Path $env:LOCALAPPDATA "Google\Chrome\Application\chrome.exe")
) | Where-Object { $_ -and (Test-Path -LiteralPath $_ -PathType Leaf) }

$chrome = $chromeCandidates | Select-Object -First 1
if (-not $chrome) {
  $command = Get-Command chrome.exe -ErrorAction SilentlyContinue
  if ($command) {
    $chrome = $command.Source
  }
}

if ($chrome) {
  Start-Process -FilePath $chrome -ArgumentList @("--new-tab", $Target)
  exit 0
}

Write-Warning "未找到 Google Chrome，已改用系统默认浏览器。"
Start-Process $Target
