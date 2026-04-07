@echo off
echo ==========================================
echo   ArtForge - GitHub Push Script
echo ==========================================
echo.

cd /d "c:\Users\MAHANTH\Downloads\artforge"

echo [1/5] Staging all files...
git add .
echo Done.

echo.
echo [2/5] Committing changes...
git commit -m "feat: ArtForge premium redesign + fix API key crash"
echo Done.

echo.
echo [3/5] Setting remote origin...
git remote remove origin 2>nul
git remote add origin https://github.com/MahanthDupaguntla/Full-Stack-Project-2.git
echo Done.

echo.
echo [4/5] Setting branch to main...
git branch -M main
echo Done.

echo.
echo [5/5] Pushing to GitHub...
git push -u origin main --force

echo.
echo ==========================================
echo   Push complete! Check GitHub now.
echo ==========================================
echo.
pause
