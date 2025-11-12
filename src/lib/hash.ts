export async function dockerComposesha256Hex(input: string): Promise<string> {
  if (
    typeof globalThis !== 'undefined' &&
    typeof globalThis.crypto !== 'undefined' &&
    'subtle' in globalThis.crypto
  ) {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Node.js fallback (e.g., when executed in API routes or SSR)
  const nodeCrypto = await import('crypto');
  const createHash = nodeCrypto.createHash ?? nodeCrypto.default?.createHash;
  return createHash('sha256').update(input).digest('hex');
}


