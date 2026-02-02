"use client";

import { useState } from "react";

type PreComputerToggleProps = {
  value: boolean;
  onChange: (next: boolean) => void;
};

function InfoTooltip() {
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
          className="absolute right-0 z-20 w-64 mt-2 text-xs py-2 px-3 rounded border"
          style={{ backgroundColor: 'var(--nillion-primary)', color: 'white' }}
          role="tooltip"
        >
          <strong>Precomputed</strong>: Uses the report data fetched from the selected workload.<br /><br />
          <strong>Manual</strong>: Manually enter report data to verify.
        </div>
      )}
    </span>
  );
}

export function PreComputerToggle({ value, onChange }: PreComputerToggleProps) {
  return (
    <div className="flex items-center space-x-3 mb-3">
      <span className="text-xs text-muted-foreground flex items-center">
        From Workload
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        tabIndex={0}
        className="relative rounded-full focus:outline-none"
        onClick={() => onChange(!value)}
        style={{
          position: 'relative',
          width: '2.75rem', // 44px
          height: '1.5rem', // 24px
          padding: '0.125rem',
          backgroundColor: value ? 'var(--nillion-primary)' : 'var(--nillion-grey)',
          border: 'none',
          borderRadius: '9999px',
          cursor: 'pointer',
          transition: 'all 200ms ease',
          outline: 'none'
        }}
      >
        <span
          style={{
            position: 'absolute',
            left: value ? '0.125rem' : 'calc(100% - 1.25rem - 0.125rem)',
            top: '0.125rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '1.25rem', // 20px
            height: '1.25rem', // 20px
            backgroundColor: 'white',
            borderRadius: '50%',
            transition: 'all 200ms ease',
            pointerEvents: 'none'
          }}
        />
        <span className="sr-only">{value ? "Precompute mode" : "Manual mode"}</span>
      </button>
      <span className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground">Manual</span>
        <InfoTooltip />
      </span>
    </div>
  );
}

