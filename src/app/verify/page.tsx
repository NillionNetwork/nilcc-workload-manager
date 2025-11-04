"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, Input, Button, Modal, Alert } from '@/components/ui';
import { useSettings } from '@/contexts/SettingsContext';
import { Artifact, WorkloadTier } from '@/lib/nilcc-types';

export default function VerifyPage() {
  const { client, apiKey } = useSettings();

  const [measurementHash, setMeasurementHash] = useState('7ed75de7865771c8e4faa378fa738e3effe5a83d68dfb90335211c45311e5cedde0373a58c2bdeb38a46b96af3782f0d');
  const [dockerComposeHash, setDockerComposeHash] = useState('3ca4dafba09c64e1811a116354db9ba61582268e381d3f452a2dafbd80eca041');

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
  
  // Workflow polling state
  const [workflowRunId, setWorkflowRunId] = useState<number | null>(null);
  const [workflowStatus, setWorkflowStatus] = useState<string | null>(null);
  const [workflowUrl, setWorkflowUrl] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);

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

  // Poll workflow status
  useEffect(() => {
    if (!workflowRunId || !polling) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/verify/monitor-workflow?run_id=${workflowRunId}`);
        const data = await res.json();
        
        if (data.success) {
          setWorkflowStatus(data.status);
          if (data.html_url) {
            setWorkflowUrl(data.html_url);
          }

          if (data.status === 'completed') {
            setPolling(false);
            setSubmitting(false);
            setVerified(data.verified);
            setModalOpen(true);
          } else if (data.status === 'cancelled' || (data.conclusion && data.conclusion !== 'success' && data.conclusion !== 'failure')) {
            setPolling(false);
            setSubmitting(false);
            setVerified(false);
            setModalOpen(true);
          }
        }
      } catch (error) {
        console.error('Error polling workflow:', error);
        // Continue polling on error
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [workflowRunId, polling]);

  const onVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setVerified(null);
    setWorkflowRunId(null);
    setWorkflowStatus(null);
    setWorkflowUrl(null);
    setPolling(false);
    
    try {
      const effectiveNilccVersion = apiKey ? selectedArtifactVersion : nilccVersionInput;
      const effectiveVcpus = apiKey ? (selectedTier?.cpus ?? 0) : parseInt(vcpusInput || '0', 10);
      const res = await fetch('/verify', {
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
        setSubmitting(false);
        setModalOpen(true);
      } else {
        // Workflow triggered successfully, start polling
        if (data.workflow_run_id) {
          setWorkflowRunId(data.workflow_run_id);
          setPolling(true);
          setWorkflowStatus(data.status || 'queued');
        } else {
          // Fallback: if no workflow run ID, treat as immediate failure
          setVerified(false);
          setSubmitting(false);
          setModalOpen(true);
        }
      }
    } catch {
      setVerified(false);
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Measurement Hash</label>
                <Input
                  type="text"
                  value={measurementHash}
                  onChange={(e) => setMeasurementHash(e.target.value)}
                  placeholder="7ed75de7865771c8e4faa378fa738e3effe5a83d68dfb90335211c45311e5cedde0373a58c2bdeb38a46b96af3782f0d"
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
                  placeholder="3ca4dafba09c64e1811a116354db9ba61582268e381d3f452a2dafbd80eca041"
                  required
                  className="h-7 text-xs mt-0.5"
                />
              </div>
            </div>

            {/* Resource Tier and Artifact Version when API key present; manual inputs otherwise */}
            {apiKey ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[1fr_1fr] gap-4 mt-4">
                {/* Resource Tier */}
                <div>
                  <h4 className="text-xs font-medium text-card-foreground mb-1">Resource Tier</h4>
                  <label className="text-xs text-muted-foreground block mb-2">Select tier to set CPU, Memory, Disk & Cost</label>
                  {loadingTiers && (
                    <p className="text-muted-foreground text-xs mt-0.5">Loading tiers...</p>
                  )}
                  {!loadingTiers && tiers.length > 0 && (
                    <select
                      value={selectedTierId}
                      onChange={(e) => setSelectedTierId(e.target.value)}
                      className="w-full p-2 text-xs border border-border rounded-md bg-background"
                      required
                    >
                      {tiers.map((tier) => (
                        <option key={tier.tierId} value={tier.tierId}>
                          {tier.name} - {tier.cpus} CPU • {tier.memoryMb}MB RAM • {tier.diskGb}GB Disk • {tier.cost} credit/min
                        </option>
                      ))}
                    </select>
                  )}
                  {!loadingTiers && tiers.length === 0 && (
                    <Alert variant="warning" className="px-2 mt-0.5">
                      <p className="text-xs">No tiers available</p>
                    </Alert>
                  )}
                </div>

                {/* Artifact Version */}
                <div>
                  <h4 className="text-xs font-medium text-card-foreground mb-1">Artifact Version</h4>
                  <label className="text-xs text-muted-foreground block mb-2">Select the VM image version</label>
                  {loadingArtifacts && (
                    <p className="text-muted-foreground text-xs mt-0.5">Loading artifact versions...</p>
                  )}
                  {!loadingArtifacts && artifacts.length > 0 && (
                    <select
                      value={selectedArtifactVersion}
                      onChange={(e) => setSelectedArtifactVersion(e.target.value)}
                      className="w-full p-2 text-xs border border-border rounded-md bg-background"
                    >
                      {artifacts.map((artifact) => (
                        <option key={artifact.version} value={artifact.version}>
                          {artifact.version} (Built: {new Date(artifact.builtAt).toLocaleDateString()})
                        </option>
                      ))}
                    </select>
                  )}
                  {!loadingArtifacts && artifacts.length === 0 && (
                    <Alert variant="warning" className="px-2 mt-0.5">
                      <p className="text-xs">No artifact versions available. Using default.</p>
                    </Alert>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[1fr_1fr] gap-4 mt-4">
                {/* Resource Tier (manual input for VCPUs) */}
                <div>
                  <h4 className="text-xs font-medium text-card-foreground mb-1">Resource Tier</h4>
                  <label className="text-xs text-muted-foreground block mb-2">Select tier to set CPU, Memory, Disk & Cost</label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={vcpusInput}
                    onChange={(e) => setVcpusInput(e.target.value)}
                    placeholder="2"
                    min="1"
                    required
                    className="h-7 text-xs mt-0.5"
                  />
                </div>

                {/* Artifact Version (manual input for version) */}
                <div>
                  <h4 className="text-xs font-medium text-card-foreground mb-1">Artifact Version</h4>
                  <label className="text-xs text-muted-foreground block mb-2">Select the VM image version</label>
                  <Input
                    type="text"
                    value={nilccVersionInput}
                    onChange={(e) => setNilccVersionInput(e.target.value)}
                    placeholder="0.2.1"
                    required
                    className="h-7 text-xs mt-0.5"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-end pt-2 gap-2">
          {polling && workflowStatus && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Status: {workflowStatus}</span>
              {workflowUrl && (
                <a
                  href={workflowUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  View workflow
                </a>
              )}
            </div>
          )}
          <Button
            type="submit"
            loading={submitting}
            disabled={
              submitting || polling || (apiKey ? (!selectedTierId || loadingTiers || loadingArtifacts) : (!nilccVersionInput || !vcpusInput))
            }
          >
            {polling ? 'Verifying...' : 'Verify'}
          </Button>
        </div>
      </form>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={"Verification Result"}
      >
        {verified === true && (
          <div className="space-y-2">
            <p style={{ color: '#16a34a' }} className="text-sm">Measurement hash verified.</p>
            {workflowUrl && (
              <a
                href={workflowUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline"
              >
                View workflow run
              </a>
            )}
          </div>
        )}
        {verified === false && (
          <div className="space-y-2">
            <p className="text-sm text-destructive">Could not verify measurement hash.</p>
            {workflowUrl && (
              <a
                href={workflowUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline"
              >
                View workflow run for details
              </a>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}


