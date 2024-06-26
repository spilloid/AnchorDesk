
# Define starter vars
$username = "phoenixtank\admina"
$password = "FWxa6vJrpcMQm5C"
$sourcePath = "\\phx-fs01\Programs\Applications\AutoCAD\2024"
$zipFile = "AutoCAD_2024.zip"
$destPath = "C:\temp"
$baseDir = "C:\temp\AutoCAD_2024"

# Check for existing Mathcad installation
try {
    $mathcad = Get-WmiObject -Query "SELECT * FROM Win32_Product WHERE (Name LIKE 'PTC AutoCAD 2024%')"
    if ($mathcad) {
        Write-Host "AutoCAD 2024 is already installed."
        Exit
    }
} catch {
    Write-Host "Failed to check or uninstall existing Mathcad. Error: $_"
}
# Cleanup existing files if they exist
try {
    if (Test-Path $BaseDir) {
        Remove-Item -Path $BaseDir -Recurse -Force
    }
} catch {
    Write-Host "Failed to clean up existing files. Error: $_"
}

# Step 0: Authenticate against the UNC path
net use $sourcePath /user:$username $password
# Step 1: Copy the ZIP file using RoboCopy
robocopy $sourcePath $destPath $zipFile /Z /NP
# Step 2: Extract the ZIP file
Expand-Archive -Path $destPath/$zipFile -DestinationPath $destPath -Force

# Install AutoCAD 2024
try {
    Start-Process -FilePath "$baseDir\Setup.exe" -ArgumentList "-q" -Wait
} catch {
    Write-Host "Failed to install AutoCAD 2024. Error: $_"
    exit 1
}