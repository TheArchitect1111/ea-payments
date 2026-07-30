"""HTML / markdown brand + media extraction helpers."""
from __future__ import annotations

import hashlib
import json
import re
from typing import Any
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup

from .models import BrandAsset, DocumentAsset, MediaAssetCrawl, ResearchEvidence, ResearchOrganization

TRACKING_RE = re.compile(
    r"pixel|tracking|beacon|1x1|spacer|analytics|doubleclick|facebook\.com/tr",
    re.I,
)
COLOR_RE = re.compile(r"#(?:[0-9a-fA-F]{6})\b")
CSS_VAR_RE = re.compile(r"--([a-zA-Z0-9_-]+)\s*:\s*([^;]+)")
FONT_FACE_RE = re.compile(r"@font-face[^}]*font-family\s*:\s*['\"]?([^;'\"]+)", re.I)
FONT_FAMILY_RE = re.compile(r"font-family\s*:\s*([^;}+]+)", re.I)


def _abs(base: str, href: str | None) -> str | None:
    if not href or href.startswith("data:"):
        return None
    try:
        return urljoin(base, href.strip())
    except Exception:
        return None


def perceptual_hash_placeholder(url: str) -> str:
    return hashlib.sha256(url.split("?")[0].lower().encode()).hexdigest()[:16]


def extract_from_html(
    *,
    html: str,
    page_url: str,
    retrieved_at: str,
    subject_name: str,
) -> dict[str, Any]:
    soup = BeautifulSoup(html or "", "html.parser")
    brand: list[BrandAsset] = []
    media: list[MediaAssetCrawl] = []
    documents: list[DocumentAsset] = []
    evidence: list[ResearchEvidence] = []
    org = ResearchOrganization()

    title = (soup.title.string or "").strip() if soup.title else ""

    # Open Graph / Twitter
    def meta(prop: str) -> str | None:
        tag = soup.find("meta", attrs={"property": prop}) or soup.find(
            "meta", attrs={"name": prop}
        )
        if tag and tag.get("content"):
            return str(tag["content"]).strip()
        return None

    og_image = meta("og:image") or meta("twitter:image")
    if og_image:
        abs_u = _abs(page_url, og_image)
        if abs_u:
            brand.append(
                BrandAsset(kind="og_image", value=abs_u, sourceUrl=page_url, confidence=0.75)
            )
            media.append(
                MediaAssetCrawl(
                    originalUrl=abs_u,
                    pageUrl=page_url,
                    relevanceCategory="other",
                    usageStatus="preview_only",
                    perceptualHash=perceptual_hash_placeholder(abs_u),
                )
            )

    og_site = meta("og:site_name")
    if og_site:
        brand.append(
            BrandAsset(
                kind="brand_language",
                value=og_site,
                sourceUrl=page_url,
                confidence=0.6,
            )
        )

    # Favicons / app icons
    for link in soup.find_all("link", href=True):
        rel = " ".join(link.get("rel") or []).lower()
        href = _abs(page_url, link.get("href"))
        if not href:
            continue
        if "icon" in rel:
            kind = "app_icon" if "apple" in rel else "favicon"
            brand.append(
                BrandAsset(kind=kind, value=href, sourceUrl=page_url, confidence=0.7)
            )
            media.append(
                MediaAssetCrawl(
                    originalUrl=href,
                    pageUrl=page_url,
                    relevanceCategory="logo",
                    usageStatus="preview_only",
                    mimeType=link.get("type"),
                    perceptualHash=perceptual_hash_placeholder(href),
                )
            )
        if "manifest" in rel:
            brand.append(
                BrandAsset(
                    kind="brand_language",
                    value=f"manifest:{href}",
                    sourceUrl=page_url,
                    confidence=0.5,
                    notes="site manifest",
                )
            )

    # JSON-LD
    for script in soup.find_all("script", attrs={"type": "application/ld+json"}):
        raw = script.string or script.get_text() or ""
        try:
            data = json.loads(raw)
        except Exception:
            continue
        nodes = data if isinstance(data, list) else [data]
        for node in nodes:
            if not isinstance(node, dict):
                continue
            ntype = node.get("@type") or ""
            name = node.get("name")
            if name and subject_name.lower().split()[0] in str(name).lower():
                evidence.append(
                    ResearchEvidence(
                        claim=str(name),
                        category="identity",
                        sourceUrl=page_url,
                        pageTitle=title,
                        excerpt=str(name)[:300],
                        retrievedAt=retrieved_at,
                        confidence=0.85,
                    )
                )
            if node.get("description"):
                desc = str(node["description"]).strip()
                if len(desc) > 40:
                    evidence.append(
                        ResearchEvidence(
                            claim=desc[:240],
                            category="mission" if "Organization" in str(ntype) else "other",
                            sourceUrl=page_url,
                            pageTitle=title,
                            excerpt=desc[:400],
                            retrievedAt=retrieved_at,
                            confidence=0.7,
                        )
                    )
                    if not org.mission:
                        org.mission = desc[:500]
            logo = node.get("logo")
            if isinstance(logo, dict):
                logo = logo.get("url")
            if isinstance(logo, str):
                abs_logo = _abs(page_url, logo)
                if abs_logo:
                    brand.append(
                        BrandAsset(
                            kind="logo",
                            value=abs_logo,
                            sourceUrl=page_url,
                            confidence=0.85,
                        )
                    )

    # Images
    for img in soup.find_all("img", src=True)[:40]:
        src = _abs(page_url, img.get("src"))
        if not src or TRACKING_RE.search(src):
            continue
        alt = (img.get("alt") or "").strip()
        w = img.get("width")
        h = img.get("height")
        try:
            width = int(re.sub(r"\D", "", str(w))) if w else None
            height = int(re.sub(r"\D", "", str(h))) if h else None
        except Exception:
            width = height = None
        rejected = False
        reason = None
        if width and height and (width < 64 or height < 64):
            rejected = True
            reason = "too_small"
        cat = "other"
        blob = f"{alt} {src}".lower()
        if "logo" in blob:
            cat = "logo"
            brand.append(
                BrandAsset(kind="logo", value=src, sourceUrl=page_url, confidence=0.65)
            )
        elif any(k in blob for k in ("product", "shop", "botanic", "plant")):
            cat = "product"
        elif any(k in blob for k in ("team", "community", "group", "event")):
            cat = "community"
        media.append(
            MediaAssetCrawl(
                originalUrl=src,
                pageUrl=page_url,
                altText=alt or None,
                width=width,
                height=height,
                relevanceCategory=cat,
                usageStatus="rejected" if rejected else "preview_only",
                rejected=rejected,
                rejectionReason=reason,
                perceptualHash=perceptual_hash_placeholder(src),
                licenseEvidence="official-site-discovered; not publication-licensed by default",
            )
        )

    # SVG logos
    for svg_a in soup.select("a[href*='logo'], img[src*='logo'], svg"):
        pass  # img path already covered; keep hook for future inline SVG hashing

    # CSS colors / fonts from style tags
    style_text = " ".join(t.get_text() for t in soup.find_all("style"))
    for color in set(COLOR_RE.findall(style_text)) | set(
        COLOR_RE.findall(html[:50_000])
    ):
        brand.append(
            BrandAsset(
                kind="color",
                value=color.lower() if color.startswith("#") else f"#{color.lower()}",
                sourceUrl=page_url,
                confidence=0.4,
            )
        )
    for m in CSS_VAR_RE.finditer(style_text):
        brand.append(
            BrandAsset(
                kind="css_variable",
                value=f"--{m.group(1)}:{m.group(2).strip()}",
                sourceUrl=page_url,
                confidence=0.45,
            )
        )
    for m in FONT_FACE_RE.finditer(style_text):
        brand.append(
            BrandAsset(
                kind="font_family",
                value=m.group(1).strip(),
                sourceUrl=page_url,
                confidence=0.55,
            )
        )

    # Nav / footer brand language
    for sel in ("nav", "footer", "header"):
        el = soup.find(sel)
        if not el:
            continue
        text = " ".join(el.stripped_strings)[:240]
        if text:
            brand.append(
                BrandAsset(
                    kind="brand_language",
                    value=text,
                    sourceUrl=page_url,
                    confidence=0.35,
                    notes=sel,
                )
            )

    # Documents
    for a in soup.find_all("a", href=True):
        href = _abs(page_url, a.get("href"))
        if not href:
            continue
        if re.search(r"\.(pdf|docx?|pptx?)($|\?)", href, re.I):
            documents.append(
                DocumentAsset(
                    url=href,
                    title=(a.get_text() or "").strip()[:200] or None,
                    mimeType="application/pdf" if href.lower().endswith(".pdf") else None,
                    extractedTextStatus="pending",
                )
            )

    # Contact paths
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if href.startswith("mailto:") or href.startswith("tel:"):
            org.contactPaths.append(href)

    # Simple service / CTA heuristics
    body_text = " ".join(soup.stripped_strings)[:4000]
    for m in re.finditer(
        r"(?:our|we offer|programs?|services?)[:\s]+(.{20,120})",
        body_text,
        re.I,
    ):
        org.services.append(m.group(0).strip()[:160])
        if len(org.services) >= 8:
            break
    for m in re.finditer(
        r"\b(donate|join|get started|contact us|book|shop now|learn more)\b",
        body_text,
        re.I,
    ):
        org.callsToAction.append(m.group(0))
    org.services = list(dict.fromkeys(org.services))[:8]
    org.callsToAction = list(dict.fromkeys(org.callsToAction))[:8]
    org.contactPaths = list(dict.fromkeys(org.contactPaths))[:8]

    if title and len(body_text) > 80:
        evidence.append(
            ResearchEvidence(
                claim=body_text[:220],
                category="other",
                sourceUrl=page_url,
                pageTitle=title,
                excerpt=body_text[:400],
                retrievedAt=retrieved_at,
                confidence=0.55,
            )
        )

    return {
        "title": title,
        "brand": brand,
        "media": media,
        "documents": documents,
        "evidence": evidence,
        "organization": org,
    }
