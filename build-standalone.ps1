$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$ConfigPath = Join-Path $Root 'app.config.json'
$DepsPath = Join-Path $Root 'dependencies.json'
$TemplatePath = Join-Path $Root 'src\index.template.html'
$Dist = Join-Path $Root 'dist'

New-Item -ItemType Directory -Force -Path $Dist | Out-Null
$config = Get-Content -Raw -Encoding UTF8 $ConfigPath | ConvertFrom-Json
$deps = Get-Content -Raw -Encoding UTF8 $DepsPath | ConvertFrom-Json
$template = Get-Content -Raw -Encoding UTF8 $TemplatePath

$placeholders = @('__APP_CONFIG_JSON__','__BUILD_MANIFEST_JSON__','__EMBEDDED_ASSET_BUNDLE_BASE64__')
foreach ($p in $placeholders) {
    $count = ([regex]::Matches($template, [regex]::Escape($p))).Count
    if ($count -ne 1) { throw "Expected placeholder $p exactly once; found $count" }
}

$generatedAt = [DateTimeOffset]::UtcNow.ToString('o')
$manifest = [ordered]@{
    name = $config.name
    version = $config.version
    generatedAt = $generatedAt
    dependencyCount = @($deps.dependencies).Count
    source = 'src/index.template.html'
}
$configJson = $config | ConvertTo-Json -Depth 20 -Compress
$manifestJson = $manifest | ConvertTo-Json -Depth 20 -Compress
$assetJson = '{}'
$assetB64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($assetJson))

$html = $template.Replace('__APP_CONFIG_JSON__', $configJson).Replace('__BUILD_MANIFEST_JSON__', $manifestJson).Replace('__EMBEDDED_ASSET_BUNDLE_BASE64__', $assetB64)
$outputPath = Join-Path $Root $config.build.output
[IO.File]::WriteAllText($outputPath, $html, [Text.UTF8Encoding]::new($false))
[IO.File]::WriteAllText((Join-Path $Dist 'build-manifest.json'), ($manifest | ConvertTo-Json -Depth 20), [Text.UTF8Encoding]::new($false))
[IO.File]::WriteAllText((Join-Path $Dist 'dependency-manifest.json'), (@{ dependencies = @($deps.dependencies) } | ConvertTo-Json -Depth 20), [Text.UTF8Encoding]::new($false))
[IO.File]::WriteAllText((Join-Path $Dist '.nojekyll'), '', [Text.UTF8Encoding]::new($false))

& (Join-Path $Root 'scripts\verify-standalone.ps1') -Path $outputPath
if ($config.build.selfExtract.enabled) {
    $selfPath = Join-Path $Root $config.build.selfExtract.output
    & (Join-Path $Root 'scripts\build-self-extract.ps1') -InputPath $outputPath -OutputPath $selfPath
    & (Join-Path $Root 'scripts\verify-self-extract.ps1') -ReadablePath $outputPath -SelfExtractPath $selfPath
}
Write-Host "Built $($config.name) $($config.version)" -ForegroundColor Green
