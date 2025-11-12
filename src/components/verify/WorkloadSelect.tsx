"use client";

import { Alert } from "@/components/ui";
import type { WorkloadResponse } from "@/lib/nilcc-types";

type WorkloadSelectProps = {
  loading: boolean;
  workloads: WorkloadResponse[];
  value: string;
  onChange: (value: string) => void;
};

export function WorkloadSelect({ loading, workloads, value, onChange }: WorkloadSelectProps) {
  return (
    <div>
      <label className="text-xs text-muted-foreground block mb-2">Select which workload to verify</label>
      {loading && (
        <p className="text-muted-foreground text-xs mt-0.5">Loading workloads...</p>
      )}
      {!loading && workloads.length > 0 && (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-2 text-xs border border-border rounded-md bg-background"
          required
        >
          {workloads.map((workload) => (
            <option key={workload.workloadId} value={workload.workloadId}>
              {workload.name} - {workload.status} • {workload.cpus} CPU • {workload.memory}MB RAM
            </option>
          ))}
        </select>
      )}
      {!loading && workloads.length === 0 && (
        <Alert variant="warning" className="px-2 mt-0.5">
          <p className="text-xs">No workloads available</p>
        </Alert>
      )}
    </div>
  );
}


