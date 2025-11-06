export async function dockerComposesha256Hex(input: string): Promise<string> {
  if (
    typeof globalThis !== 'undefined' &&
    (globalThis as any).crypto &&
    'subtle' in (globalThis as any).crypto
  ) {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await (globalThis as any).crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Node.js fallback (e.g., when executed in API routes or SSR)
  const nodeCrypto: any = await import('crypto');
  const createHash = nodeCrypto.createHash ?? nodeCrypto.default?.createHash;
  return createHash('sha256').update(input).digest('hex');
}


