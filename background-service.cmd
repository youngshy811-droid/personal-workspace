@echo off
cd /d "%~dp0"
if not exist "node_modules" call npm install >> "startup.log" 2>&1
if not exist "dist\server\wrangler.json" call npm run build >> "startup.log" 2>&1
call npm run start >> "startup.log" 2>&1
