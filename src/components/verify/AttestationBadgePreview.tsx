export function AttestationBadgePreview() {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        borderRadius: 10,
        padding: '10px 14px',
        border: '1px solid var(--preview-border, #e5e7eb)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: '9999px',
          background: '#16a34a',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700
        }}
      >
        ✓
      </div>
      <div style={{ lineHeight: 1.15 }}>
        <div style={{ fontSize: 12 }}>Attestation</div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>Verified by nilCC</div>
      </div>
    </div>
  );
}
