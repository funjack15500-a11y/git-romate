@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 正在用 Google Chrome 直接打开 index.html ...
echo （无需安装任何环境；若复制功能异常，请改用 start.bat）
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\open-chrome.ps1" -Target "%~dp0index.html"
