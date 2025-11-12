'use client';

import { useState, useEffect } from 'react';
import { Button, Input } from '@/components/ui';

interface EmbedCodeProps {
  verificationUrl: string;
  reportUrl?: string;
}

export function EmbedCode({ verificationUrl, reportUrl }: EmbedCodeProps) {
  const [copied, setCopied] = useState(false);
  const [deploymentUrl, setDeploymentUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDeploymentUrl(window.location.origin);
    }
  }, []);

  const badgeParams = `verificationUrl=${encodeURIComponent(verificationUrl)}${
    reportUrl ? `&reportUrl=${encodeURIComponent(reportUrl)}` : ''
  }`;

  const embedCode = deploymentUrl
    ? `<iframe
  src="${deploymentUrl}/api/badge?${badgeParams}"
  width={260}
  height={90}
  scrolling="no"
  style={{ border: 'none' }}
/>`
    : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-semibold">Embed code (JSX):</label>
        <Button
          onClick={handleCopy}
          className="h-7 text-xs"
          variant="secondary"
          disabled={!embedCode}
        >
          {copied ? '✅' : '📋'}
        </Button>
      </div>
      <textarea
        readOnly
        value={embedCode}
        className="w-full h-24 p-2 text-xs font-mono bg-muted rounded border border-border resize-none"
        onClick={(e) => e.currentTarget.select()}
      />

      <div className="text-xs text-muted-foreground space-y-1">
        <p>• Badge displays verified measurement from GitHub attestation</p>
        <p>• {reportUrl ? 'Checks live workload matches verification' : 'Live workload check included'}</p>
        <p>• Paste into React components</p>
      </div>
    </div>
  );
}
