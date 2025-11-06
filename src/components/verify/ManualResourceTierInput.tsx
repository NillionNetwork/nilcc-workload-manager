"use client";

import { Input } from "@/components/ui";

type ManualResourceTierInputProps = {
  value: string;
  onValueChange: (value: string) => void;
};

export function ManualResourceTierInput({ value, onValueChange }: ManualResourceTierInputProps) {
  return (
    <div>
      <h4 className="text-xs font-medium text-card-foreground mb-1">Resource Tier</h4>
      <label className="text-xs text-muted-foreground block mb-2">Select tier to set CPU, Memory, Disk & Cost</label>
      <Input
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder="2"
        min="1"
        required
        className="h-7 text-xs mt-0.5"
      />
    </div>
  );
}


