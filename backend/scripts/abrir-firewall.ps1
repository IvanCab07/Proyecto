# Abre el puerto 3000 (Hospital API) en el Firewall de Windows.
# Se auto-eleva si no se ejecuta como administrador.
$ruleName = 'Hospital API 3000'
$port     = 3000

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
           ).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host 'Se necesitan permisos de administrador: aceptar el cartel que aparece...' -ForegroundColor Yellow
    Start-Process powershell -Verb RunAs -ArgumentList '-ExecutionPolicy', 'Bypass', '-File', "`"$PSCommandPath`""
    exit
}

$existing = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "La regla '$ruleName' ya existe. El puerto $port ya esta abierto." -ForegroundColor Green
} else {
    New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Action Allow -Protocol TCP -LocalPort $port | Out-Null
    Write-Host "Listo: puerto $port abierto en el firewall (regla '$ruleName')." -ForegroundColor Green
}

Read-Host 'Presiona Enter para cerrar'
