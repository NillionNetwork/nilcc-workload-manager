'use client';

interface AttestationBadgePreviewProps {
  reportUrl: string;
}

export function AttestationBadgePreview({ reportUrl }: AttestationBadgePreviewProps) {
  // Use current origin for preview (works on localhost for testing)
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div>
      <iframe
        src={`${baseUrl}/api/badge?reportUrl=${encodeURIComponent(reportUrl)}`}
        width={260}
        height={90}
      />
    </div>
  );
}
