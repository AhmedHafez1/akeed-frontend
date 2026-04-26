# Shopify Feature Media Package

This package contains production assets for the Akeed Shopify App Store feature
video.

## Files

- `../shopify-feature-video.md`: master video brief, script, storyboard, and QA
  checklist.
- `generate-thumbnail.ps1`: regenerates the 1600x900 feature video thumbnail.
- `generate-video.ps1`: renders a silent first-pass 95-second storyboard video.
- `captions.vtt`: English captions timed to the approved voiceover.
- `editor-shot-list.csv`: shot-by-shot edit checklist for the video editor.
- `assets/akeed-feature-thumbnail.png`: exported thumbnail for upload.
- `assets/akeed-feature-video.avi`: generated first-pass video render.

## Regenerate Thumbnail

From `akeed-frontend`:

```powershell
powershell -ExecutionPolicy Bypass -File docs\shopify-feature-media\generate-thumbnail.ps1
```

The thumbnail must remain 1600x900 and must not include Shopify branding, GPS,
location sharing, or real customer/order data.

## Regenerate First-Pass Video

From `akeed-frontend`:

```powershell
powershell -ExecutionPolicy Bypass -File docs\shopify-feature-media\generate-video.ps1
```

The generated AVI is a silent storyboard render with captions baked in. Use it
as a review cut or as a visual reference for the final narrated edit.
