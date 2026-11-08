param([string]$Server = "w1t@w1tos")
$ErrorActionPreference = "Stop"
$out = "build/sysroot/var/lib/casaos/www"
# Recursive: chunks are in $out/ and public files in $out/js/
# -Quiet returns one bool per file on PowerShell 5.1, so test for any $true
if ((Get-ChildItem -Path $out -Recurse -Filter *.js | Select-String -CaseSensitive -Pattern '"(Path|PATH|USERPROFILE)":"[A-Za-z]:' -Quiet) -contains $true) { throw "Env leak in bundle. Aborting." }
# GNU tar from Git for Windows: Windows' own tar can't set modes and stores 0777 dirs (world-writable on the server)
$gitBin = Join-Path (Split-Path (Split-Path (Get-Command git).Source)) "usr\bin"
$gnuTar = Join-Path $gitBin "tar.exe"
if (-not (Test-Path $gnuTar)) { throw "GNU tar not found at $gnuTar (install Git for Windows)." }
$env:PATH = "$gitBin;$env:PATH" # its tar runs Git's gzip
& $gnuTar -czf w1tos-ui.tgz --mode='u+rwX,go+rX,go-w' --owner=0 --group=0 -C $out .
if ($LASTEXITCODE -ne 0) { throw "tar failed (exit $LASTEXITCODE)." }
try {
	# Native commands don't honour $ErrorActionPreference on 5.1: check exit codes so a failed upload never gets swapped in
	scp w1tos-ui.tgz "${Server}:/tmp/w1tos-ui.tgz"
	if ($LASTEXITCODE -ne 0) { throw "Upload failed (scp exit $LASTEXITCODE). Server unchanged." }
	ssh $Server "sudo /usr/local/bin/w1tos-swap deploy /tmp/w1tos-ui.tgz"
	if ($LASTEXITCODE -ne 0) { throw "Swap failed (exit $LASTEXITCODE). Run 'sudo w1tos-swap rollback' if the UI is broken." }
} finally {
	Remove-Item w1tos-ui.tgz
}
