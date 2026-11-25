# Notes (Android)

A minimal, dark notes app modelled on the Redmi/MIUI Notes app. Notes only (no to-do lists), with
export of all notes to one text file, ordered by date taken.

## Download

**[⬇ Download Notes.apk](https://github.com/pc-testing/Claude-auto/releases/download/notes-app-latest/Notes.apk)**

On your phone: open the link, download `Notes.apk`, tap it, and allow "Install unknown apps"
for your browser when Android asks.

## Build

Every push to the `notes-app` branch builds the APK with GitHub Actions and updates the
download link above. To build locally:

```
npm install
npx cap sync android
cd android && ./gradlew assembleDebug
```

The app itself is a single file: `www/index.html`.
