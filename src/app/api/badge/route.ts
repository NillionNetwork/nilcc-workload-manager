import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const verificationUrl = searchParams.get('verificationUrl');
  const reportUrl = searchParams.get('reportUrl');

  if (!verificationUrl) {
    return new NextResponse(errorBadge('Verification URL required'), {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  try {
    // Parse GitHub URL to extract owner, repo, branch, and filepath
    const githubInfo = parseGitHubUrl(verificationUrl);

    if (!githubInfo) {
      return new NextResponse(errorBadge('Invalid GitHub URL'), {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    // Verify that the latest commit author is github-actions[bot]
    const isVerified = await verifyGitHubActionCommit(
      githubInfo.owner,
      githubInfo.repo,
      githubInfo.branch,
      githubInfo.filepath
    );

    if (!isVerified) {
      return new NextResponse(
        errorBadge('Verification file not committed by GitHub Actions'),
        {
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }
    // Convert GitHub blob URL to raw URL if needed
    const rawUrl = convertToRawGitHubUrl(verificationUrl);

    // Fetch the verification JSON
    const verificationResponse = await fetch(rawUrl);
    if (!verificationResponse.ok) {
      return new NextResponse(errorBadge('Failed to fetch verification'), {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    const verificationData = await verificationResponse.json();

    // Parse measurement hash from new version-based JSON format
    // Expected format: { "0.3.6": { "measurement_hash": "...", "allowedDomains": [...], ... } }
    const versionKeys = Object.keys(verificationData);
    if (versionKeys.length === 0) {
      return new NextResponse(errorBadge('Invalid verification format'), {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    // Get the first/only version object
    const versionKey = versionKeys[0];
    const versionData = verificationData[versionKey];

    if (!versionData || typeof versionData !== 'object') {
      return new NextResponse(errorBadge('Invalid verification format'), {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    const measurementHash = versionData.measurement_hash;
    const allowedDomains = versionData.allowedDomains || [];

    if (!measurementHash) {
      return new NextResponse(errorBadge('Invalid verification format'), {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    // Domain whitelist validation
    if (allowedDomains && Array.isArray(allowedDomains) && allowedDomains.length > 0) {
      const referer = request.headers.get('referer');

      if (referer) {
        try {
          const refererUrl = new URL(referer);
          const refererDomain = refererUrl.hostname;

          // Always allow localhost for development
          const isLocalhost = ['localhost', '127.0.0.1', '0.0.0.0', '::1'].includes(refererDomain) ||
                             refererDomain.startsWith('localhost:') ||
                             refererDomain.startsWith('127.0.0.1:');

          if (isLocalhost) {
            // Allow localhost without checking allowedDomains
          } else {
            // Check if referer domain is in allowedDomains
            const isAllowed = allowedDomains.some((domain: string) => {
              // Exact match or subdomain match
              return refererDomain === domain || refererDomain.endsWith('.' + domain);
            });

            if (!isAllowed) {
              return new NextResponse(
                errorBadge('Not authorized to display this badge'),
                {
                  headers: { 'Content-Type': 'text/html' },
                }
              );
            }
          }
        } catch {
          // Invalid referer URL, allow it (could be local development)
        }
      }
      // If no referer header, allow it (could be direct access or testing)
    }

    let liveStatus: 'matches' | 'changed' | 'unavailable' | null = null;

    // Optional: Check live report if reportUrl provided
    if (reportUrl) {
      try {
        const reportResponse = await fetch(reportUrl);
        if (reportResponse.ok) {
          const reportData = await reportResponse.json();
          const liveMeasurement = reportData?.report?.measurement;
          if (liveMeasurement) {
            liveStatus =
              liveMeasurement === measurementHash ? 'matches' : 'changed';
          } else {
            liveStatus = 'unavailable';
          }
        } else {
          liveStatus = 'unavailable';
        }
      } catch {
        liveStatus = 'unavailable';
      }
    }

    return new NextResponse(successBadge(measurementHash, liveStatus, verificationUrl), {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch {
    return new NextResponse(errorBadge('Verification failed'), {
      headers: { 'Content-Type': 'text/html' },
    });
  }
}

function convertToRawGitHubUrl(url: string): string {
  // Convert GitHub blob URLs to raw.githubusercontent.com
  // From: https://github.com/user/repo/blob/branch/path/file.json
  // To: https://raw.githubusercontent.com/user/repo/branch/path/file.json
  if (url.includes('github.com') && url.includes('/blob/')) {
    return url
      .replace('github.com', 'raw.githubusercontent.com')
      .replace('/blob/', '/');
  }
  return url;
}

function parseGitHubUrl(url: string): { owner: string; repo: string; branch: string; filepath: string } | null {
  try {
    // Handle both blob and raw URLs
    // Blob: https://github.com/owner/repo/blob/branch/path/to/file.json
    // Raw: https://raw.githubusercontent.com/owner/repo/branch/path/to/file.json

    const urlObj = new URL(url);

    if (urlObj.hostname === 'github.com') {
      // Format: github.com/owner/repo/blob/branch/path/to/file.json
      const parts = urlObj.pathname.split('/').filter(p => p.length > 0);
      if (parts.length < 5 || parts[2] !== 'blob') return null;

      const owner = parts[0];
      const repo = parts[1];
      const branch = parts[3];
      const filepath = parts.slice(4).join('/');

      return { owner, repo, branch, filepath };
    } else if (urlObj.hostname === 'raw.githubusercontent.com') {
      // Format: raw.githubusercontent.com/owner/repo/branch/path/to/file.json
      const parts = urlObj.pathname.split('/').filter(p => p.length > 0);
      if (parts.length < 4) return null;

      const owner = parts[0];
      const repo = parts[1];
      const branch = parts[2];
      const filepath = parts.slice(3).join('/');

      return { owner, repo, branch, filepath };
    }

    return null;
  } catch {
    return null;
  }
}

async function verifyGitHubActionCommit(
  owner: string,
  repo: string,
  branch: string,
  filepath: string
): Promise<boolean> {
  const githubToken = process.env.GITHUB_TOKEN;

  if (!githubToken) {
    // No token available - fail closed
    return false;
  }

  try {
    // Get the latest commit for this specific file
    const commitsUrl = `https://api.github.com/repos/${owner}/${repo}/commits?path=${encodeURIComponent(filepath)}&sha=${encodeURIComponent(branch)}&per_page=1`;

    const response = await fetch(commitsUrl, {
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!response.ok) {
      return false;
    }

    const commits = await response.json();

    if (!Array.isArray(commits) || commits.length === 0) {
      return false;
    }

    const latestCommit = commits[0];

    // Check if the commit author is github-actions[bot]
    // We check both author.name and committer.login for flexibility
    const isGitHubAction =
      latestCommit?.commit?.author?.name === 'github-actions[bot]' ||
      latestCommit?.committer?.login === 'github-actions[bot]';

    return isGitHubAction;
  } catch {
    // Fail closed on errors
    return false;
  }
}

function successBadge(
  measurement: string,
  liveStatus: 'matches' | 'changed' | 'unavailable' | null,
  verificationUrl: string
): string {
  const shortMeasurement = `${measurement.substring(
    0,
    12
  )}...${measurement.substring(measurement.length - 8)}`;

  // Determine badge appearance based on live status
  const isFailed = liveStatus === 'changed';
  const iconBg = isFailed ? '#ef4444' : '#16a34a';
  const iconSymbol = isFailed ? '✗' : '✓';
  const borderColor = isFailed ? '#fca5a5' : '#e5e7eb';

  let statusHtml = '';
  if (liveStatus === 'matches') {
    statusHtml =
      '<div class="live-status matches">🟢 Live workload matches</div>';
  } else if (liveStatus === 'changed') {
    statusHtml =
      '<div class="live-status failed">❌ Verification failed</div>';
  } else if (liveStatus === 'unavailable') {
    statusHtml =
      '<div class="live-status unavailable">⚠️ Live check unavailable</div>';
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background: transparent;
    }
    a {
      text-decoration: none;
      color: inherit;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      border-radius: 10px;
      padding: 12px 16px;
      border: 1px solid ${borderColor};
      box-shadow: 0 1px 2px rgba(0,0,0,0.04);
      background: white;
      transition: box-shadow 0.2s, border-color 0.2s;
    }
    .badge:hover {
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      border-color: #9ca3af;
    }
    .icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: ${iconBg};
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 18px;
      flex-shrink: 0;
    }
    .content {
      line-height: 1.2;
    }
    .label {
      font-size: 11px;
      color: #6b7280;
      margin-bottom: 2px;
    }
    .title {
      font-size: 14px;
      font-weight: 600;
      color: #111827;
    }
    .measurement {
      font-size: 10px;
      color: #9ca3af;
      font-family: 'Courier New', monospace;
      margin-top: 2px;
    }
    .live-status {
      font-size: 9px;
      margin-top: 3px;
      font-weight: 500;
    }
    .live-status.matches {
      color: #16a34a;
    }
    .live-status.failed {
      color: #ef4444;
    }
    .live-status.unavailable {
      color: #9ca3af;
    }
  </style>
</head>
<body>
  <a href="${verificationUrl}" target="_blank" rel="noopener noreferrer">
    <div class="badge">
      <div class="icon">${iconSymbol}</div>
      <div class="content">
        <div class="label">Attestation</div>
        <div class="title">Verified by nilCC</div>
        <div class="measurement">${shortMeasurement}</div>
        ${statusHtml}
      </div>
    </div>
  </a>
</body>
</html>`;
}

function errorBadge(message: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background: transparent;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      border-radius: 24px;
      padding: 12px 16px;
      border: 1px solid #fca5a5;
      box-shadow: 0 1px 2px rgba(0,0,0,0.04);
      background: white;
    }
    .icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #ef4444;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 18px;
      flex-shrink: 0;
    }
    .content {
      line-height: 1.2;
    }
    .title {
      font-size: 14px;
      font-weight: 600;
      color: #111827;
    }
  </style>
</head>
<body>
  <div class="badge">
    <div class="icon">✗</div>
    <div class="content">
      <div class="title">${message}</div>
    </div>
  </div>
</body>
</html>`;
}
