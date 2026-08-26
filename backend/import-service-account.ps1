param(
  [Parameter(Mandatory = $true)]
  [string]$JsonPath
)

$jsonFile = (Resolve-Path -LiteralPath $JsonPath).Path
$serviceAccount = Get-Content -LiteralPath $jsonFile -Raw | ConvertFrom-Json

if (-not $serviceAccount.project_id -or -not $serviceAccount.client_email -or -not $serviceAccount.private_key) {
  throw "ไฟล์ JSON นี้ไม่มี project_id, client_email หรือ private_key ครบถ้วน"
}

$privateKey = $serviceAccount.private_key -replace "`r?`n", "\n"
$envContent = @"
# Firebase Admin credentials - generated locally from a service-account JSON file.
# Never commit this file or share its contents.
FIREBASE_PROJECT_ID=$($serviceAccount.project_id)
FIREBASE_CLIENT_EMAIL=$($serviceAccount.client_email)
FIREBASE_PRIVATE_KEY="$privateKey"
PORT=3000
"@

$envPath = Join-Path $PSScriptRoot ".env"
Set-Content -LiteralPath $envPath -Value $envContent -Encoding UTF8
Write-Host "เขียนค่า Firebase Admin ลง $envPath เรียบร้อยแล้ว"
