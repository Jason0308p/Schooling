@echo off
cd /d "%~dp0"
echo.
echo   SQL Course - starting...
echo   URL: http://localhost:8090/
echo   Browser opens in 2 seconds. If not, type the URL above by hand.
echo   Keep this window OPEN. Close it to stop the website.
echo.
start "" /b cmd /c "timeout /t 2 /nobreak >nul & start "" http://localhost:8090/"
python tools\serve.py 8090
if errorlevel 1 (
  echo.
  echo   python not found, trying py launcher...
  py tools\serve.py 8090
)
pause
