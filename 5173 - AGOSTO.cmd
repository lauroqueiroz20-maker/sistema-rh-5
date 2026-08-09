@echo off
cd /d "%~dp0"
start "SISTEMA RH AGOSTO" /min cmd /c "npm run dev"
timeout /t 4 /nobreak >nul
start "" "http://localhost:5173/"
