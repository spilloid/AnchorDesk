# Define starter vars
$username = "phoenixtank\admina"
$password = "FWxa6vJrpcMQm5C"
$sourcePath = "\\phx-fs01\Programs\Applications\MathCad\Prime\Prime 9.0"
$zipFile = "MED-60893-CD-290_9-0-0-0.zip"
$destPath = "C:\temp"
$baseDir = "C:\temp\MathcadPrime"

# Check for existing Mathcad installation
try {
    $mathcad = Get-WmiObject -Query "SELECT * FROM Win32_Product WHERE (Name LIKE 'PTC Mathcad Prime 9.0%')"
    if ($mathcad) {
        Write-Host "Mathcad Prime 9.0 is already installed."
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
Expand-Archive -Path $destPath/$zipFile -DestinationPath $baseDir -Force

# Install Mathcad Prime 9.0
try {
    Start-Process -FilePath "$baseDir\setup.exe" -ArgumentList "-xml $baseDir\mathcad.p.xml" -Wait
} catch {
    Write-Host "Failed to install Mathcad Prime 9.0. Error: $_"
    exit 1
}