param(
  [Parameter(Mandatory = $false)]
  [string]$BaseId
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($BaseId)) {
  $BaseId = Read-Host 'Reviewed AIRTABLE_PAYMENTS_BASE_ID'
}
$BaseId = $BaseId.Trim()
if ($BaseId -notmatch '^app[A-Za-z0-9]{10,}$') {
  throw 'A reviewed Airtable base ID beginning with app is required.'
}

$secureToken = Read-Host 'Read-only Airtable personal access token' -AsSecureString
$tokenPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureToken)
$exitCode = 2

try {
  $plainToken = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($tokenPointer)
  if ([string]::IsNullOrWhiteSpace($plainToken)) {
    throw 'A read-only Airtable token is required.'
  }

  $repoRoot = Split-Path -Parent $PSScriptRoot
  $env:AIRTABLE_PAT = $plainToken
  $env:AIRTABLE_API_KEY = ''
  $env:AIRTABLE_PAYMENTS_BASE_ID = $BaseId
  $env:TENANT_AUDIT_FIXTURE = ''

  Push-Location $repoRoot
  try {
    & node 'scripts/audit-tenant-data-readiness.mjs'
    $exitCode = $LASTEXITCODE
  } finally {
    Pop-Location
  }
} finally {
  $plainToken = $null
  Remove-Item Env:AIRTABLE_PAT -ErrorAction SilentlyContinue
  Remove-Item Env:AIRTABLE_API_KEY -ErrorAction SilentlyContinue
  Remove-Item Env:AIRTABLE_PAYMENTS_BASE_ID -ErrorAction SilentlyContinue
  Remove-Item Env:TENANT_AUDIT_FIXTURE -ErrorAction SilentlyContinue
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($tokenPointer)
}

exit $exitCode
