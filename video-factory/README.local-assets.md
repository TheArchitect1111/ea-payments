# Local asset pipeline

Money Behind It renders must not depend on live third-party image URLs during Remotion rendering.

The workflow runs `scripts/prepare-video-factory-assets.mjs <project-id>` before narration/render. The script downloads any missing approved source images into `public/video-factory/media/<project-id>/`, validates the response is an image and larger than 10 KB, and reuses already-cached files on later runs. The workflow commits those local media assets alongside generated narration and the MP4 so future renders are deterministic.

Project scene `mediaUrl` values should point to local paths under `public/`, for example `video-factory/media/wealthy-debt/apartments.jpg`. The Remotion renderer resolves relative media paths through `staticFile()`.
