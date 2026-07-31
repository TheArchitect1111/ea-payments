"""Pydantic models mirroring ResearchCrawlResult v1."""
from __future__ import annotations

from typing import Any, Literal, Optional
from pydantic import BaseModel, Field, HttpUrl


class ResearchCrawlRequest(BaseModel):
    subjectName: str = Field(min_length=1, max_length=200)
    distinguishingDetail: Optional[str] = None
    knownUrls: list[str] = Field(default_factory=list)
    candidateUrls: list[str] = Field(default_factory=list)
    maxPages: int = Field(default=12, ge=1, le=25)
    crawlDepth: int = Field(default=2, ge=0, le=4)
    assetTypes: list[str] = Field(
        default_factory=lambda: [
            "logo",
            "favicon",
            "og_image",
            "photo",
            "product",
            "document",
            "color",
            "font",
            "brand_language",
        ]
    )
    allowDomains: Optional[list[str]] = None
    blockDomains: Optional[list[str]] = None
    jobId: Optional[str] = None


class ResearchEvidence(BaseModel):
    claim: str
    category: str = "other"
    sourceUrl: str
    pageTitle: Optional[str] = None
    excerpt: Optional[str] = None
    publishedAt: Optional[str] = None
    retrievedAt: str
    confidence: float = 0.5
    independentlyCorroborated: bool = False


class ResearchIdentity(BaseModel):
    canonicalName: str
    entityType: Literal["person", "organization", "product", "unknown"] = "unknown"
    role: Optional[str] = None
    organization: Optional[str] = None
    geography: list[str] = Field(default_factory=list)
    officialDomains: list[str] = Field(default_factory=list)
    socialProfiles: list[dict[str, str]] = Field(default_factory=list)


class ResearchOrganization(BaseModel):
    mission: Optional[str] = None
    services: list[str] = Field(default_factory=list)
    audiences: list[str] = Field(default_factory=list)
    history: list[str] = Field(default_factory=list)
    locations: list[str] = Field(default_factory=list)
    leadership: list[str] = Field(default_factory=list)
    contactPaths: list[str] = Field(default_factory=list)
    callsToAction: list[str] = Field(default_factory=list)


class BrandAsset(BaseModel):
    kind: str
    value: str
    sourceUrl: str
    confidence: float = 0.5
    consistentAcrossSources: bool = False
    notes: Optional[str] = None


class MediaAssetCrawl(BaseModel):
    originalUrl: str
    pageUrl: str
    altText: Optional[str] = None
    caption: Optional[str] = None
    nearbyText: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    mimeType: Optional[str] = None
    likelySubject: Optional[str] = None
    faceCount: Optional[int] = None
    relevanceCategory: str = "other"
    licenseEvidence: Optional[str] = None
    attribution: Optional[str] = None
    usageStatus: str = "preview_only"
    perceptualHash: Optional[str] = None
    durableUrl: Optional[str] = None
    rejected: bool = False
    rejectionReason: Optional[str] = None


class DocumentAsset(BaseModel):
    url: str
    title: Optional[str] = None
    description: Optional[str] = None
    mimeType: Optional[str] = None
    extractedTextStatus: str = "pending"
    excerpt: Optional[str] = None


class ResearchDiagnostics(BaseModel):
    pagesFetched: int = 0
    pagesFailed: int = 0
    retries: int = 0
    durationMs: float = 0
    errors: list[dict[str, Any]] = Field(default_factory=list)
    provider: str = "crawl4ai"
    workerVersion: Optional[str] = "0.2.0"


class ResearchCrawlJobMeta(BaseModel):
    jobId: str
    status: Literal["queued", "running", "succeeded", "failed", "partial"]
    startedAt: str
    finishedAt: Optional[str] = None
    attempt: int = 1
    stages: list[dict[str, Any]] = Field(default_factory=list)


class ResearchCrawlResult(BaseModel):
    schemaVersion: Literal[1] = 1
    identity: ResearchIdentity
    evidence: list[ResearchEvidence] = Field(default_factory=list)
    organization: ResearchOrganization = Field(default_factory=ResearchOrganization)
    brandAssets: list[BrandAsset] = Field(default_factory=list)
    mediaAssets: list[MediaAssetCrawl] = Field(default_factory=list)
    documents: list[DocumentAsset] = Field(default_factory=list)
    diagnostics: ResearchDiagnostics = Field(default_factory=ResearchDiagnostics)
    job: ResearchCrawlJobMeta


class ResearchJobStage(BaseModel):
    name: str
    status: Literal["pending", "running", "succeeded", "failed"]
    startedAt: Optional[str] = None
    finishedAt: Optional[str] = None
    durationMs: Optional[float] = None
    detail: Optional[str] = None


class ResearchJobAccepted(BaseModel):
    jobId: str
    status: Literal["queued"] = "queued"
    statusUrl: str


class ResearchJobSnapshot(BaseModel):
    jobId: str
    status: Literal["queued", "running", "succeeded", "failed", "partial"]
    createdAt: str
    updatedAt: str
    stages: list[ResearchJobStage] = Field(default_factory=list)
    result: Optional[ResearchCrawlResult] = None
    error: Optional[str] = None
