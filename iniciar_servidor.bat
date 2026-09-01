@echo off
title Servidor Local - Portfolio Vagner Santos
cd /d "%~dp0"
echo ===================================================
echo   Iniciando Servidor Local em http://localhost:8080
echo   Pressione Ctrl + C para parar o servidor.
echo ===================================================
start http://localhost:8080
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"
pause
