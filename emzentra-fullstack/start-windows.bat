@echo off
cd /d "%~dp0backend"
if not exist node_modules (
  echo Installing backend dependencies...
  npm install
)
npm start
pause
