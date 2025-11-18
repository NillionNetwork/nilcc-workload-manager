"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, Input, Button, Modal } from '@/components/ui';
import { ManualResourceTierInput } from '@/components/verify/ManualResourceTierInput';
import { ManualArtifactVersionInput } from '@/components/verify/ManualArtifactVersionInput';
import { ArtifactVersionSelect } from '@/components/verify/ArtifactVersionSelect';
import { ResourceTierSelect } from '@/components/verify/ResourceTierSelect';
import { PreComputerToggle } from '@/components/verify/PreComputerToggle';
import { WorkloadSelect } from '@/components/verify/WorkloadSelect';
import { AttestationBadgePreview } from '@/components/verify/AttestationBadgePreview';
import { EmbedCode } from '@/components/verify/EmbedCode';
import { useSettings } from '@/contexts/SettingsContext';
import { Artifact, WorkloadTier, WorkloadResponse } from '@/lib/nilcc-types';
import { dockerComposesha256Hex } from '@/lib/hash';

export default function VerifyPage() {
  const { client, apiKey } = useSettings();

  const [measurementHash, setMeasurementHash] = useState('');
  const [dockerComposeHash, setDockerComposeHash] = useState('');

  // Workloads
  const [workloads, setWorkloads] = useState<WorkloadResponse[]>([]);
  const [selectedWorkloadId, setSelectedWorkloadId] = useState<string>('');
  const [loadingWorkloads, setLoadingWorkloads] = useState(true);

  // Tiers and artifacts (mirror workloads/create when apiKey present)
  const [tiers, setTiers] = useState<WorkloadTier[]>([]);
  const [selectedTierId, setSelectedTierId] = useState<string>('');
  const [loadingTiers, setLoadingTiers] = useState(true);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [selectedArtifactVersion, setSelectedArtifactVersion] = useState<string>('');
  const [loadingArtifacts, setLoadingArtifacts] = useState(true);

  // Manual inputs when no apiKey (fallback)
  const [nilccVersionInput, setNilccVersionInput] = useState('0.2.1');
  const [vcpusInput, setVcpusInput] = useState('2');

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [precomputeMode, setPrecomputeMode] = useState(false)
  const [reportUrlInput, setReportUrlInput] = useState('');
  const [verificationUrl, setVerificationUrl] = useState('');

  // Fetch workloads
  useEffect(() => {
    if (client && apiKey) {
      setLoadingWorkloads(true);
      client
        .listWorkloads()
        .then((fetchedWorkloads) => {
          setWorkloads(fetchedWorkloads);
          if (fetchedWorkloads.length > 0) {
            setSelectedWorkloadId(fetchedWorkloads[0].workloadId);
            // Auto-populate report URL for first workload
            if (fetchedWorkloads[0].domain) {
              setReportUrlInput(`https://${fetchedWorkloads[0].domain}/nilcc/api/v2/report`);
            }
          }
        })
        .catch(() => { })
        .finally(() => setLoadingWorkloads(false));
    } else {
      setLoadingWorkloads(false);
    }
  }, [client, apiKey]);

  // Recalculate docker compose hash and report URL when selected workload changes
  useEffect(() => {
    const selected = workloads.find((w) => w.workloadId === selectedWorkloadId);
    if (selected?.dockerCompose) {
      dockerComposesha256Hex(selected.dockerCompose)
        .then(setDockerComposeHash)
        .catch(() => { });
    } else {
      setDockerComposeHash('');
    }

    // Auto-populate report URL when workload changes
    if (selected?.domain) {
      setReportUrlInput(`https://${selected.domain}/nilcc/api/v2/report`);
    }
  }, [selectedWorkloadId, workloads]);

  // Precompute measurement hash from workload when precompute mode is enabled
  useEffect(() => {
    if (!precomputeMode || !selectedWorkloadId) return;
    let cancelled = false;

    const selectedWorkload = workloads.find(w => w.workloadId === selectedWorkloadId);
    if (!selectedWorkload?.domain) return;

    const reportUrl = `https://${selectedWorkload.domain}/nilcc/api/v2/report`;

    fetch(reportUrl)
      .then(res => res.json())
      .then(data => {
        if (!cancelled) {
          const measurement = data?.report?.measurement;
          if (measurement) setMeasurementHash(measurement);
        }
      })
      .catch(() => { /* ignore errors; user can input manually */ });

    return () => { cancelled = true; };
  }, [precomputeMode, selectedWorkloadId, workloads]);

  // Fetch tiers
  useEffect(() => {
    if (client && apiKey) {
      setLoadingTiers(true);
      client
        .listWorkloadTiers()
        .then((fetchedTiers) => {
          setTiers(fetchedTiers);
          if (fetchedTiers.length > 0) setSelectedTierId(fetchedTiers[0].tierId);
        })
        .catch(() => {})
        .finally(() => setLoadingTiers(false));
    } else {
      setLoadingTiers(false);
    }
  }, [client, apiKey]);

  // Fetch artifacts
  useEffect(() => {
    if (client && apiKey) {
      setLoadingArtifacts(true);
      client
        .listArtifacts()
        .then((fetchedArtifacts) => {
          setArtifacts(fetchedArtifacts);
          if (fetchedArtifacts.length > 0) setSelectedArtifactVersion(fetchedArtifacts[0].version);
        })
        .catch(() => {})
        .finally(() => setLoadingArtifacts(false));
    } else {
      setLoadingArtifacts(false);
    }
  }, [client, apiKey]);

  const selectedTier = tiers.find((t) => t.tierId === selectedTierId);

  const onVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setVerified(null);
    setVerificationUrl('');
    try {
      const effectiveNilccVersion = apiKey ? selectedArtifactVersion : nilccVersionInput;
      const effectiveVcpus = apiKey ? (selectedTier?.cpus ?? 0) : parseInt(vcpusInput || '0', 10);
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          measurementHash,
          dockerComposeHash,
          nilccVersion: effectiveNilccVersion,
          vcpus: effectiveVcpus,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success !== true) {
        setVerified(false);
      } else {
        setVerified(Boolean(data?.proof_of_cloud));
        if (data?.verificationUrl) {
          setVerificationUrl(data.verificationUrl);
        }
      }
    } catch {
      setVerified(false);
    } finally {
      setSubmitting(false);
      setModalOpen(true);
    }
  };

  return (
    <div>
      <div className="mb-2">
        <h2 className="text-lg font-semibold text-foreground">Verify Measurement Hash</h2>
      </div>

      <form onSubmit={onVerify} className="space-y-2">
        <Card>
          <CardContent>

            <WorkloadSelect
              loading={loadingWorkloads}
              workloads={workloads}
              value={selectedWorkloadId}
              onChange={setSelectedWorkloadId}
            />

            <p className='mb-2'>
              In order to verify your measurement hash, you have two options.{" "}
              <a
                href="https://docs.nillion.com/build/compute/attestation"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                See documentation
              </a>
              .
            </p>

            {/* Precompute/Local toggle switch */}
            <PreComputerToggle value={precomputeMode} onChange={setPrecomputeMode} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Measurement Hash</label>
                <Input
                  type="text"
                  value={measurementHash}
                  onChange={(e) => setMeasurementHash(e.target.value)}
                  required
                  className="h-7 text-xs mt-0.5"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground">DOCKER_COMPOSE_HASH</label>
                <Input
                  type="text"
                  value={dockerComposeHash}
                  onChange={(e) => setDockerComposeHash(e.target.value)}
                  required
                  className="h-7 text-xs mt-0.5"
                />
              </div>
            </div>

            {/* Resource Tier and Artifact Version when API key present; manual inputs otherwise */}
            {apiKey ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[1fr_1fr] gap-4 mt-4">
                {/* Resource Tier */}
                <ResourceTierSelect
                  loading={loadingTiers}
                  tiers={tiers}
                  value={selectedTierId}
                  onChange={setSelectedTierId}
                />

                {/* Artifact Version */}
                <ArtifactVersionSelect
                  loading={loadingArtifacts}
                  artifacts={artifacts}
                  value={selectedArtifactVersion}
                  onChange={setSelectedArtifactVersion}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[1fr_1fr] gap-4 mt-4">
                  <ManualResourceTierInput value={vcpusInput} onValueChange={setVcpusInput} />
                  <ManualArtifactVersionInput value={nilccVersionInput} onValueChange={setNilccVersionInput} />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-end pt-2">
          <Button
            type="submit"
            loading={submitting}
            disabled={
              submitting || (apiKey ? (!selectedTierId || loadingTiers || loadingArtifacts) : (!nilccVersionInput || !vcpusInput))
            }
          >
            Verify
          </Button>
        </div>
      </form>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={"Verification Result"}
        size={verified ? 'xl' : 'md'}
      >
        {verified === true && (
          <div className="space-y-4">
            <p style={{ color: '#16a34a' }} className="text-sm font-semibold">
              ✅ Measurement hash verified successfully!
            </p>

            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-2">Next Steps (Optional) </h4>
              <p className="text-xs text-muted-foreground mb-3">
                If you would like to extend the verification to users, you have the option to add an embedded badge on your website.
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Prerequsities
              </p>
              <ul className="text-xs text-muted-foreground mb-4 list-disc pl-4">
                <li>Make sure you have a <strong>public GitHub repository</strong>.</li>
                <li>Add <strong>these files</strong> to your repo (<a href="https://github.com/nillionnetwork/nilcc-verifier-template" target="_blank" rel="noopener noreferrer" className="underline">starter templates here</a>):
                  <ul className="list-disc pl-4">
                    <li><code>docker-compose.yml</code> in your root directory</li>
                    <li><code>script/update-verification.sh</code> &ndash; for generating hashes and updating the JSON file</li>
                    <li><code>.github/workflows/verify-measurement.yml</code>
                    </li>
                    <li>
                      Edit the <code>allowedDomains</code> field in your file to include any domains (websites) where you want to display the badge.
                    </li>
                  </ul>
                </li>
              </ul>
              <p>Add <strong>these files</strong> to your repo (<a href="https://github.com/nillionnetwork/nilcc-verifier-template" target="_blank" rel="noopener noreferrer" className="underline">starter templates here</a>) </p>


              {/* <div className="bg-muted/50 p-3 rounded font-mono text-xs overflow-auto">
                <pre>{`{
  "measurementHash": "${measurementHash}",
  "reportUrl": "${reportUrlInput || 'https://your-workload.com/nilcc/api/v2/report'}",
  "allowedDomains": [
    "${reportUrlInput ? new URL(reportUrlInput).hostname : 'your-workload.com'}",
    "github.com"
  ]
}`}</pre>
              </div> */}
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-2">Embed Badge</h4>
              <p className="text-xs text-muted-foreground mb-3">
                After uploading the JSON file to GitHub, enter the URL below to preview and get the embed code.
              </p>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  GitHub URL to your verification-manifest.json
                </label>
                <Input
                  type="text"
                  value={verificationUrl}
                  onChange={(e) => setVerificationUrl(e.target.value)}
                  className="h-7 text-xs font-mono"
                  placeholder="https://github.com/user/repo/blob/main/verification-manifest.json"
                />
              </div>

              {verificationUrl && (
                <>
                  <div className="mt-4">
                    <label className="text-sm font-semibold mb-2 block">Preview:</label>
                    <div className="bg-muted/30 p-4 rounded-lg flex justify-center">
                      <AttestationBadgePreview
                        verificationUrl={verificationUrl}
                        reportUrl={reportUrlInput || undefined}
                      />
                    </div>
                  </div>

                  <EmbedCode
                    verificationUrl={verificationUrl}
                    reportUrl={reportUrlInput || undefined}
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
    </div>
  );
}

