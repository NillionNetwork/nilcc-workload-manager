'use client';

interface AttestationBadgePreviewProps {
  verificationUrl: string;
  reportUrl?: string;
}

export function AttestationBadgePreview({ verificationUrl, reportUrl }: AttestationBadgePreviewProps) {
  // Use current origin for preview (works on localhost for testing)
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  // Add cache-busting parameter to force refresh
  const cacheBuster = Date.now();
  const badgeUrl = `${baseUrl}/api/badge?verificationUrl=${encodeURIComponent(verificationUrl)}${
    reportUrl ? `&reportUrl=${encodeURIComponent(reportUrl)}` : ''
  }&_t=${cacheBuster}`;

  return (
    <div>
      <iframe
        key={badgeUrl}
        src={badgeUrl}
        width={260}
        height={90}
        style={{ border: 'none' }}
      />
    </div>
  );
}
