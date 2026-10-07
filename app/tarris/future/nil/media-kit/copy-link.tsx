"use client";

import { useState } from "react";
import { PORTAL_BASE } from "../../tenant-config";

export default function CopyMediaKitLink() {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try { await navigator.clipboard.writeText(`${window.location.origin}${PORTAL_BASE}/nil/media-kit`); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
    catch { setCopied(false); }
  }
  return <button type="button" onClick={copy} className="rounded-lg bg-[#C41E3A] px-4 py-3 text-xs font-black text-white">{copied ? "Link Copied ✓" : "Copy Media Kit Link"}</button>;
}
