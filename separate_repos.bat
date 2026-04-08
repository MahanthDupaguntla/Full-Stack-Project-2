@echo off
set MAIN_REPO_PATH=%CD%
set BACKEND_URL=https://github.com/MahanthDupaguntla/Full-Stack-Project-Backend.git

echo [1/5] Initializing separate backend repository...
cd backend
if not exist .git (
    git init
)
git remote add origin %BACKEND_URL%
git branch -M main

echo [2/5] Pushing backend files to %BACKEND_URL%...
git add .
git commit -m "Initial commit for separated backend"
git push -u origin main

echo [3/5] Cleaning up main repository...
cd %MAIN_REPO_PATH%
rd /s /q backend

echo [4/5] Committing changes to frontend repository...
git add .
git commit -m "Removed backend directory (now in separate repository)"

echo [5/5] Pushing root repository updates...
git push origin main

echo Done! The repositories have been separated.
pause
