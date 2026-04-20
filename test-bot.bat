@echo off
echo Stopping old bot process...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul
echo Starting bot...
node index.js
pause