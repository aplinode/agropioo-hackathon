# Remove satellite translations from catalog files
$catalogFiles = Get-ChildItem -Path "catalog\*.ts" -File | Where-Object { $_.Name -ne "catalog.test.ts" -and $_.Name -ne "index.ts" }

foreach ($file in $catalogFiles) {
    Write-Host "Processing $($file.Name)..."
    
    # Read the file content
    $content = Get-Content -Path $file.FullName -Raw
    
    # Remove satellite-related translations
    # Remove lines containing "satellite" (case-insensitive)
    $content = $content -replace "(?m)^.*satellite.*$\r?\n", ""
    
    # Remove the satellite monitoring comment block
    $content = $content -replace "(?m)^.*Satellite monitoring.*$\r?\n", ""
    
    # Write the updated content back
    Set-Content -Path $file.FullName -Value $content -NoNewline
    
    Write-Host "Updated $($file.Name)"
}

Write-Host "Done!"