$sourceServer = "192.168.20.30"
$targetServer = "192.168.20.163"
$dbName = "ExpedicaoDB"
$user = "sa"
$pass = "S!deral@2024"

# Disable all constraints on Target
Write-Host "Disabling constraints on Target..."
$disableSql = "EXEC sp_MSforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT ALL'"
sqlcmd -S $targetServer -U $user -P $pass -d $dbName -Q $disableSql

# Delete all data on Target
Write-Host "Deleting existing data on Target..."
$deleteSql = "EXEC sp_MSforeachtable 'DELETE FROM ?'"
sqlcmd -S $targetServer -U $user -P $pass -d $dbName -Q $deleteSql

# Get list of tables from Source
Write-Host "Getting tables from Source..."
$tablesSql = "SET NOCOUNT ON; SELECT SCHEMA_NAME(schema_id) + '.' + name FROM sys.tables WHERE is_ms_shipped = 0"
$tables = (sqlcmd -S $sourceServer -U $user -P $pass -d $dbName -Q $tablesSql -W -h -1) | Where-Object { $_.Trim() -ne "" -and $_.Trim() -notmatch "rows affected" }

# Export and Import
foreach ($table in $tables) {
    $tbl = $table.Trim()
    if ($tbl -eq "") { continue }
    
    Write-Host "Cloning $tbl..."
    
    # bcp out
    $bcpOut = "bcp `"$dbName.$tbl`" out `"$tbl.dat`" -S $sourceServer -U $user -P $pass -n"
    Invoke-Expression $bcpOut | Out-Null
    
    if (Test-Path "$tbl.dat") {
        # bcp in (using -E to keep identity values)
        $bcpIn = "bcp `"$dbName.$tbl`" in `"$tbl.dat`" -S $targetServer -U $user -P $pass -n -E"
        Invoke-Expression $bcpIn | Out-Null
        
        Remove-Item "$tbl.dat" -Force
    }
}

# Re-enable all constraints on Target
Write-Host "Re-enabling constraints on Target..."
$enableSql = "EXEC sp_MSforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT ALL'"
sqlcmd -S $targetServer -U $user -P $pass -d $dbName -Q $enableSql

Write-Host "Database cloning completed successfully!"
