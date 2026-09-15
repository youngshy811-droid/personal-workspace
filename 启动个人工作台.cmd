@echo off
chcp 65001 >nul
cd /d "%~dp0"

if not exist "node_modules" (
  echo 正在安装首次运行所需组件，请稍候...
  call npm install
)

if not exist "dist\server\wrangler.json" (
  echo 正在准备个人工作台，请稍候...
  call npm run build
)

start /min "个人工作台服务" cmd /c "cd /d ""%~dp0"" && npm run start"
timeout /t 4 /nobreak >nul
start "" "http://localhost:3000"
exit
