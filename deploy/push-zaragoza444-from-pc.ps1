# Run on your PC (PowerShell). Pushes local Nova folders to zaragoza444 GitHub.
# Usage:
#   cd C:\Users\novac   # or your Nova root
#   powershell -ExecutionPolicy Bypass -File path\to\deploy\push-zaragoza444-from-pc.ps1
#
# Map: set env NOVA_ROOT if your tree is not the current directory.

$ErrorActionPreference = "Stop"
$NovaRoot = if ($env:NOVA_ROOT) { $env:NOVA_ROOT } else { (Get-Location).Path }

$Repos = @(
  @{ Id = "nova-trust"; Remote = "https://github.com/zaragoza444/nova-trust.git"; Branch = "main" },
  @{ Id = "nova-plus-wallet"; Remote = "https://github.com/zaragoza444/nova-plus-wallet.git"; Branch = "main" },
  @{ Id = "nova-wallet"; Remote = "https://github.com/zaragoza444/nova-wallet.git"; Branch = "master" },
  @{ Id = "onex"; Remote = "https://github.com/zaragoza444/onex.git"; Branch = "main" },
  @{ Id = "alltra-plus-blockchain"; Remote = "https://github.com/zaragoza444/alltra-plus-blockchain.git"; Branch = "master" }
)

Write-Host "NOVA_ROOT=$NovaRoot" -ForegroundColor Cyan

foreach ($r in $Repos) {
  $candidates = @(
    (Join-Path $NovaRoot $r.Id),
    (Join-Path $NovaRoot ("nova\" + $r.Id)),
    (Join-Path $NovaRoot ("repos\" + $r.Id))
  )
  $path = $candidates | Where-Object { Test-Path (Join-Path $_ ".git") } | Select-Object -First 1
  if (-not $path) {
    Write-Host "SKIP $($r.Id) — folder with .git not found under $NovaRoot" -ForegroundColor Yellow
    continue
  }

  Write-Host "`n=== $($r.Id) @ $path ===" -ForegroundColor Green
  Push-Location $path
  try {
    git remote remove zaragoza444 2>$null
    git remote add zaragoza444 $r.Remote 2>$null
    if (-not (git remote | Select-String -Pattern '^zaragoza444$')) {
      git remote set-url zaragoza444 $r.Remote
    }
    git add -A
    $pending = git status --porcelain
    if ($pending) {
      git commit -m "Deploy sync from PC $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
    } else {
      Write-Host "No local changes to commit"
    }
    git push -u zaragoza444 "HEAD:$($r.Branch)"
  } finally {
    Pop-Location
  }
}

Write-Host "`nDone. Primary monorepo: https://github.com/zaragoza444/nova-trust" -ForegroundColor Cyan
