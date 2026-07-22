@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 正在用默认浏览器直接打开 index.html ...
echo （无需安装任何环境；若复制功能异常，请改用 start.bat）
echo.
start "" "%~dp0index.html"
