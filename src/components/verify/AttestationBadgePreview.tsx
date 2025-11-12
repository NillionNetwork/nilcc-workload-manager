'use client';

interface AttestationBadgePreviewProps {
  verificationUrl: string;
  reportUrl?: string;
}

export function AttestationBadgePreview({ verificationUrl, reportUrl }: AttestationBadgePreviewProps) {
  // Use current origin for preview (works on localhost for testing)
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const badgeUrl = `${baseUrl}/api/badge?verificationUrl=${encodeURIComponent(verificationUrl)}${
    reportUrl ? `&reportUrl=${encodeURIComponent(reportUrl)}` : ''
  }`;

  return (
    <div>
      <iframe
        src={badgeUrl}
        width={260}
        height={90}
        scrolling="no"
        style={{ border: 'none' }}
      />
    </div>
  );
}
