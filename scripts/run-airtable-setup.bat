@echo off
title EA Airtable Setup
cd /d "%~dp0.."

echo.
echo ============================================
echo   EA Airtable Setup (fields + demo client)
echo ============================================
echo.
echo Paste your Airtable token when prompted, then press Enter.
echo Token starts with pat... (from airtable.com/create/tokens)
echo Base: Airtable Payments
echo.
echo SECURITY: Do not share the token in chat or email.
echo.

set /p AIRTABLE_API_KEY=Paste token here: 

if "%AIRTABLE_API_KEY%"=="" (
  echo.
  echo ERROR: No token entered. Close this window and try again.
  pause
  exit /b 1
)

echo.
echo Checking token length...
echo %AIRTABLE_API_KEY:~0,8%...

echo.
echo [1/3] Adding Client Records fields...
node "%~dp0..\..\..\ea-operating-system\scripts\setup-airtable-onboarding-fields.mjs"
if errorlevel 1 (
  echo.
  echo STEP 1 FAILED. Common fixes:
  echo   - Revoke old token, create new one with Airtable Payments base
  echo   - Enable: data.records read/write + schema.bases read/write
  echo   - Or add fields manually in Airtable (ask in chat for the list)
  pause
  exit /b 1
)

echo.
echo [2/3] Ensuring Capture Records table (Simplifi + Magnifi)...
node "%~dp0setup-capture-records-table.mjs"
if errorlevel 1 (
  echo.
  echo STEP 2 FAILED. Simplifi capture needs Capture Records table.
  echo Try scripts\run-capture-pulse-setup.bat instead (skips step 1).
  pause
  exit /b 1
)

echo.
echo [2b/4] Ensuring Pulse Events table...
node "%~dp0setup-pulse-events-table.mjs"
if errorlevel 1 (
  echo.
  echo Pulse Events setup failed (optional but recommended).
)

echo.
echo [3/4] Creating demo client + Magnifi sample...
node "%~dp0seed-demo-client.mjs"
if errorlevel 1 (
  echo.
  echo STEP 3 FAILED. Steps 1-2 may still have worked.
  pause
  exit /b 1
)

echo.
echo ============================================
echo   DONE
echo ============================================
echo Demo login: https://ea-payments.vercel.app/portal/login
echo Email: demo@efficiencyarchitects.online
echo Password: DemoPulse2026!
echo Simplifi: https://ea-payments.vercel.app/portal/demo-client/simplifi
echo.
echo Magnifi demo URL was printed above by the seed script.
echo.
echo Also add the same token to Vercel as AIRTABLE_API_KEY and redeploy.
echo.
pause
