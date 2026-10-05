$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
& (Join-Path $Root 'build-standalone.ps1')
$config = Get-Content -Raw -Encoding UTF8 (Join-Path $Root 'app.config.json') | ConvertFrom-Json
$html = Get-Content -Raw -Encoding UTF8 (Join-Path $Root $config.build.output)
$required = @('Pocket Teleprompter','readerView','readerScroller','requestWakeLock','APP:BEGIN','APP:END','APP:HELP:BEGIN','APP:HELP:END')
foreach ($item in $required) { if (-not $html.Contains($item)) { throw "Required content missing: $item" } }
& node --test (Join-Path $Root 'tests/text-files.test.cjs') (Join-Path $Root 'tests/standalone.test.cjs') (Join-Path $Root 'tests/reader-navigation.test.cjs')
if ($LASTEXITCODE -ne 0) { throw 'JavaScript tests failed' }
Write-Host 'Repository checks passed' -ForegroundColor Green
