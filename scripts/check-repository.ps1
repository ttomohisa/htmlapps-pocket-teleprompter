$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
& (Join-Path $Root 'build-standalone.ps1')
$config = Get-Content -Raw -Encoding UTF8 (Join-Path $Root 'app.config.json') | ConvertFrom-Json
$html = Get-Content -Raw -Encoding UTF8 (Join-Path $Root $config.build.output)
$required = @('Pocket Teleprompter','readerView','readerScroller','requestWakeLock','APP:BEGIN','APP:END','APP:HELP:BEGIN','APP:HELP:END')
foreach ($item in $required) { if (-not $html.Contains($item)) { throw "Required content missing: $item" } }
$testFiles=@(Get-ChildItem -LiteralPath (Join-Path $Root 'tests') -Filter '*.test.cjs' | ForEach-Object {$_.FullName})
$previous=$env:TELEPROMPTER_HTML
try{foreach($variant in @('src/index.template.html','dist/index.html','pocket-teleprompter.html','dist/index.self-extract.html')){
 $env:TELEPROMPTER_HTML=Join-Path $Root $variant
 & node --test @testFiles
 if($LASTEXITCODE -ne 0){throw "JavaScript tests failed: $variant"}
}}finally{$env:TELEPROMPTER_HTML=$previous}
Write-Host 'Repository checks passed' -ForegroundColor Green

# Keep internal QA/implementation prose out of user-facing help.
& node (Join-Path $Root "tests/help-copy.test.cjs")
if ($LASTEXITCODE -ne 0) { throw "User-facing help copy regression failed." }

# Header icons and version visibility across source and generated releases.
& node (Join-Path $Root "scripts/test-header-ui.cjs")
if ($LASTEXITCODE -ne 0) { throw "Header UI regression failed." }

& node (Join-Path $Root "scripts/test-common-ui.cjs")
if($LASTEXITCODE -ne 0){throw "Common UI checks failed"}
