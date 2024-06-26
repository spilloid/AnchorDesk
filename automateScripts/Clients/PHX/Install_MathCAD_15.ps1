# Define starter vars
$username = "phoenixtank\admina"
$password = "FWxa6vJrpcMQm5C"
$sourcePath = "\\phx-fs01\Programs\Applications\MathCad\MathCAD\Mathcad 15\Mathcad 15-M050"
$zipFile = "Mathcad15_silent_installer.zip"
$destPath = "C:\temp"
$baseDir = "C:\temp\Mathcad15"

# Step 0: Authenticate against the UNC path
net use $sourcePath /user:$username $password
# Step 1: Copy the ZIP file using RoboCopy
robocopy $sourcePath $destPath $zipFile /Z /NP
# Step 2: Extract the ZIP file
Expand-Archive -Path $destPath/$zipFile -DestinationPath $destPath -Force

# Cleanup existing files if they exist
try {
    if (Test-Path $BasePath) {
        Remove-Item -Path $BaseDir -Recurse -Force
    }
} catch {
    Write-Host "Failed to clean up existing files. Error: $_"
}

# Check for existing Mathcad installation
try {
    $mathcad = Get-WmiObject -Query "SELECT * FROM Win32_Product WHERE (Name LIKE 'Mathcad%')"
    if ($mathcad) {
        Write-Host "Mathcad is already installed."
        Exit
    }
} catch {
    Write-Host "Failed to check or uninstall existing Mathcad. Error: $_"
}


# Enable .NET Framework 3.5 feature
try {
    DISM /Online /Enable-Feature /FeatureName:NetFx3 /All
} catch {
    Write-Host "Failed to enable .NET Framework 3.5. Error: $_"
    exit 1
}

# Install .NET Framework 3.5
try {
    Start-Process -FilePath "$baseDir\dotnetfx35setup.exe" -ArgumentList "/q /norestart" -Wait
} catch {
    Write-Host "Failed to install .NET Framework 3.5. Error: $_"
    exit 1
}

# Install Mathcad 15
try {
    Start-Process -FilePath "msiexec.exe" -ArgumentList "/I `"$baseDir\Mathcad15WixInstaller.msi`" INSTALLLOCATION=`"C:\Program Files (x86)\Mathcad\Mathcad 15`" /qn" -Wait
} catch {
    Write-Host "Failed to install Mathcad 15. Error: $_"
    exit 1
}

# Install Adobe Distiller
try {
    Start-Process -FilePath "msiexec.exe" -ArgumentList "/qn /I `"$baseDir\adobe\Distillr.msi`" ISX_SERIALNUMBER=`"1071-1006-8094-6401-2690-6767`" TRANSFORMS=`"$baseDir\adobe\MathCAD.mst`"" -Wait
} catch {
    Write-Host "Failed to install Adobe Distiller. Error: $_"
    exit 1
}

# Output success message
Write-Host "All software has been successfully installed."
