const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const YOUTUBE_RESUMABLE_UPLOAD_URL =
  'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status';
const YOUTUBE_THUMBNAIL_URL = 'https://www.googleapis.com/upload/youtube/v3/thumbnails/set';

export type YouTubePrivacyStatus = 'private' | 'unlisted' | 'public';

export type YouTubeUploadMetadata = {
  title: string;
  description?: string;
  tags?: string[];
  categoryId?: string;
  privacyStatus?: YouTubePrivacyStatus;
  publishAt?: string;
};

type GoogleTokenResponse = {
  access_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
};

type YouTubeVideoResource = {
  id?: string;
  snippet?: Record<string, unknown>;
  status?: Record<string, unknown>;
};

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

export function youtubePublisherConfigured(): boolean {
  return Boolean(
    process.env.YOUTUBE_CLIENT_ID?.trim() &&
      process.env.YOUTUBE_CLIENT_SECRET?.trim() &&
      process.env.YOUTUBE_REFRESH_TOKEN?.trim(),
  );
}

export async function getYouTubeAccessToken(): Promise<string> {
  const clientId = requiredEnvironment('YOUTUBE_CLIENT_ID');
  const clientSecret = requiredEnvironment('YOUTUBE_CLIENT_SECRET');
  const refreshToken = requiredEnvironment('YOUTUBE_REFRESH_TOKEN');

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
    cache: 'no-store',
  });

  const data = (await response.json()) as GoogleTokenResponse;
  if (!response.ok || !data.access_token) {
    const pieces = [data.error, data.error_description].filter(Boolean);
    const detail = pieces.length ? pieces.join(': ') : `HTTP ${response.status}`;
    throw new Error(`YouTube access-token refresh failed: ${detail}`);
  }

  return data.access_token;
}

function normalizeMetadata(metadata: YouTubeUploadMetadata) {
  const title = metadata.title.trim();
  if (!title) throw new Error('YouTube upload title is required.');

  const privacyStatus = metadata.privacyStatus ?? 'private';
  const publishAt = metadata.publishAt?.trim();

  if (publishAt && privacyStatus !== 'private') {
    throw new Error('YouTube scheduled publishing requires privacyStatus="private".');
  }

  return {
    snippet: {
      title,
      description: metadata.description?.trim() ?? '',
      ...(metadata.tags?.length ? { tags: metadata.tags.map((tag) => tag.trim()).filter(Boolean) } : {}),
      ...(metadata.categoryId?.trim() ? { categoryId: metadata.categoryId.trim() } : {}),
    },
    status: {
      privacyStatus,
      ...(publishAt ? { publishAt } : {}),
      selfDeclaredMadeForKids: false,
    },
  };
}

export async function startYouTubeResumableUpload(input: {
  metadata: YouTubeUploadMetadata;
  contentLength: number;
  mimeType: string;
}): Promise<{ uploadUrl: string; accessToken: string }> {
  if (!Number.isFinite(input.contentLength) || input.contentLength <= 0) {
    throw new Error('YouTube upload contentLength must be greater than zero.');
  }
  if (!input.mimeType.startsWith('video/')) {
    throw new Error('YouTube upload mimeType must be a video MIME type.');
  }

  const accessToken = await getYouTubeAccessToken();
  const response = await fetch(YOUTUBE_RESUMABLE_UPLOAD_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Length': String(input.contentLength),
      'X-Upload-Content-Type': input.mimeType,
    },
    body: JSON.stringify(normalizeMetadata(input.metadata)),
    cache: 'no-store',
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`YouTube resumable upload initialization failed (${response.status}): ${detail}`);
  }

  const uploadUrl = response.headers.get('location');
  if (!uploadUrl) throw new Error('YouTube did not return a resumable upload URL.');

  return { uploadUrl, accessToken };
}

export async function completeYouTubeResumableUpload(input: {
  uploadUrl: string;
  accessToken: string;
  bytes: ArrayBuffer | Uint8Array;
  mimeType: string;
}): Promise<YouTubeVideoResource> {
  const body = input.bytes instanceof Uint8Array ? input.bytes : new Uint8Array(input.bytes);
  const response = await fetch(input.uploadUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      'Content-Length': String(body.byteLength),
      'Content-Type': input.mimeType,
    },
    body,
    cache: 'no-store',
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`YouTube video upload failed (${response.status}): ${detail}`);
  }

  return (await response.json()) as YouTubeVideoResource;
}

export async function uploadYouTubeVideo(input: {
  metadata: YouTubeUploadMetadata;
  bytes: ArrayBuffer | Uint8Array;
  mimeType: string;
}): Promise<YouTubeVideoResource> {
  const body = input.bytes instanceof Uint8Array ? input.bytes : new Uint8Array(input.bytes);
  const session = await startYouTubeResumableUpload({
    metadata: input.metadata,
    contentLength: body.byteLength,
    mimeType: input.mimeType,
  });

  return completeYouTubeResumableUpload({
    uploadUrl: session.uploadUrl,
    accessToken: session.accessToken,
    bytes: body,
    mimeType: input.mimeType,
  });
}

export async function setYouTubeThumbnail(input: {
  videoId: string;
  bytes: ArrayBuffer | Uint8Array;
  mimeType: 'image/jpeg' | 'image/png';
}): Promise<void> {
  const videoId = input.videoId.trim();
  if (!videoId) throw new Error('YouTube videoId is required for thumbnail upload.');

  const accessToken = await getYouTubeAccessToken();
  const body = input.bytes instanceof Uint8Array ? input.bytes : new Uint8Array(input.bytes);
  const url = `${YOUTUBE_THUMBNAIL_URL}?videoId=${encodeURIComponent(videoId)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': input.mimeType,
      'Content-Length': String(body.byteLength),
    },
    body,
    cache: 'no-store',
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`YouTube thumbnail upload failed (${response.status}): ${detail}`);
  }
}
