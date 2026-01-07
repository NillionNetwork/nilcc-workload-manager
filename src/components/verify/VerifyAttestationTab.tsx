"use client";

import { Card, CardContent, Button } from '@/components/ui';
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
}: VerifyAttestationTabProps) {
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
        </CardContent>
      </Card>

      <div className="flex items-center justify-end pt-2">
        <Button
          type="submit"
          data-umami-event="verify_workload_verify_amd_api"
          loading={submitting}
          disabled={submitting || reportLoading || !rawReport}
        >
          Verify
        </Button>
      </div>
    </form>
  );
}
