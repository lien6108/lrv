@echo off
echo =======================================
echo Starting Lucky Draw System
echo =======================================

echo 1. Starting Backend Server...
cd server
call npm install
start cmd /k "npm start"
cd ..

echo 2. Starting Frontend Development Server...
cd client
call npm install
start cmd /k "npm run dev"
cd ..

echo =======================================
echo Both servers are starting up.
echo - Frontend: http://localhost:5173
echo - Backend: http://localhost:3001
echo =======================================
pause
