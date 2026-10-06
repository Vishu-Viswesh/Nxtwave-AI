@echo off
title NxtWave AI Build Sprint - V8
cd /d "%~dp0"
echo.
echo ==========================================
echo   NxtWave AI Build Sprint - V8
echo ==========================================
echo.
py --version
echo.
echo Starting server...
echo Keep this window open while using the website.
echo.
py server.py
pause
