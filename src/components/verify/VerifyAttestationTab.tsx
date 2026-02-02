"use client";

import { Card, CardContent, Button } from '@/components/ui';
import { PreComputerToggle } from '@/components/verify/PreComputerToggle';
import { WorkloadSelect } from '@/components/verify/WorkloadSelect';
import { WorkloadResponse } from '@/lib/nilcc-types';

interface VerifyAttestationTabProps {
  workloads: WorkloadResponse[];
  loadingWorkloads: boolean;
  selectedWorkloadId: string;
  onWorkloadChange: (id: string) => void;
  reportLoading: boolean;
  reportError: string | null;
  rawReport: string;
  submitting: boolean;
  onVerify: (e: React.FormEvent) => void;
  precomputeMode: boolean;
  onPrecomputeModeChange: (value: boolean) => void;
  manualReport: string;
  onManualReportChange: (value: string) => void;
}

export function VerifyAttestationTab({
  workloads,
  loadingWorkloads,
  selectedWorkloadId,
  onWorkloadChange,
  reportLoading,
  reportError,
  rawReport,
  submitting,
  onVerify,
  precomputeMode,
  onPrecomputeModeChange,
  manualReport,
  onManualReportChange,
}: VerifyAttestationTabProps) {
  return (
    <form onSubmit={onVerify} className="space-y-2">
      <Card>
        <CardContent>
          {/* Move the Precomputed/Manual toggle above the workload selector */}
          <PreComputerToggle value={precomputeMode} onChange={onPrecomputeModeChange} />

          {precomputeMode && (
            <WorkloadSelect
              loading={loadingWorkloads}
              workloads={workloads}
              value={selectedWorkloadId}
              onChange={onWorkloadChange}
            />
          )}

          {precomputeMode && (loadingWorkloads || reportLoading) && (
            <p className="text-xs text-muted-foreground mt-4">
              {loadingWorkloads ? 'Loading workloads...' : 'Loading report data...'}
            </p>
          )}

          {precomputeMode && !loadingWorkloads && reportError && (
            <p className="text-xs text-destructive mt-4">{reportError}</p>
          )}

          {(!precomputeMode || (!loadingWorkloads && !reportLoading && !reportError)) && (
            <div>
              <label className="text-xs text-muted-foreground">Report Data</label>
              <textarea
                value={precomputeMode ? rawReport : manualReport}
                onChange={(e) => onManualReportChange(e.target.value)}
                disabled={precomputeMode}
                placeholder=""
                className={`w-full h-20 p-2 text-xs font-mono mt-0.5 border border-border rounded-md resize-none ${
                  precomputeMode ? 'bg-muted/50 text-muted-foreground cursor-not-allowed' : 'bg-background'
                }`}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-end pt-2">
        <Button
          type="submit"
          data-umami-event="verify_workload_verify_amd_api"
          loading={submitting}
          disabled={
            submitting ||
            (precomputeMode && reportLoading) ||
            (!precomputeMode && !manualReport) ||
            (precomputeMode && !rawReport)
          }
        >
          Verify
        </Button>
      </div>
    </form>
  );
}
