@echo off
echo ============================================
echo   ArtForge - Full Stack Development Server
echo ============================================
echo.
echo Starting Backend (Spring Boot on port 8080)...
start "ArtForge Backend" /D "%~dp0backend" "%~dp0backend\apache-maven-3.9.6\bin\mvn.cmd" spring-boot:run
echo.
echo Starting Frontend (Vite on port 3000)...
echo.
echo  Frontend: http://localhost:3000
echo  Backend:  http://localhost:8080
echo  API Proxy: /api/* -> http://localhost:8080
echo.
echo ============================================
cd /D "%~dp0"
npx vite --port 3000 --host
