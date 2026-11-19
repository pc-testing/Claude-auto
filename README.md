# Photo Editor (Android)

A simple, lightweight photo editor for Android 8.0 and newer.

## Download

**[⬇ Download the latest APK](https://github.com/pc-testing/claude-auto/releases/latest/download/PhotoEditor.apk)**

On your phone: open the link, download `PhotoEditor.apk`, tap it, and allow
"Install unknown apps" for your browser when Android asks.

## Features

- **Open** any photo from your gallery or files (or "Share" a photo to the app from Google Photos/Gallery)
- **Transform:** rotate left/right, flip horizontal/vertical, crop to 1:1, 4:5, 4:3, 16:9, reset
- **Filters:** B&W, Sepia, Vintage, Vivid, Warm, Cool, Invert, Vignette
- **Adjust:** brightness, contrast, saturation, warmth sliders with live preview
- **Undo** (multiple steps)
- **Save** full-quality JPEG to `Pictures/PhotoEditor`
- **Share** straight to other apps

## How it's built

Every push to `main` triggers the GitHub Actions workflow in
`.github/workflows/build.yml`, which builds the APK and publishes it as a new
[Release](https://github.com/pc-testing/claude-auto/releases).

To build locally (needs the Android SDK): `gradle assembleRelease` (Gradle 8.14)

> Note: the APK is signed with the build machine's debug key, which changes per
> build. If installing a newer version fails, uninstall the old one first.
