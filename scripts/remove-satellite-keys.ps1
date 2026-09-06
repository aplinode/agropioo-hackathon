# Remove satellite translation keys from catalog files
# Only removes keys that START with "app.satellite." or "app.shell.nav.satellite" or "home.ticker.satelliteNdvi"
# Preserves other keys that mention "satellite" in their values
$catalogFiles = Get-ChildItem -Path "catalog\*.ts" -File | Where-Object { $_.Name -ne "catalog.test.ts" -and $_.Name -ne "index.ts" }

foreach ($file in $catalogFiles) {
    Write-Host "Processing $($file.Name)..."
    
    $lines = Get-Content -Path $file.FullName
    $filteredLines = @()
    $removedCount = 0
    $inSatelliteBlock = $false
    
    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        $trimmed = $line.Trim()
        
        # Track if we're inside the satellite comment block
        if ($trimmed -match '\/\*.*Satellite monitoring') {
            $inSatelliteBlock = $true
            $removedCount++
            continue
        }
        if ($inSatelliteBlock -and $trimmed -match '^\s*\*\/') {
            $inSatelliteBlock = $false
            $removedCount++
            continue
        }
        if ($inSatelliteBlock) {
            $removedCount++
            continue
        }
        
        # Remove satellite-specific keys (keys that start with these prefixes)
        if ($trimmed -match '^\s*"app\.satellite\.' -or
            $trimmed -match '^\s*"app\.shell\.nav\.satellite"' -or
            $trimmed -match '^\s*"home\.ticker\.satelliteNdvi"') {
            $removedCount++
            continue
        }
        
        $filteredLines += $line
    }
    
    # Write the filtered content back
    $filteredLines | Set-Content -Path $file.FullName -NoNewline
    
    Write-Host "Updated $($file.Name) - removed $removedCount satellite keys"
}

Write-Host "Done!"