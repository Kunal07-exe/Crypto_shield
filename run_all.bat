@echo off
title CryptoShield - Real-Time Cybercrime Intelligence Platform
color 0B

echo ===============================================================================
echo  CRYPTOSHIELD - REAL-TIME CYBERCRIME INTELLIGENCE PLATFORM
echo  Financial Crime Detection, Fraud Investigation and Blockchain Analysis
echo ===============================================================================
echo.

cd /d "%~dp0"

echo [1/3] Checking dependencies...
echo.

python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH. Please install Python 3.10+
    pause
    exit /b 1
)
echo   Python: OK

node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH. Please install Node.js 18+
    pause
    exit /b 1
)
echo   Node.js: OK

echo.
echo [2/3] Launching Backend Server...
start "CryptoShield Backend Port 8000" cmd /k "cd /d "%~dp0backend" && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo.
echo [3/3] Launching Frontend Server...
start "CryptoShield Frontend Port 5173" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ===============================================================================
echo  CryptoShield is launching in two terminal windows.
echo.
echo  Frontend UI:    http://localhost:5173
echo  Backend Docs:   http://127.0.0.1:8000/docs
echo.
echo  Investigator Login Credentials:
echo    Organization:  CYBER-INTEL-HQ
echo    Email:         investigator@agency.gov
echo    Password:      Shield@2026
echo    OTP Code:      123456
echo ===============================================================================
echo.
echo Opening browser in 5 seconds...
timeout /t 5 /nobreak >nul
start http://localhost:5173

exit /b 0
