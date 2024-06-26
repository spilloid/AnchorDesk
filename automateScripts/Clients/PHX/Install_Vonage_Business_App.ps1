# Define the URL of the executable
$url = "https://vbc-downloads.vonage.com/win/VonageBusinessSetup.exe"

# Define the destination path for the downloaded file
$destination = "C:\Temp\VonageBusinessSetup.exe"

# Download the file
try {
    Invoke-WebRequest -Uri $url -OutFile $destination

    # Check if the download was successful
    if (Test-Path $destination) {
        Write-Host "File downloaded successfully to $destination."

        # Run the installer silently
        Start-Process -FilePath $destination -ArgumentList "/S" -Wait
        Write-Host "Installation completed silently."
    }
    else {
        Write-Host "File download failed."
    }
}
catch {
    # Handle any errors that may occur during the download or installation
    Write-Host "An error occurred: $($_.Exception.Message)"
}
