# VidTSX Desktop - Release Guide

This guide explains how to release new versions of VidTSX Desktop with auto-update support.

---

## Prerequisites

- GitHub repository: `hassancs91/vidtsx-desktop`
- GitHub Personal Access Token with `repo` scope
- Node.js and npm installed

---

## Release Workflow

### Step 1: Make Your Changes

Edit your code, fix bugs, add features, etc.

### Step 2: Update Version Number

Open `package.json` and update the version:

```json
{
  "version": "1.1.0"
}
```

**Version format:** `MAJOR.MINOR.PATCH`
- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes

### Step 3: Update Version in UI (Optional)

If you display the version in the app, update it in `src/renderer/App.tsx`:

```tsx
<span className="text-sm font-medium text-gray-500">v1.1</span>
```

And in the footer:

```tsx
<span className="text-sm font-medium">&copy; 2026 VidTSX v1.1. All rights reserved.</span>
```

### Step 4: Commit Your Changes

```powershell
git add .
git commit -m "Release v1.1.0: Description of changes"
git push
```

### Step 5: Set GitHub Token

```powershell
$env:GH_TOKEN="your_github_personal_access_token"
```

### Step 6: Build and Publish

```powershell
npm run build:publish
```

This will:
1. Build the Vite frontend
2. Build the Electron app
3. Create the Windows installer
4. Upload to GitHub Releases as a **draft**

### Step 7: Finalize the Release on GitHub

1. Go to: https://github.com/hassancs91/vidtsx-desktop/releases
2. You'll see a **Draft** release
3. Click **Edit** (pencil icon)
4. Add release notes describing what changed
5. Click **Publish release**

---

## What Gets Uploaded

After `npm run build:publish`, these files are uploaded to GitHub:

| File | Purpose |
|------|---------|
| `VidTSX-Desktop-Setup-X.X.X.exe` | Windows installer |
| `latest.yml` | Version metadata for auto-updater |

---

## How Auto-Update Works

1. User opens the installed app
2. After 3 seconds, app checks `latest.yml` on GitHub
3. If newer version exists, notification appears
4. User clicks **Download** → progress bar shows
5. User clicks **Install & Restart** → app updates

---

## Testing Auto-Update

### First Time Setup

1. Build v1.0.0 and publish to GitHub
2. Install the app from `release/VidTSX-Desktop-Setup-1.0.0.exe`

### Test the Update Flow

1. Update version to `1.1.0` in `package.json`
2. Run `npm run build:publish`
3. Publish the release on GitHub
4. Open the installed v1.0.0 app
5. Wait 3 seconds - update notification should appear
6. Click Download → Install & Restart
7. App should restart with v1.1.0

---

## Troubleshooting

### "No update available" even though new version exists

- Make sure the release is **published** (not draft)
- Check that `latest.yml` was uploaded
- Verify version in `package.json` is higher than installed version

### Build fails with token error

- Ensure `$env:GH_TOKEN` is set correctly
- Token must have `repo` scope
- Check token hasn't expired

### Update downloads but doesn't install

- Windows may block unsigned apps
- Consider code signing for production

---

## Quick Reference

```powershell
# Set token (do this once per session)
$env:GH_TOKEN="your_token_here"

# Build and publish
npm run build:publish

# Then go to GitHub and publish the draft release
```

---

## File Locations

| What | Where |
|------|-------|
| Version number | `package.json` line 3 |
| Build output | `release/` folder |
| Updater service | `src/main/services/updater.ts` |
| Update UI | `src/renderer/components/ui/UpdateNotification.tsx` |
| GitHub releases | https://github.com/hassancs91/vidtsx-desktop/releases |
