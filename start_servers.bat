@echo off
chcp 65001 >nul
title Street Music Servers

:: Auto-detect the project directory (where this bat file lives)
cd /d "%~dp0"

:: Verify we're in the right place
if not exist "server.js" (
    echo [ERROR] server.js not found! Are you in the right directory?
    echo Current directory: %CD%
    pause
    exit /b 1
)

if not exist "backend\dist\main.js" (
    echo [ERROR] backend\dist\main.js not found!
    echo Please build the backend first: cd backend ^&^& npm run build
    pause
    exit /b 1
)

if not exist "frontend\dist\index.html" (
    echo [ERROR] frontend\dist\index.html not found!
    echo Please build the frontend first: cd frontend ^&^& npm run build
    pause
    exit /b 1
)

echo ========================================
echo   Street Music - Starting Servers
echo ========================================
echo.
echo Starting backend + frontend...
echo Logs are written to .\logs\
echo.

:: Run the launcher (stays alive, shows logs)
node start.js

echo.
echo Servers stopped.
pause
