@echo off
REM Ejecutar como Administrador (clic derecho > Ejecutar como administrador)
netsh advfirewall firewall add rule name="Hospital API 3000" dir=in action=allow protocol=TCP localport=3000
echo Regla de firewall agregada para el puerto 3000.
pause
