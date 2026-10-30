@echo off
echo ===============================================================================
echo   Unpacking Tourist Experiences: A Zero-Shot ABSA Framework for Hospitality
echo   B.Tech Major Project - One-Click Application Launcher
echo ===============================================================================
echo.

echo [1/3] Starting Python FastAPI NLP Service (Port 8000)...
start "TourABSA - Python NLP Service (Port 8000)" cmd /k "cd /d %~dp0nlp_service && python -m uvicorn app:app --host 127.0.0.1 --port 8000"

timeout /t 3 /nobreak >nul

echo [2/3] Starting Node.js Express Backend Server (Port 5000)...
start "TourABSA - Backend Server (Port 5000)" cmd /k "cd /d %~dp0server && npm start"

timeout /t 3 /nobreak >nul

echo [3/3] Starting React Vite Frontend Application (Port 5173)...
start "TourABSA - Frontend Client (Port 5173)" cmd /k "cd /d %~dp0client && npm run dev"

echo.
echo ===============================================================================
echo   All 3 services are launching in separate windows!
echo   Frontend Dashboard:  http://localhost:5173
echo   Backend REST API:    http://localhost:5000
echo   Python NLP Service:  http://127.0.0.1:8000
echo   Health Check API:    http://localhost:5000/api/health
echo ===============================================================================
echo.
pause
