const https = require('https');
const fs = require('fs');
const path = require('path');
const { createWriteStream, existsSync, mkdirSync, unlinkSync, chmodSync } = fs;

// Configuration
const WHISPER_VERSION = 'v1.8.3';
const GITHUB_REPO = 'ggerganov/whisper.cpp';

// Platform-specific binary mappings
const PLATFORM_BINARIES = {
  win32: {
    x64: {
      asset: 'whisper-bin-x64.zip',
      executable: 'whisper-cli.exe'
    }
  },
  darwin: {
    x64: { asset: null, executable: 'whisper-cli' },
    arm64: { asset: null, executable: 'whisper-cli' }
  },
  linux: {
    x64: { asset: null, executable: 'whisper-cli' }
  }
};

async function downloadWhisperBinary() {
  const platform = process.platform;
  const arch = process.arch;

  console.log(`[whisper-download] Platform: ${platform}, Arch: ${arch}`);

  const platformConfig = PLATFORM_BINARIES[platform]?.[arch];
  if (!platformConfig) {
    console.warn(`[whisper-download] No pre-built binary for ${platform}/${arch}`);
    console.warn('[whisper-download] You may need to build whisper.cpp from source');
    return;
  }

  if (!platformConfig.asset) {
    console.warn(`[whisper-download] No pre-built release for ${platform}/${arch}`);
    console.warn('[whisper-download] For macOS/Linux, build from source or use package manager');
    return;
  }

  const resourcesDir = path.join(__dirname, '..', 'resources', 'whisper');
  const executablePath = path.join(resourcesDir, platformConfig.executable);

  // Check if binary already exists
  if (existsSync(executablePath)) {
    console.log('[whisper-download] Whisper binary already exists, skipping download');
    return;
  }

  // Ensure directory exists
  if (!existsSync(resourcesDir)) {
    mkdirSync(resourcesDir, { recursive: true });
  }

  const downloadUrl = `https://github.com/${GITHUB_REPO}/releases/download/${WHISPER_VERSION}/${platformConfig.asset}`;
  const zipPath = path.join(resourcesDir, platformConfig.asset);

  console.log(`[whisper-download] Downloading from: ${downloadUrl}`);

  try {
    // Download the zip file
    await downloadFile(downloadUrl, zipPath);

    // Extract the binary
    console.log('[whisper-download] Extracting binary...');
    const unzipper = require('unzipper');
    await extractZip(zipPath, resourcesDir, unzipper);

    // Clean up zip file
    unlinkSync(zipPath);

    // Move files from Release subfolder if it exists (whisper.cpp zips have this structure)
    const releaseDir = path.join(resourcesDir, 'Release');
    if (existsSync(releaseDir)) {
      console.log('[whisper-download] Moving files from Release folder...');
      const files = fs.readdirSync(releaseDir);
      for (const file of files) {
        const src = path.join(releaseDir, file);
        const dest = path.join(resourcesDir, file);
        fs.renameSync(src, dest);
      }
      fs.rmdirSync(releaseDir);
    }

    // Make executable (for Unix-like systems)
    if (platform !== 'win32' && existsSync(executablePath)) {
      chmodSync(executablePath, 0o755);
    }

    console.log('[whisper-download] Whisper binary downloaded successfully!');
  } catch (error) {
    console.error('[whisper-download] Failed to download whisper binary:', error.message);
    console.error('[whisper-download] You may need to download manually from:');
    console.error(`  https://github.com/${GITHUB_REPO}/releases`);
    // Don't fail the install - app can still run with API transcription
  }
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const followRedirects = (currentUrl) => {
      const urlObj = new URL(currentUrl);
      const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        headers: {
          'User-Agent': 'VidTSX-Desktop/1.0'
        }
      };

      https.get(options, (response) => {
        // Handle redirects (GitHub uses 302)
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          console.log('[whisper-download] Following redirect...');
          followRedirects(redirectUrl);
          return;
        }

        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
          return;
        }

        const totalSize = parseInt(response.headers['content-length'], 10) || 0;
        let downloadedSize = 0;

        const file = createWriteStream(destPath);

        response.on('data', (chunk) => {
          downloadedSize += chunk.length;
          if (totalSize > 0) {
            const percent = Math.round((downloadedSize / totalSize) * 100);
            process.stdout.write(`\r[whisper-download] Progress: ${percent}%`);
          }
        });

        response.pipe(file);

        file.on('finish', () => {
          console.log(''); // New line after progress
          file.close(resolve);
        });

        file.on('error', (err) => {
          unlinkSync(destPath);
          reject(err);
        });
      }).on('error', reject);
    };

    followRedirects(url);
  });
}

async function extractZip(zipPath, destDir, unzipper) {
  return new Promise((resolve, reject) => {
    fs.createReadStream(zipPath)
      .pipe(unzipper.Extract({ path: destDir }))
      .on('close', resolve)
      .on('error', reject);
  });
}

// Run the download
downloadWhisperBinary().catch(console.error);
