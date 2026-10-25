@echo off
chcp 65001 >nul
title INSTALADOR FIDAL GO NA TV STICK
cls
cd /d "%~dp0"

echo ========================================================
echo       INSTALADOR AUTOMATICO FIDAL GO NA TV STICK
echo ========================================================
echo.

set TV_IP=192.168.10.104
set /p USER_IP="Digite o IP da TV Stick [Pressione ENTER para usar %TV_IP%]: "
if not "%USER_IP%"=="" set TV_IP=%USER_IP%

echo.
echo [1/3] Conectando ao IP da TV: %TV_IP%:5555 ...
adb disconnect
adb connect %TV_IP%:5555

echo.
echo [2/3] Verificando conexão...
adb devices

echo.
echo [3/3] Enviando e instalando FIDAL GO TV...
adb -s %TV_IP%:5555 install -r "%~dp0FIDAL_GO_TV.apk"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo  INSTALAÇÃO CONCLUÍDA COM SUCESSO NA TV!
    echo ========================================================
    echo Abrindo aplicativo na TV...
    adb -s %TV_IP%:5555 shell monkey -p com.fidalgo.tv -c android.intent.category.LAUNCHER 1
) else (
    echo.
    echo [AVISO] Falha ao instalar via ADB.
    echo DICA: Use o app DOWNLOADER na TV Stick acessando:
    echo        fidalgotv.ngrok.app/apk
)

echo.
pause
