# EA Capture Engine — Browser Extension (Wave 3)

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

**Popup**
- **Capture This Page** — scrape, classify, score, recommend, blueprint stub
- **Generate Auto Blueprint** — full Wave 3 pipeline with Magnifi template selection
- **Run Simplifi Assessment** — opens Operational MRI funnel
- **Open Resource Radar** — Mission Control intelligence view

**Context menu (right-click)**
- **Capture with Magnifi™** — quick capture + analysis
- **Generate Auto Blueprint** — BAS / Selena / JCSU pattern + blueprint stub
- **Run Simplifi Website Audit** — opens Simplifi audit with URL pre-filled
- **Run Simplifi Assessment** — opens assessment funnel

Captures run Firecrawl (if configured) → Resource Radar → Opportunity Engine → Recommendation Engine → Auto Blueprint → Airtable.

## Wave 3 outputs

Every capture includes:
- **Trust Layer** — confidence score, sources, reasoning
- **Recommendation Engine** — Magnifi template + top 3 priorities + first step
- **Auto Blueprint stub** — view in `/admin/blueprints`
