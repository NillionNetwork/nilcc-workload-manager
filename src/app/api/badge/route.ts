import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const verificationUrl = searchParams.get('verificationUrl');
  const reportUrl = searchParams.get('reportUrl');

  if (!verificationUrl) {
    return new NextResponse(errorBadge('Verification URL required'), {
      headers: { 'Content-Type': 'text/html' }
    });
  }

  try {
    // Convert GitHub blob URL to raw URL if needed
    const rawUrl = convertToRawGitHubUrl(verificationUrl);

    // Fetch the verification JSON
    const verificationResponse = await fetch(rawUrl);
    if (!verificationResponse.ok) {
      return new NextResponse(errorBadge('Failed to fetch verification'), {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    const verificationData = await verificationResponse.json();

    // Parse measurement hash from JSON structure like {"0.1.0": "hash..."}
    const measurementHash = extractMeasurementHash(verificationData);

    if (!measurementHash) {
      return new NextResponse(errorBadge('Invalid verification format'), {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    const teeType = 'AMD SEV-SNP';
    let liveStatus: 'matches' | 'changed' | 'unavailable' | null = null;

    // Optional: Check live report if reportUrl provided
    if (reportUrl) {
      try {
        const reportResponse = await fetch(reportUrl);
        if (reportResponse.ok) {
          const reportData = await reportResponse.json();
          const liveMeasurement = reportData?.report?.measurement;
          if (liveMeasurement) {
            liveStatus = liveMeasurement === measurementHash ? 'matches' : 'changed';
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

    return new NextResponse(successBadge(measurementHash, teeType, liveStatus), {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour since verification is immutable
      }
    });
  } catch {
    return new NextResponse(errorBadge('Verification failed'), {
      headers: { 'Content-Type': 'text/html' }
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

function extractMeasurementHash(data: unknown): string | null {
  // Handle different JSON structures
  if (typeof data === 'object' && data !== null) {
    // Structure: {"0.1.0": "measurement_hash"}
    const entries = Object.entries(data);
    if (entries.length > 0) {
      const [, value] = entries[0];
      if (typeof value === 'string' && value.length > 0) {
        return value;
      }
    }

    // Alternative structure: {measurementHash: "..."}
    if ('measurementHash' in data && typeof (data as { measurementHash?: unknown }).measurementHash === 'string') {
      return (data as { measurementHash: string }).measurementHash;
    }
  }
  return null;
}

function successBadge(measurement: string, teeType: string, liveStatus: 'matches' | 'changed' | 'unavailable' | null): string {
  const shortMeasurement = `${measurement.substring(0, 12)}...${measurement.substring(measurement.length - 8)}`;

  let statusHtml = '';
  if (liveStatus === 'matches') {
    statusHtml = '<div class="live-status matches">🟢 Live workload matches</div>';
  } else if (liveStatus === 'changed') {
    statusHtml = '<div class="live-status changed">⚠️ Measurement changed</div>';
  } else if (liveStatus === 'unavailable') {
    statusHtml = '<div class="live-status unavailable">⚠️ Live check unavailable</div>';
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
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      border-radius: 10px;
      padding: 12px 16px;
      border: 1px solid #e5e7eb;
      box-shadow: 0 1px 2px rgba(0,0,0,0.04);
      background: white;
    }
    .icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #16a34a;
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
    .live-status.changed {
      color: #f59e0b;
    }
    .live-status.unavailable {
      color: #9ca3af;
    }
  </style>
</head>
<body>
  <div class="badge">
    <div class="icon">✓</div>
    <div class="content">
      <div class="label">Developer Attestation</div>
      <div class="title">Verified by nilCC</div>
      <div class="measurement">${teeType}</div>
      <div class="measurement">${shortMeasurement}</div>
      ${statusHtml}
    </div>
  </div>
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
      border-radius: 10px;
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
