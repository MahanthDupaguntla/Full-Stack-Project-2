@echo off
echo ==========================================
echo   ArtForge — Deploy Railway Backend Fix
echo ==========================================
echo.

cd /d "c:\Users\MAHANTH\Downloads\artforge"

echo [1/3] Staging all changes...
git add -A
echo.

echo [2/3] Creating commit...
git commit -m "fix: Railway MySQL config + Vercel frontend-backend connectivity

- application.properties: use MYSQL_URL/MYSQLUSER/MYSQLPASSWORD (Railway env vars)
- application.properties: explicit MySQL driver + dialect, removed PostgreSQL refs
- pom.xml: removed PostgreSQL driver dependency (Railway uses MySQL)
- apiService.ts: resolve VITE_API_URL or VITE_BACKEND_URL for Railway backend
- vite.config.ts: expose both VITE_API_URL and VITE_BACKEND_URL to build
- vercel.json: simplified SPA rewrites (API calls go direct to Railway)
- AuthController: removed conflicting @CrossOrigin (SecurityConfig handles CORS)
- .env.local: set VITE_API_URL to Railway backend URL"

echo.
echo [3/3] Pushing to GitHub main branch...
git push origin main

echo.
echo ==========================================
echo   SUCCESS! Pushed to GitHub.
echo.
echo   IMPORTANT — Set Vercel Environment Variable:
echo   Go to Vercel Dashboard ^> Settings ^> Environment Variables
echo   Add:
echo     VITE_API_URL = https://full-stack-project-backend-production-76b1.up.railway.app
echo     VITE_BACKEND_URL = https://full-stack-project-backend-production-76b1.up.railway.app
echo   Then REDEPLOY from the Vercel Deployments tab.
echo ==========================================
echo.
pause
