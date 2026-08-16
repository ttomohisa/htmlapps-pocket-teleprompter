param(
    [Parameter(Mandatory=$true)][string]$ReadablePath,
    [Parameter(Mandatory=$true)][string]$SelfExtractPath
)
$ErrorActionPreference = 'Stop'
if (-not (Test-Path $ReadablePath) -or -not (Test-Path $SelfExtractPath)) { throw 'Missing release artifact' }
$self = Get-Content -Raw -Encoding UTF8 $SelfExtractPath
if ($self -notmatch "const b='([^']+)'" ) { throw 'Embedded gzip payload not found' }
$compressed = [Convert]::FromBase64String($Matches[1])
$input = [IO.MemoryStream]::new($compressed)
$gzip = [IO.Compression.GZipStream]::new($input, [IO.Compression.CompressionMode]::Decompress)
$out = [IO.MemoryStream]::new(); $gzip.CopyTo($out); $gzip.Dispose(); $input.Dispose()
$original = [IO.File]::ReadAllBytes($ReadablePath); $decoded = $out.ToArray(); $out.Dispose()
if ($original.Length -ne $decoded.Length) { throw 'Self-extract decoded size differs' }
for ($i=0; $i -lt $original.Length; $i++) { if ($original[$i] -ne $decoded[$i]) { throw "Self-extract mismatch at byte $i" } }
Write-Host 'Self-extract verification passed' -ForegroundColor Green
