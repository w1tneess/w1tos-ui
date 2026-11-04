param([string]$Server = "w1t@w1tos")
$ErrorActionPreference = "Stop"
$out = "build/sysroot/var/lib/casaos/www"
# Recursive: chunks are in $out/ and public files in $out/js/
if (Get-ChildItem -Path $out -Recurse -Filter *.js | Select-String -CaseSensitive -Pattern '"(Path|PATH|USERPROFILE)":"[A-Za-z]:' -Quiet) { throw "Env leak in bundle. Aborting." }
tar -czf w1tos-ui.tgz -C $out .
scp w1tos-ui.tgz "${Server}:/tmp/w1tos-ui.tgz"
ssh $Server "sudo /usr/local/bin/w1tos-swap deploy /tmp/w1tos-ui.tgz"
Remove-Item w1tos-ui.tgz
