@echo off
chcp 65001 >nul
cd /d "%~dp0"
if not exist "node_modules" call npm install >> "启动日志.txt" 2>&1
if not exist "dist\server\wrangler.json" call npm run build >> "启动日志.txt" 2>&1
call npm run start >> "启动日志.txt" 2>&1
