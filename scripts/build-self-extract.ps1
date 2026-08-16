param(
    [Parameter(Mandatory=$true)][string]$InputPath,
    [Parameter(Mandatory=$true)][string]$OutputPath
)
$ErrorActionPreference = 'Stop'
$bytes = [IO.File]::ReadAllBytes($InputPath)
$ms = [IO.MemoryStream]::new()
$gzip = [IO.Compression.GZipStream]::new($ms, [IO.Compression.CompressionLevel]::Optimal, $true)
$gzip.Write($bytes, 0, $bytes.Length)
$gzip.Dispose()
$b64 = [Convert]::ToBase64String($ms.ToArray())
$ms.Dispose()
$wrapper = @"
<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pocket Teleprompter</title></head><body><noscript>JavaScript is required.</noscript><script>
(async()=>{const b='$b64';const raw=Uint8Array.from(atob(b),c=>c.charCodeAt(0));if(!('DecompressionStream'in window)){document.body.textContent='This browser does not support DecompressionStream. Use dist/index.html instead.';return;}const stream=new Blob([raw]).stream().pipeThrough(new DecompressionStream('gzip'));const html=await new Response(stream).text();document.open();document.write(html);document.close();})().catch(e=>{document.body.textContent='Failed to open Pocket Teleprompter: '+e.message});
</script></body></html>
"@
[IO.File]::WriteAllText($OutputPath, $wrapper, [Text.UTF8Encoding]::new($false))
