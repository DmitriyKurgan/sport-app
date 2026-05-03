# Build FitTrack as Android APK

The web app is configured as an installable PWA (manifest, service worker, icons). You have three ways to ship it as an APK / AAB.

---

## Option 1 — PWA Builder (recommended, no Android SDK needed)

Microsoft's PWA Builder generates a signed Trusted Web Activity (TWA) APK from any PWA URL in ~3 minutes.

1. **Deploy the frontend first** (so it has a public HTTPS URL).

2. Open https://www.pwabuilder.com → paste your URL:
   ```
   https://sport-app-gold.vercel.app
   ```
   Click **Start**.

3. PWA Builder analyzes the manifest and shows a score. Fix any criticals it lists (usually none — our manifest is complete).

4. Click **Package For Stores** → **Android** → **Generate Package**.

5. In the dialog:
   - **Package ID**: `app.fittrack.twa` (must be unique reverse-DNS)
   - **App name**: `FitTrack`
   - **Launcher name**: `FitTrack`
   - **Signing key**:
     - **First time** → choose *Generate new* — **download and keep `signing.keystore` + the password**. You will need both for every future update.
     - **Future updates** → upload the same keystore.
   - Leave other fields default.

6. Click **Generate**. You get a ZIP containing:
   - `app-release-signed.apk` — install on devices directly
   - `app-release-bundle.aab` — upload to Google Play Console
   - `assetlinks.json` — required for the TWA to skip the URL bar

7. **Install the APK on a device:**
   - Transfer `app-release-signed.apk` to the phone
   - Settings → Security → enable *Install from unknown sources*
   - Tap the file → Install

8. **Verify the digital asset link** (so the address bar disappears):
   - Open `assetlinks.json` from the ZIP, copy its content
   - Place it at `fittrack-web/public/.well-known/assetlinks.json`
   - Push, redeploy. Without this the app works but shows the browser URL bar.

### Update flow
Push web changes → Vercel redeploys → users get them automatically (no APK reinstall needed) **as long as they keep the same package**. Reinstall the APK only when the manifest changes drastically (new icons, new package ID).

---

## Option 2 — Bubblewrap CLI (Google's tool)

If you have Android Studio + JDK 17 installed locally, this gives you full control.

```bash
npm install -g @bubblewrap/cli

# Initialize from your manifest URL
bubblewrap init --manifest https://sport-app-gold.vercel.app/manifest.webmanifest

# Bubblewrap asks a series of questions — accept defaults except:
#   Application name: FitTrack
#   Package ID: app.fittrack.twa
#   Signing key: generate (or reuse keystore.jks)

# Build APK
bubblewrap build

# Output:
#   ./app-release-signed.apk
#   ./app-release-bundle.aab
```

Bubblewrap also generates `assetlinks.json` — copy it to `fittrack-web/public/.well-known/assetlinks.json` and redeploy.

---

## Option 3 — Capacitor (for native features)

Use this only if you need native APIs unavailable in the browser (push notifications via FCM, biometric auth, true offline-first storage, native camera, BLE, etc.). Otherwise PWA + TWA is simpler.

```bash
cd fittrack-web
npm install @capacitor/core @capacitor/cli @capacitor/android

npx cap init FitTrack app.fittrack --web-dir=out
# Add to next.config.mjs:  output: 'export'   (Capacitor needs static HTML)
npm run build

npx cap add android
npx cap sync

# Open in Android Studio for signing + APK/AAB generation
npx cap open android
```

Trade-off: switching to `output: 'export'` removes server-side rendering and dynamic routes. You may need to refactor `/training/day/[dayId]` to a query-string approach.

---

## After installation — check your PWA score

In Chrome on desktop:

1. Open https://sport-app-gold.vercel.app
2. DevTools → **Application** tab → **Manifest** — should show name, icons, theme.
3. **Service Workers** — should show `sw.js` activated.
4. **Lighthouse** → run *Progressive Web App* audit — target ≥ 90.

Anything below 90 usually means a missing icon size or `start_url` that returns 200. Both are configured here.

---

## Updating the icon

Replace `fittrack-web/public/icon.svg` with your design (square viewBox, no transparency at edges to play well with maskable mode), then regenerate PNGs:

```bash
cd fittrack-web
node scripts/generate-icons.mjs
```

Commit `public/icon.svg`, `public/icon-192.png`, `public/icon-512.png`, `public/apple-icon-180.png`, `public/favicon-32.png`. Vercel redeploys automatically.

For **maskable** icons (Android adaptive icons that crop to circle/squircle), keep the visually important content inside the central 80% of the canvas — Android may crop the outer 10% on some devices.

---

## TL;DR

> **Just want the APK?** → use Option 1 (PWA Builder). 5 minutes, no toolchain. After installation users get web updates automatically.
