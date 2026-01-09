"use client";

import { useState } from 'react';
import { Card, CardContent, Input, Button } from '@/components/ui';
import { PreComputerToggle } from '@/components/verify/PreComputerToggle';
import { WorkloadSelect } from '@/components/verify/WorkloadSelect';
import { WorkloadResponse } from '@/lib/nilcc-types';
import { WorkloadReportData } from '@/hooks/useWorkloadReport';

function InfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);

  return (
    <span className="relative inline-block">
      <button
        type="button"
        tabIndex={0}
        aria-label="More information"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          boxShadow: "none",
          outline: "none",
        }}
      >
        <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="10" cy="10" r="10" fill="#e5e7eb" />
          <text x="50%" y="54%" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#636669" dy=".3em">i</text>
        </svg>
      </button>
      {show && (
        <div
          className="absolute left-0 z-20 mt-2 text-xs py-2 px-3 rounded border max-w-xs whitespace-normal break-words"
          style={{ backgroundColor: 'var(--nillion-primary)', color: 'white' }}
          role="tooltip"
        >
          {text}
        </div>
      )}
    </span>
  );
}

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
  precomputeMode: boolean;
  onPrecomputeModeChange: (value: boolean) => void;
  manualReport: string;
  onManualReportChange: (value: string) => void;
  manualMeasurementHash: string;
  onManualMeasurementHashChange: (value: string) => void;
  manualDockerComposeHash: string;
  onManualDockerComposeHashChange: (value: string) => void;
  manualNilccVersion: string;
  onManualNilccVersionChange: (value: string) => void;
  manualVmType: string;
  onManualVmTypeChange: (value: string) => void;
  manualVcpus: string;
  onManualVcpusChange: (value: string) => void;
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
  precomputeMode,
  onPrecomputeModeChange,
  manualReport,
  onManualReportChange,
  manualMeasurementHash,
  onManualMeasurementHashChange,
  manualDockerComposeHash,
  onManualDockerComposeHashChange,
  manualNilccVersion,
  onManualNilccVersionChange,
  manualVmType,
  onManualVmTypeChange,
  manualVcpus,
  onManualVcpusChange,
}: VerifyAttestationMeasurementTabProps) {

  return (
    <form onSubmit={onVerify} className="space-y-2">
      <Card>
        <CardContent>
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
            <>

              <div>
                <label className="text-xs text-muted-foreground flex items-center gap-1">
                  Report Data
                  {!precomputeMode && <InfoTooltip text="Available from /nilcc/api/v2/report endpoint on the workload details page" />}
                </label>
                <textarea
                  value={precomputeMode ? reportData.rawReport : manualReport}
                  onChange={(e) => onManualReportChange(e.target.value)}
                  disabled={precomputeMode}
                  placeholder=""
                  className={`w-full h-20 p-2 text-xs font-mono mt-0.5 border border-border rounded-md resize-none ${
                    precomputeMode ? 'bg-muted/50 text-muted-foreground cursor-not-allowed' : 'bg-background'
                  }`}
                />
              </div>

              <div className="mt-4">
                <label className="text-xs text-muted-foreground">Measurement Hash</label>
                <Input
                  type="text"
                  value={precomputeMode ? reportData.measurementHash : manualMeasurementHash}
                  onChange={(e) => onManualMeasurementHashChange(e.target.value)}
                  disabled={precomputeMode}
                  placeholder={precomputeMode ? '' : 'Enter measurement hash'}
                  className={`h-7 text-xs mt-0.5 ${precomputeMode ? 'bg-muted/50' : ''}`}
                />
              </div>

              <div className="mt-4">
                <label className="text-xs text-muted-foreground flex items-center gap-1 whitespace-nowrap">
                  DOCKER_COMPOSE_HASH
                  {!precomputeMode && <InfoTooltip text="Available from the workload details page" />}
                </label>
                <Input
                  type="text"
                  value={precomputeMode ? dockerComposeHash : manualDockerComposeHash}
                  onChange={(e) => onManualDockerComposeHashChange(e.target.value)}
                  disabled={precomputeMode}
                  placeholder={precomputeMode ? '' : 'Enter docker compose hash'}
                  className={`h-7 text-xs font-mono mt-0.5 ${precomputeMode ? 'bg-muted/50' : ''}`}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="text-xs text-muted-foreground flex items-center gap-1 whitespace-nowrap">
                    NILCC_VERSION
                    {!precomputeMode && <InfoTooltip text="Available from /nilcc/api/v2/report endpoint" />}
                  </label>
                  <Input
                    type="text"
                    value={precomputeMode ? (reportData.nilccVersion || '') : manualNilccVersion}
                    onChange={(e) => onManualNilccVersionChange(e.target.value)}
                    disabled={precomputeMode}
                    placeholder={precomputeMode ? '' : 'e.g. 0.3.6'}
                    className={`h-7 text-xs font-mono mt-0.5 ${precomputeMode ? 'bg-muted/50' : ''}`}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground flex items-center gap-1 whitespace-nowrap">
                    VM_TYPE
                    {!precomputeMode && <InfoTooltip text="Available from /nilcc/api/v2/report endpoint" />}
                  </label>
                  <Input
                    type="text"
                    value={precomputeMode ? (reportData.vmType || '') : manualVmType}
                    onChange={(e) => onManualVmTypeChange(e.target.value)}
                    disabled={precomputeMode}
                    placeholder={precomputeMode ? '' : 'e.g. snp'}
                    className={`h-7 text-xs font-mono mt-0.5 ${precomputeMode ? 'bg-muted/50' : ''}`}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground flex items-center gap-1 whitespace-nowrap">
                    VCPUS
                    {!precomputeMode && <InfoTooltip text="Available from /nilcc/api/v2/report endpoint" />}
                  </label>
                  <Input
                    type="text"
                    value={precomputeMode ? (reportData.vcpus?.toString() || '') : manualVcpus}
                    onChange={(e) => onManualVcpusChange(e.target.value)}
                    disabled={precomputeMode}
                    placeholder={precomputeMode ? '' : 'e.g. 4'}
                    className={`h-7 text-xs font-mono mt-0.5 ${precomputeMode ? 'bg-muted/50' : ''}`}
                  />
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
          disabled={
            submitting ||
            (precomputeMode && reportLoading) ||
            (precomputeMode && !reportData.rawReport) ||
            (precomputeMode && !dockerComposeHash) ||
            (!precomputeMode && !manualReport) ||
            (!precomputeMode && !manualDockerComposeHash) ||
            (!precomputeMode && !manualNilccVersion) ||
            (!precomputeMode && !manualVmType) ||
            (!precomputeMode && !manualVcpus)
          }
        >
          Verify
        </Button>
      </div>
    </form>
  );
}
