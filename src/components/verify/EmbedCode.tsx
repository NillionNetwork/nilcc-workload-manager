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
  const [codeType, setCodeType] = useState<'html' | 'jsx'>('html');

  useEffect(() => {
    // Set default deployment URL, but don't use localhost
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      // If localhost, leave empty so user must enter their production URL
      if (!origin.includes('localhost') && !origin.includes('127.0.0.1')) {
        setDeploymentUrl(origin);
      }
    }
  }, []);

  const badgeParams = `verificationUrl=${encodeURIComponent(verificationUrl)}${
    reportUrl ? `&reportUrl=${encodeURIComponent(reportUrl)}` : ''
  }`;

  const htmlCode = deploymentUrl
    ? `<iframe src="${deploymentUrl}/api/badge?${badgeParams}" width="260" height="90" scrolling="no" style="border: none;"></iframe>`
    : '';

  const jsxCode = deploymentUrl
    ? `<iframe
  src="${deploymentUrl}/api/badge?${badgeParams}"
  width={260}
  height={90}
  scrolling="no"
  style={{ border: 'none' }}
/>`
    : '';

  const embedCode = codeType === 'html' ? htmlCode : jsxCode;

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
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Deployment URL</label>
        <Input
          type="text"
          value={deploymentUrl}
          onChange={(e) => setDeploymentUrl(e.target.value)}
          placeholder="https://your-app.com"
          className="h-7 text-xs"
        />
        <p className="text-xs text-muted-foreground mt-1">Enter your production deployment URL (not localhost)</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setCodeType('html')}
          className={`px-3 py-1 text-xs rounded ${codeType === 'html'
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
        >
          HTML
        </button>
        <button
          onClick={() => setCodeType('jsx')}
          className={`px-3 py-1 text-xs rounded ${codeType === 'jsx'
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
        >
          React/JSX
        </button>
      </div>

      <div className="relative">
        <textarea
          readOnly
          value={embedCode || 'Enter deployment URL above to generate embed code'}
          className="w-full h-24 p-2 text-xs font-mono bg-muted rounded border border-border resize-none"
          onClick={(e) => e.currentTarget.select()}
        />
        <Button
          onClick={handleCopy}
          className="absolute top-2 right-2 h-7 text-xs"
          variant="secondary"
          disabled={!embedCode}
        >
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </div>

      <div className="text-xs text-muted-foreground space-y-1">
        <p>• Badge displays verified measurement from GitHub attestation</p>
        <p>• {reportUrl ? 'Optionally checks live workload matches verification' : 'Add Report URL to check live workload status'}</p>
        <p>• {codeType === 'html' ? 'Paste into HTML files or README' : 'Paste into React components'}</p>
      </div>
    </div>
  );
}
