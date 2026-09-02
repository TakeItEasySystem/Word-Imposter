@echo off
title Word Imposter Game
echo ===================================================
echo     Starting Word Imposter Multiplayer Game
echo ===================================================
echo.
cd /d "%~dp0"
echo Starting Backend & Frontend...
echo Game will be available at http://localhost:5173
echo.
npm start
pause
