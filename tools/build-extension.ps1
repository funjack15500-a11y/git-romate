param(
  [switch]$SkipZip
)

# Build the browser extension package:
#   1. copy the authoritative prompts.json into extension/data/
#   2. zip extension/* into downloads/lingdong-prompts-extension.zip
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$src = Join-Path $root "prompts.json"
$ext = Join-Path $root "extension"
$dataDir = Join-Path $ext "data"
$dataOut = Join-Path $dataDir "prompts.json"
$zipDir = Join-Path $root "downloads"
$zipOut = Join-Path $zipDir "lingdong-prompts-extension.zip"

if (-not (Test-Path -LiteralPath $src -PathType Leaf)) { throw "prompts.json not found: $src" }
if (-not (Test-Path -LiteralPath $ext -PathType Container)) { throw "extension folder not found: $ext" }

New-Item -ItemType Directory -Force -Path $dataDir | Out-Null
New-Item -ItemType Directory -Force -Path $zipDir | Out-Null

# 1. data snapshot (compact JSON, same as prompts.json)
$raw = [IO.File]::ReadAllText($src, [Text.Encoding]::UTF8)
$obj = $raw | ConvertFrom-Json
Copy-Item -LiteralPath $src -Destination $dataOut -Force
Write-Output ("data snapshot: {0} prompts -> extension/data/prompts.json" -f $obj.prompts.Count)

# 2. manifest sanity
$manifestPath = Join-Path $ext "manifest.json"
$manifest = Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
foreach ($icon in $manifest.icons.PSObject.Properties) {
  $p = Join-Path $ext $icon.Value
  if (-not (Test-Path -LiteralPath $p -PathType Leaf)) { throw "manifest icon missing: $($icon.Value)" }
}
Write-Output ("manifest: {0} v{1}" -f $manifest.name, $manifest.version)

if ($SkipZip) {
  Write-Output "skip zip"
  exit 0
}

# 3. zip (contents at zip root so unzip -> load unpacked works directly)
if (Test-Path -LiteralPath $zipOut) { Remove-Item -LiteralPath $zipOut -Force }
Compress-Archive -Path (Join-Path $ext "*") -DestinationPath $zipOut -CompressionLevel Optimal
$size = (Get-Item -LiteralPath $zipOut).Length
Write-Output ("zip: downloads/lingdong-prompts-extension.zip ({0:N0} KB)" -f ($size / 1KB))
