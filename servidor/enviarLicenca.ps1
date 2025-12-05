# 1. Defina a URL do seu Webhook N8N
$webhookUrl = "http://host.docker.internal:5678/webhook/d531f600-61a9-4f62-916f-69152adc3d8c"

# 2. Identificar o nome do computador (Hostname)
$hostname = $env:COMPUTERNAME

# ---
# 3. Coletar Dados do Ativo (CMDB)
# ---

Write-Host "Coletando dados do ativo..."

# 3.1. Sistema Operacional
$osInfo = Get-CimInstance -ClassName Win32_OperatingSystem | Select-Object Caption, Version

# 3.2. Hardware (Modelo, RAM, Fabricante)
$csInfo = Get-CimInstance -ClassName Win32_ComputerSystem
$manufacturer = $csInfo.Manufacturer
$model = $csInfo.Model
# Converte o total de bytes para Gigabytes e arredonda
$totalRAMGB = [math]::Round($csInfo.TotalPhysicalMemory / 1GB, 2)

# 3.3. CPU
# Pega o nome do primeiro processador
$cpuInfo = (Get-CimInstance -ClassName Win32_Processor | Select-Object -First 1).Name

# 3.4. Número de Série (Crucial para o CMDB)
$serialNumber = (Get-CimInstance -ClassName Win32_BIOS).SerialNumber.Trim() # .Trim() remove espaços em branco

# 3.5. Endereço IP
# Pega o primeiro endereço IPv4 da placa de rede que tem um Gateway (a placa principal)
$ipConfig = Get-CimInstance -ClassName Win32_NetworkAdapterConfiguration | Where-Object { $_.DefaultIPGateway -ne $null -and $_.IPAddress -ne $null } | Select-Object -First 1
$ipAddress = $ipConfig.IPAddress | Where-Object { $_ -match "^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$" } | Select-Object -First 1

# 3.6. Licença do Windows (do script anterior)
$licenseInfo = Get-CimInstance -ClassName SoftwareLicensingProduct | Where-Object { $_.Name -like "*Windows*" -and $_.PartialProductKey } | Select-Object Name, LicenseStatus, ExpirationDate, PartialProductKey

Write-Host "Coleta concluída."

# ---
# 4. Preparar o "corpo" (payload) dos dados em formato JSON
# ---
# Agora, incluímos todos os novos dados no payload
$payload = @{
    hostname = $hostname
    serialNumber = $serialNumber
    fabricante = $manufacturer
    modelo = $model
    sistemaOperacional = $osInfo.Caption
    versaoSO = $osInfo.Version
    cpu = $cpuInfo
    memoriaRAM_GB = $totalRAMGB
    ipAddress = $ipAddress
    licencaWindows = $licenseInfo # Mudei o nome da chave para ser mais específico
} | ConvertTo-Json -Depth 5 # O -Depth 5 garante que os objetos aninhados sejam convertidos

# ---
# 5. Enviar os dados para o N8N
# ---
try {
    Write-Host "Enviando dados para o N8N em $webhookUrl..."
    
    # Usamos Invoke-RestMethod para fazer o "POST" para o Webhook
    Invoke-RestMethod -Uri $webhookUrl -Method Post -Body $payload -ContentType "application/json"
    
    Write-Host "Dados do ativo enviados com sucesso para o N8N."
} catch {
    Write-Host "ERRO ao enviar dados para o N8N:"
    Write-Host $_
}