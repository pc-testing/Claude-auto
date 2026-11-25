# Notes (Android)

A minimal, dark notes app modelled on the Redmi/MIUI Notes app. Notes only (no to-do lists), with
export of all notes to one text file, ordered by date taken.

## Download

**[⬇ Download Notes.apk](https://github.com/pc-testing/Claude-auto/releases/download/notes-app-latest/Notes.apk)**

On your phone: open the link, download `Notes.apk`, tap it, and allow "Install unknown apps"
for your browser when Android asks. Needs Android 7.0+.
New versions install over the old one; your notes are kept.

## Build

Every push to the `notes-app` branch builds the APK with GitHub Actions and updates the
download link above. To build locally:

```
npm install
npx cap sync android
cd android && ./gradlew assembleDebug
```

`assembleDebug` is fine for testing. Release builds are signed with
`android/app/notes-release.p12`; its password is the `KEYSTORE_PASSWORD`
Actions secret (set it as an environment variable to build a release locally).

The app itself is a single file: `www/index.html`. Notes are stored in
`notes.json` in the app's private storage (see `NotesStorePlugin.java`).
