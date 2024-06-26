# Define constants and utility functions
$USERNAME = "phoenixtank\automate_svc"
$PASSWORD = "#DxHAouq#P9U2^"
$SOURCE_PATH = "\\phx-fs01\Programs\Applications\Matlab & Simulink\R2021b\64 bit"
$DEST_PATH = "C:\temp\MatLab2021b"
$CONFIG_FILE_NAME = "silent_installer_input.txt"

function Test-And-Copy {
    param(
        [string]$source,
        [string]$destination,
        [string]$username,
        [string]$password
    )

    # Authenticate against the UNC path
    net use $source /user:$username $password

    # Copy the folder using RoboCopy
    robocopy $source $destination /Z /NP /E
}

function Install-Matlab {
    param(
        [string]$installPath,
        [string]$configFilePath
    )

    # Start Matlab installation process
    Start-Process -FilePath "$installPath\setup.exe" -ArgumentList "-inputFile $configFilePath" -Wait
}

# Main script execution
try {
    $app = Get-WmiObject -Query "SELECT * FROM Win32_Product WHERE (Name LIKE 'matLab%')"
    if ($app) {
        Write-Host "MatLab is already installed."
        exit
    }

    if (Test-Path $DEST_PATH) {
        Remove-Item -Path $DEST_PATH -Recurse -Force
    }

    Test-And-Copy -source $SOURCE_PATH -destination $DEST_PATH -username $USERNAME -password $PASSWORD

    $configFilePath = Join-Path -Path $DEST_PATH -ChildPath $CONFIG_FILE_NAME
    $newValue = "$ENV:license_key"
    (Get-Content -Path $configFilePath -Raw) -replace '# fileInstallationKey=', "fileInstallationKey=$newValue" | Set-Content -Path $configFilePath

    Write-Host "License key applied successfully!"
    Install-Matlab -installPath $DEST_PATH -configFilePath $configFilePath
} catch {
    Write-Error "An error occurred: $_"
    exit 1
}

Write-Host "MatLab installation completed successfully!"
