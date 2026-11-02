param([string]$Server = "advaita@advaitaos")
$ErrorActionPreference = "Stop"
$out = "build/sysroot/var/lib/casaos/www"
# Recursive: chunks are in $out/ and public files in $out/js/
if (Get-ChildItem -Path $out -Recurse -Filter *.js | Select-String -CaseSensitive -Pattern '"(Path|PATH|USERPROFILE)":"[A-Za-z]:' -Quiet) { throw "Env leak in bundle. Aborting." }
tar -czf advaitaos-ui.tgz -C $out .
scp advaitaos-ui.tgz "${Server}:/tmp/advaitaos-ui.tgz"
ssh $Server "sudo /usr/local/bin/advaitaos-swap deploy /tmp/advaitaos-ui.tgz"
Remove-Item advaitaos-ui.tgz
