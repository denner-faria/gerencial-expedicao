[Reflection.Assembly]::LoadWithPartialName("Microsoft.SqlServer.Smo") | Out-Null
$server = New-Object Microsoft.SqlServer.Management.Smo.Server("192.168.20.30")
$server.ConnectionContext.LoginSecure = $false
$server.ConnectionContext.Login = "sa"
$server.ConnectionContext.Password = "S!deral@2024"

$db = $server.Databases["ExpedicaoDB"]
if ($null -eq $db) {
    Write-Host "Database ExpedicaoDB not found on server 192.168.20.30"
    exit
}

$options = New-Object Microsoft.SqlServer.Management.Smo.ScriptingOptions
$options.ScriptSchema = $true
$options.ScriptData = $false
$options.ScriptDrops = $false
$options.Indexes = $true
$options.DriAll = $true

$scriptText = "CREATE DATABASE ExpedicaoDB;`r`nGO`r`nUSE ExpedicaoDB;`r`nGO`r`n"

foreach ($table in $db.Tables) {
    if (-not $table.IsSystemObject) {
        try {
            $lines = $table.Script($options)
            foreach ($line in $lines) {
                $scriptText += $line + "`r`n"
            }
            $scriptText += "GO`r`n"
        } catch {
            Write-Host "Failed to script table: $($table.Name)"
        }
    }
}

Set-Content -Path ".\Criar_Banco_ExpedicaoDB.sql" -Value $scriptText -Encoding UTF8
Write-Host "Database script generated successfully."
