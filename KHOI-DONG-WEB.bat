@echo off
chcp 65001 >nul
title Khởi động Living Blueprint — Architecture Portfolio
echo ========================================================
echo   LIVING BLUEPRINT — PORTFOLIO KIẾN TRÚC & NỘI THẤT
echo   Khởi động máy chủ cục bộ & Mở trình duyệt web
echo ========================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [LƯU Ý]: Máy tính của bạn chưa cài đặt Node.js.
    echo Bạn có thể tải và cài đặt Node.js miễn phí tại: https://nodejs.org
    echo.
    echo Đang tự động mở trang web trực tiếp trong trình duyệt...
    start "" "index.html"
    pause
    exit /b
)

echo [1/2] Đang khởi chạy máy chủ Node.js tại http://localhost:3000 ...
start "" http://localhost:3000
node server.js
pause
