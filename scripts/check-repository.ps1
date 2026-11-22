$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
# Validate committed one-file downloads before the build overwrites them.
$readable = Join-Path $Root 'dist/index.html'
$selfExtract = Join-Path $Root 'dist/index.self-extract.html'
$rootDownload = Join-Path $Root 'pocket-teleprompter.html'
$configBefore = Get-Content -Raw -Encoding UTF8 (Join-Path $Root 'app.config.json') | ConvertFrom-Json
$trackedHtml = Get-Content -Raw -Encoding UTF8 $readable
if ($trackedHtml -cne (Get-Content -Raw -Encoding UTF8 $rootDownload)) { throw 'Tracked standalone and root HTML differ' }
$embeddedConfig = [regex]::Match($trackedHtml, '<script id="appConfig" type="application/json">([^<]*)</script>')
if (-not $embeddedConfig.Success) { throw 'Tracked standalone app config is missing' }
if (($embeddedConfig.Groups[1].Value | ConvertFrom-Json).version -ne $configBefore.version) { throw 'Tracked standalone version differs from app.config.json' }
& (Join-Path $Root 'scripts/verify-self-extract.ps1') -ReadablePath $readable -SelfExtractPath $selfExtract
& (Join-Path $Root 'build-standalone.ps1')
$config = Get-Content -Raw -Encoding UTF8 (Join-Path $Root 'app.config.json') | ConvertFrom-Json
$html = Get-Content -Raw -Encoding UTF8 (Join-Path $Root $config.build.output)
$required = @('Pocket Teleprompter','readerView','readerScroller','requestWakeLock','APP:BEGIN','APP:END','APP:HELP:BEGIN','APP:HELP:END')
foreach ($item in $required) { if (-not $html.Contains($item)) { throw "Required content missing: $item" } }
& node --test (Join-Path $Root 'tests/text-files.test.cjs') (Join-Path $Root 'tests/standalone.test.cjs') (Join-Path $Root 'tests/reader-navigation.test.cjs') (Join-Path $Root 'tests/session-safety.test.cjs') (Join-Path $Root 'tests/help-layout.test.cjs') (Join-Path $Root 'tests/accessible-controls.test.cjs') (Join-Path $Root 'tests/docs-consistency.test.cjs')
if ($LASTEXITCODE -ne 0) { throw 'JavaScript tests failed' }
Write-Host 'Repository checks passed' -ForegroundColor Green

# Keep internal QA/implementation prose out of user-facing help.
& node (Join-Path $Root "tests/help-copy.test.cjs")
if ($LASTEXITCODE -ne 0) { throw "User-facing help copy regression failed." }

# Header icons and version visibility across source and generated releases.
& node (Join-Path $Root "scripts/test-header-ui.cjs")
if ($LASTEXITCODE -ne 0) { throw "Header UI regression failed." }
