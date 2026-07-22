# Spark Prompts static file server (PowerShell only)
param(
  [int]$Port = 8080,
  [string]$Root = ""
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($Root)) {
  $Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
} else {
  $Root = (Resolve-Path $Root).Path
}

function Get-ContentType {
  param([string]$Path)
  $ext = [IO.Path]::GetExtension($Path).ToLowerInvariant()
  switch ($ext) {
    ".html" { return "text/html; charset=utf-8" }
    ".htm"  { return "text/html; charset=utf-8" }
    ".css"  { return "text/css; charset=utf-8" }
    ".js"   { return "application/javascript; charset=utf-8" }
    ".json" { return "application/json; charset=utf-8" }
    ".svg"  { return "image/svg+xml" }
    ".png"  { return "image/png" }
    ".jpg"  { return "image/jpeg" }
    ".jpeg" { return "image/jpeg" }
    ".gif"  { return "image/gif" }
    ".webp" { return "image/webp" }
    ".ico"  { return "image/x-icon" }
    ".txt"  { return "text/plain; charset=utf-8" }
    ".md"   { return "text/markdown; charset=utf-8" }
    default { return "application/octet-stream" }
  }
}

function Test-PortFree {
  param([int]$P)
  try {
    $l = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, $P)
    $l.Start()
    $l.Stop()
    return $true
  } catch {
    return $false
  }
}

$chosen = $null
foreach ($p in @($Port, 8081, 8082, 8765, 3000, 5500)) {
  if (Test-PortFree -P $p) {
    $chosen = $p
    break
  }
}

if ($null -eq $chosen) {
  Write-Host "ERROR: no free port found"
  exit 1
}

$Port = $chosen
$prefix = "http://127.0.0.1:$Port/"
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)

try {
  $listener.Start()
} catch {
  Write-Host "ERROR: cannot start HttpListener"
  Write-Host $_.Exception.Message
  exit 1
}

Write-Host ""
Write-Host "  Spark Prompts local preview"
Write-Host "  Root: $Root"
Write-Host "  URL:  $prefix"
Write-Host "  Press Ctrl+C to stop"
Write-Host ""

try {
  Start-Process $prefix
} catch {}

while ($listener.IsListening) {
  $ctx = $null
  try {
    $ctx = $listener.GetContext()
  } catch {
    break
  }

  $req = $ctx.Request
  $res = $ctx.Response

  try {
    $rel = [Uri]::UnescapeDataString($req.Url.LocalPath.TrimStart("/"))
    if ([string]::IsNullOrWhiteSpace($rel)) {
      $rel = "index.html"
    }
    $rel = $rel.Replace("/", [IO.Path]::DirectorySeparatorChar.ToString())

    $full = [IO.Path]::GetFullPath((Join-Path $Root $rel))
    $rootFull = [IO.Path]::GetFullPath($Root)

    if (-not $full.StartsWith($rootFull, [StringComparison]::OrdinalIgnoreCase)) {
      $res.StatusCode = 403
      $buf = [Text.Encoding]::UTF8.GetBytes("Forbidden")
      $res.ContentLength64 = $buf.Length
      $res.OutputStream.Write($buf, 0, $buf.Length)
    } elseif (-not (Test-Path -LiteralPath $full -PathType Leaf)) {
      $res.StatusCode = 404
      $buf = [Text.Encoding]::UTF8.GetBytes("404 Not Found")
      $res.ContentType = "text/plain; charset=utf-8"
      $res.ContentLength64 = $buf.Length
      $res.OutputStream.Write($buf, 0, $buf.Length)
    } else {
      $bytes = [IO.File]::ReadAllBytes($full)
      $res.StatusCode = 200
      $res.ContentType = (Get-ContentType -Path $full)
      $res.Headers["Cache-Control"] = "no-cache"
      $res.ContentLength64 = $bytes.Length
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
    }
  } catch {
    try {
      $res.StatusCode = 500
      $buf = [Text.Encoding]::UTF8.GetBytes("Server Error")
      $res.ContentLength64 = $buf.Length
      $res.OutputStream.Write($buf, 0, $buf.Length)
    } catch {}
  } finally {
    try { $res.OutputStream.Close() } catch {}
  }
}

try { $listener.Stop() } catch {}
try { $listener.Close() } catch {}
