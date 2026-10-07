$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$bundledNode = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
if (Test-Path -LiteralPath $bundledNode) { $nodePath = $bundledNode } else { $nodePath = (Get-Command node -ErrorAction Stop).Source }
$version = & $nodePath -p 'process.versions.node'
if ([version]$version -lt [version]'22.13.0') { throw 'Instala Node.js 22.13 o superior para abrir Alessa.' }
if (-not (Test-Path 'node_modules/vinext/dist/cli.js')) { throw 'Primero ejecuta npm install con una versión actual de Node.js.' }
$env:PATH = (Split-Path -Parent $nodePath) + ';' + $env:PATH
& $nodePath node_modules/vinext/dist/cli.js dev
