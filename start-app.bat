@echo off
chcp 65001 >nul
setlocal
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
    echo Node.js が見つかりません。https://nodejs.org からインストールしてください。
    pause
    exit /b 1
)

if not exist node_modules (
    echo [1/2] 初回セットアップ: 依存パッケージをインストールしています...
    call npm install
    if errorlevel 1 (
        echo インストールに失敗しました。
        pause
        exit /b 1
    )
)

echo [2/2] 開発サーバーを起動します...
echo このウィンドウを閉じる、または Ctrl+C で終了します。
start "" cmd /c "timeout /t 3 /nobreak >nul & start "" http://localhost:5173"
call npm run dev

pause
