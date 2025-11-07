import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const reportUrl = searchParams.get('reportUrl');

  if (!reportUrl) {
    return new NextResponse(errorBadge('Report URL required'), {
      headers: { 'Content-Type': 'text/html' }
    });
  }

  try {
    // Fetch the report
    const response = await fetch(reportUrl);
    if (!response.ok) {
      return new NextResponse(errorBadge('Failed to fetch report'), {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    const data = await response.json();
    const measurement = data?.report?.measurement;
    const teeType = 'AMD SEV-SNP';

    if (!measurement) {
      return new NextResponse(errorBadge('No measurement found'), {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    return new NextResponse(successBadge(measurement, teeType), {
      headers: { 
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
      }
    });
  } catch {
    return new NextResponse(errorBadge('Verification failed'), {
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

function successBadge(measurement: string, teeType: string): string {
  const shortMeasurement = `${measurement.substring(0, 12)}...${measurement.substring(measurement.length - 8)}`;
  
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
  </style>
</head>
<body>
  <div class="badge">
    <div class="icon">✓</div>
    <div class="content">
      <div class="label">Attestation</div>
      <div class="title">Verified by nilCC</div>
      <div class="measurement">${teeType}</div>
      <div class="measurement">${shortMeasurement}</div>
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
