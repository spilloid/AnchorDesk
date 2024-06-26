# Define the network credentials
$username = "phoenixtank\automate_svc"
$password = "#DxHAouq#P9U2^"

# Define the source and destination paths
$sourcePath = "\\phx-fs01\Programs\Applications\Winscp_and_yooz"
$msiFile = "WinSCP-6.3.3.msi"
$configFile = "yooz_config.ini"
$shortcutFile = "Yooz AP SFTP Site.lnk"

$installDir = "C:\Program Files (x86)\WinSCP"
$desktopDir = "C:\Users\Public\Desktop"

# Step 0: Authenticate against the UNC path
net use $sourcePath /user:$username $password

# Check if the network drive is mapped successfully
if (Test-Path $sourcePath) {
    # Install the MSI
    Start-Process msiexec.exe -ArgumentList "/i `"$sourcePath\$msiFile`" /quiet /norestart" -Wait

    # Check if installation was successful
    if (Test-Path $installDir) {
        # Copy the ini file to the installation directory
        Copy-Item "$sourcePath\$configFile" -Destination $installDir

        # Copy the shortcut file to the public desktop directory
        Copy-Item "$sourcePath\$shortcutFile" -Destination $desktopDir

        Write-Output "Installation and file transfers completed successfully."
    } else {
        Write-Output "Installation failed or the installation directory was not found."
    }

    # Disconnect the network drive
    net use $sourcePath /delete
} else {
    Write-Output "Failed to map the network drive."
}
