@echo off
title EA Tier 2 — Make webhooks setup
cd /d "%~dp0.."

echo.
echo ============================================
echo   Tier 2: ONBOARDING + ESIGN Make webhooks
echo ============================================
echo.
echo Create two Make scenarios first (see docs\MAKE-TIER2.md):
echo   1. Onboarding — Custom webhook after Stripe payment
echo   2. eSign — Custom webhook for signed docs
echo.
echo eSignatures callback URL (set in eSignatures.io dashboard):
echo   https://ea-payments.vercel.app/api/webhooks/esignatures
echo.

set /p ONBOARDING_WEBHOOK_URL=Paste ONBOARDING_WEBHOOK_URL (hook...make.com): 
if "%ONBOARDING_WEBHOOK_URL%"=="" (
  echo ERROR: Onboarding webhook URL required.
  pause
  exit /b 1
)

set /p ESIGN_WEBHOOK_URL=Paste ESIGN_WEBHOOK_URL (hook...make.com): 
if "%ESIGN_WEBHOOK_URL%"=="" (
  echo ERROR: eSign webhook URL required.
  pause
  exit /b 1
)

echo.
echo Adding Vercel production env vars...
vercel env add ONBOARDING_WEBHOOK_URL production --value "%ONBOARDING_WEBHOOK_URL%" --yes
vercel env add ESIGN_WEBHOOK_URL production --value "%ESIGN_WEBHOOK_URL%" --yes

echo.
echo Redeploying production...
vercel deploy --prod --yes

echo.
echo Running Tier 2 health check...
node "%~dp0test-tier2-launch.mjs"

echo.
echo Optional: test Make webhooks (requires LAUNCH_SETUP_KEY on Vercel):
echo   curl -X POST https://ea-payments.vercel.app/api/health/test-webhooks ^
echo     -H "x-launch-setup-key: YOUR_KEY" -H "Content-Type: application/json" ^
echo     -d "{\"dryRun\":false,\"target\":\"both\"}"
echo.
echo Then run one LIVE checkout: https://ea-payments.vercel.app/checkout
echo.
pause
