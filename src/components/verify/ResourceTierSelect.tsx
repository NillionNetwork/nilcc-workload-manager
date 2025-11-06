"use client";

import { Alert } from "@/components/ui";
import type { WorkloadTier } from "@/lib/nilcc-types";

type ResourceTierSelectProps = {
  loading: boolean;
  tiers: WorkloadTier[];
  value: string;
  onChange: (value: string) => void;
};

export function ResourceTierSelect({ loading, tiers, value, onChange }: ResourceTierSelectProps) {
  return (
    <div>
      <h4 className="text-xs font-medium text-card-foreground mb-1">Resource Tier</h4>
      <label className="text-xs text-muted-foreground block mb-2">Select tier to set CPU, Memory, Disk & Cost</label>
      {loading && (
        <p className="text-muted-foreground text-xs mt-0.5">Loading tiers...</p>
      )}
      {!loading && tiers.length > 0 && (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
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
      {!loading && tiers.length === 0 && (
        <Alert variant="warning" className="px-2 mt-0.5">
          <p className="text-xs">No tiers available</p>
        </Alert>
      )}
    </div>
  );
}


