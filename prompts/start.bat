@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

echo.
echo  ========================================
echo   Spark Prompts - 本地预览
echo  ========================================
echo.

REM 优先 Python，其次 Node，最后纯 PowerShell 服务器
REM 先探测 python -m http.server 是否真能跑（避开 Microsoft Store 空壳）
python -c "import http.server" >nul 2>&1
if %ERRORLEVEL%==0 (
  echo  [模式] Python http.server
  echo  地址:  http://127.0.0.1:8080/
  echo  按 Ctrl+C 停止
  echo.
  start "" "http://127.0.0.1:8080/"
  python -m http.server 8080 --bind 127.0.0.1
  goto :eof
)

py -3 -c "import http.server" >nul 2>&1
if %ERRORLEVEL%==0 (
  echo  [模式] Python (py launcher)
  echo  地址:  http://127.0.0.1:8080/
  echo  按 Ctrl+C 停止
  echo.
  start "" "http://127.0.0.1:8080/"
  py -3 -m http.server 8080 --bind 127.0.0.1
  goto :eof
)

where node >nul 2>&1
if %ERRORLEVEL%==0 (
  echo  [模式] Node npx serve
  echo.
  start "" "http://127.0.0.1:3000/"
  npx --yes serve -l 3000 .
  goto :eof
)

echo  [模式] PowerShell 内置服务器（无需 Python/Node）
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\local-server.ps1" -Port 8080
endlocal
