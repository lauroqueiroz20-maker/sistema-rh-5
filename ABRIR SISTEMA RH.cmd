@echo off
title SISTEMA RH 6.0 - DINIZ

cd /d "%~dp0"

echo Iniciando Sistema RH...
echo Aguarde abrir o navegador.

start "" "http://localhost:5173"

npm run dev