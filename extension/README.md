# EA Capture Engine — Browser Extension (Wave 2)

Chrome MV3 extension for one-click capture to Mission Control.

## Install (developer mode)

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select this `extension/` folder

## Configure

1. Open extension **Settings**
2. Set **API Base URL**: `https://ea-payments.vercel.app`
3. Set **Capture API Key**: value of `EA_CAPTURE_API_KEY` in Vercel (generate a long random string)

## Usage

- Click extension icon → **Capture This Page**
- Right-click any page → **Capture with Magnifi™**
- Captures run Firecrawl (if configured) → Resource Radar → Opportunity scoring → Airtable

## Context menu actions (future Wave 3)

Save to Resource Radar, Generate Blueprint, Run Simplifi — planned for next wave.
