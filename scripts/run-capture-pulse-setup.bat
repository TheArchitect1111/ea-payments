@echo off
title EA Capture + Pulse Airtable Setup
cd /d "%~dp0.."

echo.
echo ============================================
echo   Capture Records + Pulse Events setup
echo   (skips Client Records / demo seed)
echo ============================================
echo.
echo You need a Personal Access Token from airtable.com/create/tokens
echo Scopes: data.records read/write + schema.bases read/write
echo Base access: Efficiency Architects - Payments ^& Clients
echo.

set /p AIRTABLE_API_KEY=Paste token (pat...): 
if "%AIRTABLE_API_KEY%"=="" (
  echo ERROR: No token entered.
  pause
  exit /b 1
)

echo.
echo Optional — paste base ID from Airtable URL (appXXXXXXXX), or press Enter for default:
set /p AIRTABLE_PAYMENTS_BASE_ID=Base ID: 

echo.
echo [1/3] Verifying current schema...
node "%~dp0verify-airtable-schema.mjs"
echo.

echo [2/3] Ensuring Capture Records table...
node "%~dp0setup-capture-records-table.mjs"
if errorlevel 1 (
  echo STEP 2 FAILED.
  pause
  exit /b 1
)

echo.
echo [3/3] Ensuring Pulse Events table...
node "%~dp0setup-pulse-events-table.mjs"
if errorlevel 1 (
  echo STEP 3 FAILED.
  pause
  exit /b 1
)

echo.
echo [verify] Re-checking schema...
node "%~dp0verify-airtable-schema.mjs"
if errorlevel 1 (
  echo Some fields still missing — check output above.
  pause
  exit /b 1
)

echo.
echo ============================================
echo   DONE
echo ============================================
echo Add to Vercel (same values as local):
echo   AIRTABLE_API_KEY=pat...
if not "%AIRTABLE_PAYMENTS_BASE_ID%"=="" echo   AIRTABLE_PAYMENTS_BASE_ID=%AIRTABLE_PAYMENTS_BASE_ID%
echo   AIRTABLE_CAPTURES_TABLE=Capture Records
echo   PULSE_EVENTS_TABLE=Pulse Events
echo Then redeploy ea-payments on Vercel.
echo.
pause
