@echo off
title Package Simplifi Chrome Extension
cd /d "%~dp0.."

if not exist extension (
  echo ERROR: extension folder not found
  pause
  exit /b 1
)

if not exist dist mkdir dist

set ZIP=dist\simplifi-extension.zip
if exist "%ZIP%" del "%ZIP%"

powershell -NoProfile -Command "Compress-Archive -Path 'extension\*' -DestinationPath '%ZIP%' -Force"

if errorlevel 1 (
  echo FAILED to create zip
  pause
  exit /b 1
)

echo.
echo DONE: %ZIP%
echo.
echo Testers: unzip, then chrome://extensions -^> Developer mode -^> Load unpacked
echo Or load the extension folder directly from the repo.
echo.
pause
