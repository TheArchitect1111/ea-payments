#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import tempfile
from collections import Counter
from pathlib import Path
from urllib.parse import urljoin
from urllib.request import Request, urlopen

from scrapling import Selector


def fetch_html(url: str, timeout: int = 30) -> tuple[int, bytes]:
    request = Request(
        url,
        headers={
            "User-Agent": "EA-Production-Inspector/1.0 (+https://efficiencyarchitects.online/)"
        },
    )
    with urlopen(request, timeout=timeout) as response:
        return int(response.status), response.read()


def normalized_image_sources(page: Selector, base_url: str) -> list[str]:
    sources: list[str] = []
    for img in page.css("img"):
        src = str(img.attrib.get("src", "")).strip()
        if not src or src.startswith("data:"):
            continue
        sources.append(urljoin(base_url, src))
    return sources


def inspect_target(target: dict, state_dir: Path) -> dict:
    name = target["name"]
    url = target["url"]
    result = {"name": name, "url": url, "status": "PASS", "checks": [], "failures": []}

    try:
        status_code, body = fetch_html(url)
    except Exception as exc:
        result["status"] = "FAIL"
        result["failures"].append(f"fetch failed: {exc}")
        return result

    result["checks"].append({"http_status": status_code, "bytes": len(body)})
    if status_code != 200:
        result["failures"].append(f"expected HTTP 200, got {status_code}")
    if len(body) < int(target.get("min_bytes", 1)):
        result["failures"].append(
            f"response too small: {len(body)} < {target.get('min_bytes', 1)} bytes"
        )

    state_dir.mkdir(parents=True, exist_ok=True)
    safe_name = re.sub(r"[^a-zA-Z0-9_.-]+", "-", name.lower()).strip("-")
    state_file = state_dir / f"{safe_name}.sqlite"
    page = Selector(
        body,
        adaptive=True,
        url=url,
        storage_args={"storage_file": str(state_file), "url": url},
    )

    selector_results = []
    for check in target.get("selectors", []):
        css = check["css"]
        identifier = check["id"]
        direct = page.css(css)
        mode = "direct"
        found = bool(direct)
        if found:
            page.css(css, auto_save=True, identifier=identifier)
        else:
            adaptive = page.css(css, adaptive=True, identifier=identifier)
            found = bool(adaptive)
            mode = "adaptive" if found else "missing"
        selector_results.append({"id": identifier, "css": css, "found": found, "mode": mode})
        if not found:
            result["failures"].append(f"required selector missing: {identifier} ({css})")
    result["checks"].append({"selectors": selector_results})

    all_text = str(page.get_all_text(separator=" ", strip=True))
    missing_text = []
    for required in target.get("required_text", []):
        if required.lower() not in all_text.lower():
            missing_text.append(required)
    if missing_text:
        result["failures"].append(f"required text missing: {missing_text}")
    result["checks"].append({"missing_required_text": missing_text})

    sources = normalized_image_sources(page, url)
    min_images = int(target.get("min_images", 0))
    if len(sources) < min_images:
        result["failures"].append(f"image count too low: {len(sources)} < {min_images}")

    max_repeat = int(target.get("max_duplicate_src_count", 0))
    counts = Counter(sources)
    duplicate_groups = {src: count for src, count in counts.items() if count > 1}
    excessive = {src: count for src, count in counts.items() if max_repeat and count > max_repeat}
    if excessive:
        result["failures"].append(f"excessive repeated image sources: {excessive}")
    result["checks"].append(
        {
            "image_count": len(sources),
            "duplicate_image_sources": duplicate_groups,
            "excessive_duplicate_image_sources": excessive,
        }
    )

    if result["failures"]:
        result["status"] = "FAIL"
    return result


def run_manifest(manifest_path: Path, state_dir: Path, output_path: Path) -> int:
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    results = [inspect_target(target, state_dir) for target in manifest.get("targets", [])]
    report = {
        "inspector": "EA Scrapling Production Inspector",
        "scrapling_target_version": "0.4.15",
        "manifest_version": manifest.get("version"),
        "status": "PASS" if all(item["status"] == "PASS" for item in results) else "FAIL",
        "targets": results,
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 0 if report["status"] == "PASS" else 1


def self_test() -> int:
    original = b"<html><body><main><h1 id='hero-title' class='hero'>Focus on your craft</h1></main></body></html>"
    changed = b"<html><body><section><div class='new-shell'><h1 data-role='headline' class='hero-new'>Focus on your craft</h1></div></section></body></html>"
    with tempfile.TemporaryDirectory() as tmp:
        storage_file = str(Path(tmp) / "adaptive.sqlite")
        first = Selector(
            original,
            adaptive=True,
            url="https://example.com/",
            storage_args={"storage_file": storage_file, "url": "https://example.com/"},
        )
        saved = first.css("#hero-title", auto_save=True, identifier="hero-heading")
        if not saved:
            print("self-test failed: could not seed adaptive selector", file=sys.stderr)
            return 1

        second = Selector(
            changed,
            adaptive=True,
            url="https://example.com/",
            storage_args={"storage_file": storage_file, "url": "https://example.com/"},
        )
        direct = second.css("#hero-title")
        relocated = second.css("#hero-title", adaptive=True, identifier="hero-heading")
        if direct or not relocated:
            print("self-test failed: adaptive relocation did not behave as expected", file=sys.stderr)
            return 1
        if "Focus on your craft" not in str(relocated[0].get_all_text(strip=True)):
            print("self-test failed: relocated the wrong element", file=sys.stderr)
            return 1
    print("EA Scrapling adaptive self-test passed.")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", default="config/ea-scrapling-manifest.json")
    parser.add_argument("--state-dir", default=os.getenv("EA_SCRAPLING_STATE_DIR", ".ea/scrapling-state"))
    parser.add_argument("--output", default=os.getenv("EA_SCRAPLING_OUTPUT", "artifacts/scrapling/report.json"))
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        return self_test()
    return run_manifest(Path(args.manifest), Path(args.state_dir), Path(args.output))


if __name__ == "__main__":
    raise SystemExit(main())
