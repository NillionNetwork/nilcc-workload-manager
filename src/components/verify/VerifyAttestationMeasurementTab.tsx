"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, Input, Button } from '@/components/ui';
import { PreComputerToggle } from '@/components/verify/PreComputerToggle';
import { WorkloadSelect } from '@/components/verify/WorkloadSelect';
import { WorkloadResponse } from '@/lib/nilcc-types';
import { WorkloadReportData } from '@/hooks/useWorkloadReport';

interface VerifyAttestationMeasurementTabProps {
  workloads: WorkloadResponse[];
  loadingWorkloads: boolean;
  selectedWorkloadId: string;
  onWorkloadChange: (id: string) => void;
  reportData: WorkloadReportData;
  reportLoading: boolean;
  reportError: string | null;
  dockerComposeHash: string;
  submitting: boolean;
  onVerify: (e: React.FormEvent) => void;
}

export function VerifyAttestationMeasurementTab({
  workloads,
  loadingWorkloads,
  selectedWorkloadId,
  onWorkloadChange,
  reportData,
  reportLoading,
  reportError,
  dockerComposeHash,
  submitting,
  onVerify,
}: VerifyAttestationMeasurementTabProps) {
  const [precomputeMode, setPrecomputeMode] = useState(true);
  const [manualMeasurementHash, setManualMeasurementHash] = useState('');

  // Clear manual measurement hash when switching to local mode
  useEffect(() => {
    if (!precomputeMode) {
      setManualMeasurementHash('');
    }
  }, [precomputeMode]);

  return (
    <form onSubmit={onVerify} className="space-y-2">
      <Card>
        <CardContent>
          <WorkloadSelect
            loading={loadingWorkloads}
            workloads={workloads}
            value={selectedWorkloadId}
            onChange={onWorkloadChange}
          />

          {reportLoading && (
            <p className="text-xs text-muted-foreground mt-4">Loading report data...</p>
          )}

          {reportError && (
            <p className="text-xs text-destructive mt-4">{reportError}</p>
          )}

          {!reportLoading && !reportError && (
            <>
              <PreComputerToggle value={precomputeMode} onChange={setPrecomputeMode} />

              <div>
                <label className="text-xs text-muted-foreground">Measurement Hash</label>
                {precomputeMode ? (
                  <Input
                    type="text"
                    value={reportData.measurementHash}
                    readOnly
                    className="h-7 text-xs mt-0.5 bg-muted/50"
                  />
                ) : (
                  <Input
                    type="text"
                    value={manualMeasurementHash}
                    onChange={(e) => setManualMeasurementHash(e.target.value)}
                    placeholder="Enter measurement hash"
                    className="h-7 text-xs mt-0.5"
                  />
                )}
              </div>

              <div className="mt-4">
                <label className="text-xs text-muted-foreground">DOCKER_COMPOSE_HASH</label>
                <p className="font-mono text-md mt-0.5 break-all">{dockerComposeHash || '-'}</p>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="text-xs text-muted-foreground">NILCC_VERSION</label>
                  <p className="font-mono text-md mt-0.5">{reportData.nilccVersion || '-'}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">VM_TYPE</label>
                  <p className="font-mono text-md mt-0.5">{reportData.vmType || '-'}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">VCPUS</label>
                  <p className="font-mono text-md mt-0.5">{reportData.vcpus || '-'}</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-end pt-2">
        <Button
          type="submit"
          data-umami-event="verify_workload_verify_new_api"
          loading={submitting}
          disabled={submitting || reportLoading || !reportData.rawReport || !dockerComposeHash}
        >
          Verify
        </Button>
      </div>
    </form>
  );
}
