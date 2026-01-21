const https = require('https');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { createWriteStream, existsSync, mkdirSync, unlinkSync, chmodSync } = fs;

// Configuration - matches ffmpeg-static version 5.3.0
const FFMPEG_RELEASE_TAG = 'b6.1.1';
const GITHUB_REPO = 'eugeneware/ffmpeg-static';

// Platform-specific binary mappings
const PLATFORM_BINARIES = {
  win32: {
    x64: {
      asset: 'ffmpeg-win32-x64.gz',
      executable: 'ffmpeg.exe'
    }
  },
  darwin: {
    x64: {
      asset: 'ffmpeg-darwin-x64.gz',
      executable: 'ffmpeg'
    },
    arm64: {
      asset: 'ffmpeg-darwin-arm64.gz',
      executable: 'ffmpeg'
    }
  },
  linux: {
    x64: {
      asset: 'ffmpeg-linux-x64.gz',
      executable: 'ffmpeg'
    }
  }
};

async function downloadFfmpegBinary() {
  const platform = process.platform;
  const arch = process.arch;

  console.log(`[ffmpeg-download] Platform: ${platform}, Arch: ${arch}`);

  const platformConfig = PLATFORM_BINARIES[platform]?.[arch];
  if (!platformConfig) {
    console.warn(`[ffmpeg-download] No pre-built binary for ${platform}/${arch}`);
    console.warn('[ffmpeg-download] You may need to install ffmpeg manually');
    return;
  }

  const resourcesDir = path.join(__dirname, '..', 'resources', 'ffmpeg');
  const executablePath = path.join(resourcesDir, platformConfig.executable);

  // Check if binary already exists
  if (existsSync(executablePath)) {
    console.log('[ffmpeg-download] FFmpeg binary already exists, skipping download');
    return;
  }

  // Ensure directory exists
  if (!existsSync(resourcesDir)) {
    mkdirSync(resourcesDir, { recursive: true });
  }

  const downloadUrl = `https://github.com/${GITHUB_REPO}/releases/download/${FFMPEG_RELEASE_TAG}/${platformConfig.asset}`;
  const gzPath = path.join(resourcesDir, platformConfig.asset);

  console.log(`[ffmpeg-download] Downloading from: ${downloadUrl}`);

  try {
    // Download the gzipped file
    await downloadFile(downloadUrl, gzPath);

    // Decompress the file
    console.log('[ffmpeg-download] Decompressing...');
    await decompressGzip(gzPath, executablePath);

    // Clean up gz file
    unlinkSync(gzPath);

    // Make executable (for Unix-like systems)
    if (platform !== 'win32') {
      chmodSync(executablePath, 0o755);
    }

    console.log('[ffmpeg-download] FFmpeg binary downloaded successfully!');
  } catch (error) {
    console.error('[ffmpeg-download] Failed to download ffmpeg binary:', error.message);
    console.error('[ffmpeg-download] You may need to download manually from:');
    console.error(`  https://github.com/${GITHUB_REPO}/releases`);
    // Don't fail the install - app can still run with audio files
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
          console.log('[ffmpeg-download] Following redirect...');
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
            process.stdout.write(`\r[ffmpeg-download] Progress: ${percent}%`);
          }
        });

        response.pipe(file);

        file.on('finish', () => {
          console.log(''); // New line after progress
          file.close(resolve);
        });

        file.on('error', (err) => {
          if (existsSync(destPath)) unlinkSync(destPath);
          reject(err);
        });
      }).on('error', reject);
    };

    followRedirects(url);
  });
}

function decompressGzip(gzPath, destPath) {
  return new Promise((resolve, reject) => {
    const gunzip = zlib.createGunzip();
    const source = fs.createReadStream(gzPath);
    const dest = fs.createWriteStream(destPath);

    source.pipe(gunzip).pipe(dest);

    dest.on('finish', resolve);
    dest.on('error', reject);
    gunzip.on('error', reject);
    source.on('error', reject);
  });
}

// Run the download
downloadFfmpegBinary().catch(console.error);
