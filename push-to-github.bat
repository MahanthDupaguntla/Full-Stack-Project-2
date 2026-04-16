@echo off
echo ==========================================
echo   ArtForge — Push to GitHub + Deploy
echo ==========================================
echo.

cd /d "c:\Users\MAHANTH\Downloads\artforge"

echo [1/4] Staging all changes...
git add -A
echo.

echo [2/4] Creating commit...
git commit -m "deploy: production-ready backend with env vars, Dockerfile, and deployment config

- application.properties: all secrets use env vars with local fallbacks
- Dockerfile: multi-stage build for Render.com deployment
- apiService.ts: VITE_API_URL for production backend URL
- vercel.json: SPA routing + VITE_API_URL env placeholder
- .gitignore: exclude backend/target and large artifacts"

echo.
echo [3/4] Pushing to GitHub main branch...
git push origin main

echo.
echo ==========================================
echo   SUCCESS! Pushed to GitHub.
echo.
echo   NEXT STEPS:
echo   1. Deploy backend on Render.com (see guide)
echo   2. Set VITE_API_URL on Vercel dashboard
echo   3. Redeploy on Vercel
echo ==========================================
echo.
pause
