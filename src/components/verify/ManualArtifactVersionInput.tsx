"use client";

import { Input } from "@/components/ui";

type ManualArtifactVersionInputProps = {
  value: string;
  onValueChange: (value: string) => void;
};

export function ManualArtifactVersionInput({ value, onValueChange }: ManualArtifactVersionInputProps) {
  return (
    <div>
      <h4 className="text-xs font-medium text-card-foreground mb-1">Artifact Version</h4>
      <label className="text-xs text-muted-foreground block mb-2">Select the VM image version</label>
      <Input
        type="text"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder="0.2.1"
        required
        className="h-7 text-xs mt-0.5"
      />
    </div>
  );
}


