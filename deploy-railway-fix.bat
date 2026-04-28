@echo off
echo ==========================================
echo   ArtForge — Deploy All Fixes
echo ==========================================
echo.

cd /d "c:\Users\MAHANTH\Downloads\artforge"

echo [1/3] Staging all changes...
git add -A
echo.

echo [2/3] Creating commit...
git commit -m "fix: Railway MySQL config, laptop scroll fix, Vercel connectivity

Backend:
- application.properties: build JDBC URL from MYSQLHOST/MYSQLPORT/MYSQLDATABASE
- application.properties: added HikariCP pool config for Railway idle disconnects
- pom.xml: removed PostgreSQL driver (Railway uses MySQL)
- AuthController: removed conflicting @CrossOrigin

Frontend:
- index.html: removed 180 lines of duplicate inline CSS
- index.css: fixed html/body overflow that blocked mouse scroll on laptops
- apiService.ts: resolve VITE_API_URL or VITE_BACKEND_URL for Railway
- vite.config.ts: expose both env vars to Vercel build
- vercel.json: simplified SPA rewrites"

echo.
echo [3/3] Pushing to GitHub main branch...
git push origin main

echo.
echo ==========================================
echo   SUCCESS! Pushed to GitHub.
echo.
echo   NEXT STEPS:
echo   1. Check Railway dashboard for successful build
echo   2. In Vercel Dashboard, add Environment Variables:
echo      VITE_API_URL = https://full-stack-project-backend-production-76b1.up.railway.app
echo      VITE_BACKEND_URL = https://full-stack-project-backend-production-76b1.up.railway.app
echo   3. Redeploy on Vercel (build cache OFF)
echo ==========================================
echo.
pause
