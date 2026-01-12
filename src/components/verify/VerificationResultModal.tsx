"use client";

import { useState } from 'react';
import { Modal, Input } from '@/components/ui';
import { AttestationBadgePreview } from '@/components/verify/AttestationBadgePreview';
import { EmbedCode } from '@/components/verify/EmbedCode';

type VerifiedFrom = 'attestation-measurement' | 'attestation' | null;

interface VerificationResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  verified: boolean | null;
  verifiedFrom: VerifiedFrom;
  reportUrl?: string;
}

export function VerificationResultModal({
  isOpen,
  onClose,
  verified,
  verifiedFrom,
  reportUrl,
}: VerificationResultModalProps) {
  const [verificationUrl, setVerificationUrl] = useState('');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Verification Result"
      size={verified && verifiedFrom === 'attestation-measurement' ? 'xl' : 'md'}
    >
      {verified === true && verifiedFrom === 'attestation' && (
        <p style={{ color: '#16a34a' }} className="text-sm font-semibold">
          ✅ Verified - it runs on AMD SEV-SNP
        </p>
      )}

      {verified === true && verifiedFrom === 'attestation-measurement' && (
        <div className="space-y-4">
          <p style={{ color: '#16a34a' }} className="text-sm font-semibold">
            ✅ Measurement hash verified successfully!
          </p>

          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold mb-2">Next Steps (Optional)</h4>
            <p className="text-xs text-muted-foreground mb-3">
              If you would like to extend the verification to users, you have the option to add an embedded badge on your website.
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              Prerequisites
            </p>
            <ul className="text-xs text-muted-foreground mb-4 list-disc pl-4">
              <li>Make sure you have a <strong>public GitHub repository</strong>.</li>
              <li>Add <strong>these files</strong> to your repo (<a href="https://github.com/nillionnetwork/nilcc-verifier-template" target="_blank" rel="noopener noreferrer" className="underline">starter templates here</a>):
                <ul className="list-disc pl-4">
                  <li><code>docker-compose.yml</code> in your root directory</li>
                  <li><code>script/update-verification.sh</code> &ndash; for generating hashes and updating the JSON file</li>
                  <li><code>.github/workflows/verify-measurement.yml</code></li>
                  <li>
                    Edit the <code>allowedDomains</code> field in your file to include any domains (websites) where you want to display the badge.
                  </li>
                </ul>
              </li>
            </ul>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold mb-2">Embed Badge</h4>
            <p className="text-xs text-muted-foreground mb-3">
              After uploading the JSON file to GitHub, enter the URL below to preview and get the embed code.
            </p>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                GitHub URL to your measurement-hash.json
              </label>
              <Input
                type="text"
                value={verificationUrl}
                onChange={(e) => setVerificationUrl(e.target.value)}
                className="h-7 text-xs font-mono"
                data-umami-event="verify_workload_badge_api_input"
                placeholder="https://github.com/user/repo/blob/main/measurement-hash.json"
              />
            </div>

            {verificationUrl && (
              <>
                <div className="mt-4">
                  <label className="text-sm font-semibold mb-2 block">Preview:</label>
                  <div className="bg-muted/30 p-4 rounded-lg flex justify-center">
                    <AttestationBadgePreview
                      verificationUrl={verificationUrl}
                      reportUrl={reportUrl}
                    />
                  </div>
                </div>

                <EmbedCode
                  verificationUrl={verificationUrl}
                  reportUrl={reportUrl}
                />
              </>
            )}
          </div>
        </div>
      )}

      {verified === false && (
        <p className="text-sm text-destructive">Could not verify measurement hash.</p>
      )}
    </Modal>
  );
}
