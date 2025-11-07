'use client';

interface AttestationBadgePreviewProps {
  reportUrl: string;
  baseUrl?: string;
}

export function AttestationBadgePreview({ reportUrl, baseUrl }: AttestationBadgePreviewProps) {
  // Use current origin if baseUrl not provided
  const effectiveBaseUrl = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');

  return (
    <iframe
      src={`${effectiveBaseUrl}/api/badge?reportUrl=${encodeURIComponent(reportUrl)}`}
      width={260}
      height={90}
      style={{ border: 'none' }}
      title="Attestation Badge"
    />
  );
}
