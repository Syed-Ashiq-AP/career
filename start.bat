@echo off
echo ====================================
echo Smart Career Advisor - Starting...
echo ====================================
echo.

echo [1/2] Starting Backend API (Flask)...
start "Career Advisor API" cmd /k "cd api && python server.py"
timeout /t 3 /nobreak > nul

echo [2/2] Starting Frontend (Next.js)...
start "Career Advisor Frontend" cmd /k "npm run dev"

echo.
echo ====================================
echo Servers are starting!
echo ====================================
echo.
echo Backend API: http://localhost:5000
echo Frontend:    http://localhost:3000
echo.
echo Press any key to close this window...
pause > nul
