@echo off
chcp 65001 >nul
title IPTV Brasil 2026 ^& RedeCanais
echo Iniciando IPTV Brasil 2026 + RedeCanais...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"
pause
