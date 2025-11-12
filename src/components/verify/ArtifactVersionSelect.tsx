"use client";

import { Alert } from "@/components/ui";
import type { Artifact } from "@/lib/nilcc-types";

type ArtifactVersionSelectProps = {
  loading: boolean;
  artifacts: Artifact[];
  value: string;
  onChange: (value: string) => void;
};

export function ArtifactVersionSelect({ loading, artifacts, value, onChange }: ArtifactVersionSelectProps) {
  return (
    <div>
      <h4 className="text-xs font-medium text-card-foreground mb-1">Artifact Version</h4>
      <label className="text-xs text-muted-foreground block mb-2">Select the VM image version</label>
      {loading && (
        <p className="text-muted-foreground text-xs mt-0.5">Loading artifact versions...</p>
      )}
      {!loading && artifacts.length > 0 && (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-2 text-xs border border-border rounded-md bg-background"
        >
          {artifacts.map((artifact) => (
            <option key={artifact.version} value={artifact.version}>
              {artifact.version} (Built: {new Date(artifact.builtAt).toLocaleDateString()})
            </option>
          ))}
        </select>
      )}
      {!loading && artifacts.length === 0 && (
        <Alert variant="warning" className="px-2 mt-0.5">
          <p className="text-xs">No artifact versions available. Using default.</p>
        </Alert>
      )}
    </div>
  );
}


