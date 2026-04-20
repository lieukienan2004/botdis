@echo off
title Discord Music Bot 24/7
echo ================================
echo   Discord Music Bot 24/7
echo ================================
echo.
echo Checking Node.js...
node --version
echo.
echo Installing dependencies...
npm install
echo.
echo Starting bot...
echo Press Ctrl+C to stop the bot
echo.
node index.js
pause