$appId = "9NP355QT2SQB" # Azure VPN Client app ID
$xmlFilePath = "$env:temp\azurevpnconfig.xml"

# XML Configuration Data (Place your actual XML here)
$xmlConfig = @'
<AzVpnProfile xmlns:i="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://schemas.datacontract.org/2004/07/">
  <any xmlns:d2p1="http://schemas.datacontract.org/2004/07/System.Xml"
    i:nil="true" />
  <clientauth>
    <aad>
      <audience>41b23e61-6c1e-4545-b367-cd054e0ed4b4</audience>
      <cachesigninuser>true</cachesigninuser>
      <issuer>https://sts.windows.net/a9bd758c-0a1b-4b7a-b70c-913ee4c10327/</issuer>
      <tenant>https://login.microsoftonline.com/a9bd758c-0a1b-4b7a-b70c-913ee4c10327/</tenant>
    </aad>
    <cert
      i:nil="true" />
    <type>aad</type>
    <usernamepass
      i:nil="true" />
  </clientauth>
  <clientconfig>
    <dnsservers>
      <DnsServerEntry>
        <dnsserver>172.16.10.4</dnsserver>
      </DnsServerEntry>
      <DnsServerEntry>
        <dnsserver>1.1.1.1</dnsserver>
      </DnsServerEntry>
    </dnsservers>
    <excluderoutes
      i:nil="true" />
    <includeroutes
      i:nil="true" />
  </clientconfig>
  <name>PHX-VNET</name>
  <protocolconfig>
    <sslprotocolConfig>
      <transportprotocol>tcp</transportprotocol>
    </sslprotocolConfig>
  </protocolconfig>
  <serverlist>
    <ServerEntry>
      <displayname
        i:nil="true" />
      <fqdn>azuregateway-b9680075-f3e0-4f04-99b5-f96998ecdba5-17915e5e4437.vpn.azure.com</fqdn>
    </ServerEntry>
  </serverlist>
  <servervalidation>
    <cert>
      <hash>A8985D3A65E5E5C4B2D7D66D40C6DD2FB19C5436</hash>
      <issuer
        i:nil="true" />
    </cert>
    <serversecret>ba0b7c45446256ff78d73325a9bd22634464d43f56b67eb152b7a15d5cbe28ea826b0d5c3f8e95405fd819d2dc31634253a3c4136790d8ce930b708c09665c40747aef0938c422c2b1a5a71060f9a491dcfa65f215790e945941f6aeb8f7d352f545b978a85d4975938a65cbad829c29b4d5d984a3873b136b48ecd8d7d2b66f7e3cdaca73fd680f85007cbf11cfbb0e9690336f8216c63de29acd8b82c47bd32be01ce1abeed920661c6a1074b81645ae99ef1493101a41841bd07a1bd016a3d54f2c956a5708a43f23cb7d926cca3c8b73f9e9de6d043cbba3473bac71d53ddbdc33622c53f433efae5641db1d9da96c021ea34b9e2dd730f5723064346efc</serversecret>
    <type>cert</type>
  </servervalidation>
  <version>1</version>
</AzVpnProfile>
'@


# Write XML to a temporary file
Set-Content -Path $xmlFilePath -Value $xmlConfig

# Install Azure VPN Client (Winget preferred)
if (Get-Command winget -ErrorAction SilentlyContinue) {
    $installCommand = "winget install --id $appId --silent --source msstore --accept-package-agreements --accept-source-agreements"
    $result = Invoke-Expression $installCommand
    if ($result -ne 0) {
        Write-Output "ERROR: Azure VPN Client installation failed via Winget. Code: $result"
        exit 1
    }
} else {
    Write-Output "WARNING: Winget not found. Assuming Azure VPN Client is already installed."
}


# Get All User Profile Paths
$userProfiles = Get-ChildItem -Path C:\Users -Directory | Where-Object { $_.Name -notlike "*Public*" -and $_.Name -notlike "*Default*" }

# Copy Configuration to each profile and Run AzureVPN

foreach ($userProfile in $userProfiles) {
    $destinationPath = Join-Path $userProfile.FullName "AppData\Local\Packages\Microsoft.AzureVpn_8wekyb3d8bbwe\LocalState\azurevpnconfig.xml"
    try {
        Copy-Item -Path $xmlFilePath -Destination $destinationPath -Force
        Start-Process "azurevpn" -ArgumentList "-i azurevpnconfig.xml"
        Start-Sleep -Seconds 2 # brief delay to ensure it launches
        Stop-Process -Name "azurevpn" -Force
        Write-Output "SUCCESS: Azure VPN profile copied and applied for $($userProfile.Name)"
    } catch {
        Write-Output "ERROR: Failed to apply Azure VPN profile for $($userProfile.Name): $($_.Exception.Message)"
    }
}

Remove-Item -Path $xmlFilePath -Force # Clean up the temporary XML file
