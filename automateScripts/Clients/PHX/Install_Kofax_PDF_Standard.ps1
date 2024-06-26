# PowerShell Script to Copy, Extract, and Install Kofax Power PDF Standard

# Initialize variables
$sourcePath = "\\phx-fs01\Avon\IT Resources\KoFax PDF Standard 5.0 installer"
$zipFile = "KofaxPowerPDFStandard-5.0.0.zip"
$destPath = "C:\temp"
$extractPath = "C:\temp\Kofax"
$installerPath = "C:\temp\Kofax\System64\Kofax Power PDF Standard.msi"
$username = "phoenixtank\admina"
$password = "FWxa6vJrpcMQm5C"

# Step 0: Authenticate against the UNC path
net use $sourcePath /user:$username $password
# Step 1: Copy the ZIP file using RoboCopy
robocopy $sourcePath $destPath $zipFile /Z /NP
# Step 2: Extract the ZIP file
Expand-Archive -Path $destPath/$zipFile -DestinationPath $extractPath -Force
# Step 3: Run the installer using msiexec
Start-Process -FilePath "msiexec" -ArgumentList "/i `"$installerPath`" /qn" -Wait
# Step 4: Confirm if Kofax is installed
try {
    $installedApps = Get-WmiObject -Class Win32_Product | Select-Object -Property Name
    $isKofaxInstalled = $installedApps | Where-Object { $_.Name -like "*kofax*" }

    if ($isKofaxInstalled) {
        Write-Host "Success: Kofax is installed."
    } else {
        Write-Host "Error: Kofax is not installed."
        exit 1
    }
} catch {
    Write-Host "Error: Failed to check if Kofax is installed. $_"
    exit 1
}
