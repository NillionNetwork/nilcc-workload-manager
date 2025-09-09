'use client';

import { useState, useEffect } from 'react';
import { Copy, Check, Info } from 'lucide-react';
import { Button } from '@/components/ui';

interface DockerComposeHashProps {
  dockerCompose: string;
  className?: string;
}

export default function DockerComposeHash({
  dockerCompose,
  className = '',
}: DockerComposeHashProps) {
  const [hash, setHash] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const calculateHash = async () => {
      // Convert string to ArrayBuffer
      const encoder = new TextEncoder();
      const data = encoder.encode(dockerCompose);

      // Calculate SHA-256
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);

      // Convert ArrayBuffer to hex string
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      setHash(hashHex);
    };

    if (dockerCompose) {
      calculateHash();
    }
  }, [dockerCompose]);

  const handleCopy = () => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!hash) return null;

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center gap-2">
        <label
          className="text-xs text-muted-foreground font-medium inline-flex items-center gap-1 relative"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <Info className="h-3 w-3 inline-block mr-1" />
          <span>Docker Compose Hash</span>
          {showTooltip && (
            <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-black/90 text-white rounded-md shadow-xl z-50 backdrop-blur-sm">
              <p className="text-xs leading-relaxed">
                <strong className="block mb-1">What is this?</strong>
                The SHA256 hash of your Docker Compose. It's calculated from the
                Docker Compose file shown above.
              </p>
              <p className="text-xs leading-relaxed mt-2">
                <strong className="block mb-1">What's included?</strong>
                Only the Docker Compose file content. Environment variables,
                files, and other workload settings are NOT included in this
                hash.
              </p>
              <div className="absolute top-full left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-black/90"></div>
            </div>
          )}
        </label>
      </div>
      <div className="flex items-center gap-2">
        <code className="font-mono bg-muted px-2 py-1 rounded text-xs text-foreground break-all">
          {hash}
        </code>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-6 px-2 text-xs shrink-0"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 mr-1" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
