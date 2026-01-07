"use client";

import { useEffect, useState } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { WorkloadResponse } from '@/lib/nilcc-types';
import { dockerComposesha256Hex } from '@/lib/hash';
import { useWorkloadReport } from '@/hooks/useWorkloadReport';
import { VerifyAttestationMeasurementTab } from '@/components/verify/VerifyAttestationMeasurementTab';
import { VerifyAttestationTab } from '@/components/verify/VerifyAttestationTab';
import { VerificationResultModal } from '@/components/verify/VerificationResultModal';

type ActiveTab = 'attestation-measurement' | 'attestation';
type VerifiedFrom = 'attestation-measurement' | 'attestation' | null;

export default function VerifyPage() {
  const { client, apiKey } = useSettings();

  // Tab state
  const [activeTab, setActiveTab] = useState<ActiveTab>('attestation-measurement');

  // Workloads
  const [workloads, setWorkloads] = useState<WorkloadResponse[]>([]);
  const [selectedWorkloadId, setSelectedWorkloadId] = useState<string>('');
  const [loadingWorkloads, setLoadingWorkloads] = useState(true);

  // Docker compose hash
  const [dockerComposeHash, setDockerComposeHash] = useState('');

  // Report URL for badge
  const [reportUrl, setReportUrl] = useState('');

  // Submit/Modal state
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [verifiedFrom, setVerifiedFrom] = useState<VerifiedFrom>(null);

  // Use the workload report hook
  const { data: reportData, loading: reportLoading, error: reportError } = useWorkloadReport(
    selectedWorkloadId,
    workloads
  );

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
            if (fetchedWorkloads[0].domain) {
              setReportUrl(`https://${fetchedWorkloads[0].domain}/nilcc/api/v2/report`);
            }
          }
        })
        .catch(() => {})
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
        .catch(() => {});
    } else {
      setDockerComposeHash('');
    }

    if (selected?.domain) {
      setReportUrl(`https://${selected.domain}/nilcc/api/v2/report`);
    }
  }, [selectedWorkloadId, workloads]);

  // Handler for Tab 1 - Verify Attestation + Measurement
  const handleVerifyNew = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setVerified(null);
    setVerifiedFrom('attestation-measurement');
    try {
      const res = await fetch('/api/verify-new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report: reportData.rawReport,
          docker_compose_hash: dockerComposeHash,
          nilcc_version: reportData.nilccVersion,
          vcpus: reportData.vcpus,
          vm_type: reportData.vmType,
        }),
      });
      const data = await res.json().catch(() => ({}));
      setVerified(res.ok && data?.success === true);
    } catch {
      setVerified(false);
    } finally {
      setSubmitting(false);
      setModalOpen(true);
    }
  };

  // Handler for Tab 2 - Verify Attestation
  const handleVerifyAmd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setVerified(null);
    setVerifiedFrom('attestation');
    try {
      const res = await fetch('/api/verify-amd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report: reportData.rawReport,
        }),
      });
      const data = await res.json().catch(() => ({}));
      setVerified(res.ok && data?.success === true);
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

      {/* Tabs */}
      <div className="flex space-x-1 mb-4">
        <button
          type="button"
          onClick={() => setActiveTab('attestation-measurement')}
          className={`px-3 py-2 text-sm font-medium rounded-t-md transition-colors ${
            activeTab === 'attestation-measurement'
              ? 'nillion-bg-primary text-primary-foreground'
              : 'nillion-bg-secondary nillion-text-secondary'
          }`}
        >
          Verify Attestation + Measurement
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('attestation')}
          className={`px-3 py-2 text-sm font-medium rounded-t-md transition-colors ${
            activeTab === 'attestation'
              ? 'nillion-bg-primary text-primary-foreground'
              : 'nillion-bg-secondary nillion-text-secondary'
          }`}
        >
          Verify Attestation
        </button>
      </div>

      {/* Tab 1: Verify Attestation + Measurement */}
      {activeTab === 'attestation-measurement' && (
        <VerifyAttestationMeasurementTab
          workloads={workloads}
          loadingWorkloads={loadingWorkloads}
          selectedWorkloadId={selectedWorkloadId}
          onWorkloadChange={setSelectedWorkloadId}
          reportData={reportData}
          reportLoading={reportLoading}
          reportError={reportError}
          dockerComposeHash={dockerComposeHash}
          submitting={submitting}
          onVerify={handleVerifyNew}
        />
      )}

      {/* Tab 2: Verify Attestation */}
      {activeTab === 'attestation' && (
        <VerifyAttestationTab
          workloads={workloads}
          loadingWorkloads={loadingWorkloads}
          selectedWorkloadId={selectedWorkloadId}
          onWorkloadChange={setSelectedWorkloadId}
          reportLoading={reportLoading}
          reportError={reportError}
          rawReport={reportData.rawReport}
          submitting={submitting}
          onVerify={handleVerifyAmd}
        />
      )}

      {/* Verification Result Modal */}
      <VerificationResultModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        verified={verified}
        verifiedFrom={verifiedFrom}
        reportUrl={reportUrl}
      />
    </div>
  );
}
