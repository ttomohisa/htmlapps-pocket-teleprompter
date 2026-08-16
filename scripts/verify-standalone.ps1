param([Parameter(Mandatory=$true)][string]$Path)
$ErrorActionPreference = 'Stop'
if (-not (Test-Path $Path)) { throw "Missing output: $Path" }
$html = Get-Content -Raw -Encoding UTF8 $Path
foreach ($p in @('__APP_CONFIG_JSON__','__BUILD_MANIFEST_JSON__','__EMBEDDED_ASSET_BUNDLE_BASE64__')) { if ($html.Contains($p)) { throw "Unresolved placeholder: $p" } }
if ($html -notmatch "connect-src\s+'none'") { throw "CSP must contain connect-src 'none'" }
$bad = @(
    '<script[^>]+src\s*=\s*["'']https?://',
    '<link[^>]+href\s*=\s*["'']https?://',
    '<img[^>]+src\s*=\s*["'']https?://',
    '<iframe[^>]+src\s*=\s*["'']https?://'
)
foreach ($pattern in $bad) { if ($html -match $pattern) { throw "External runtime resource found: $pattern" } }
if ($html -notmatch 'APP:HELP:BEGIN') { throw 'Help marker missing' }
Write-Host "Standalone verification passed: $Path" -ForegroundColor Green
