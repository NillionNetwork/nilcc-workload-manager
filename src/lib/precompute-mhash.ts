export type WorkloadReportResponse = {
  report?: {
    measurement?: string;
  };
};

/**
 * Fetches the attestation report for the given workload and returns the
 * report.measurement as the precomputed measurement hash.
 *
 * - If NEXT_PUBLIC_NILCC_API_BASE contains "sandbox" OR NEXT_PUBLIC_SANDBOX === "true",
 *   use the sandbox workloads domain.
 * - Otherwise default to the production workloads domain.
 */

export async function preComputeMHash(workloadId: string): Promise<string> {
  if (!workloadId) {
    throw new Error('workloadId is required');
  }

  const apiBase = process.env.NEXT_PUBLIC_NILCC_API_BASE || '';
  const isSandbox = apiBase.includes('sandbox') || process.env.NEXT_PUBLIC_SANDBOX === 'true';
  const host = isSandbox
    ? 'workloads.nilcc.sandbox.nillion.network'
    : 'workloads.nilcc.nillion.network';

  const url = `https://${workloadId}.${host}/nilcc/api/v2/report`;

  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) {
    throw new Error(`Failed to fetch workload report (${res.status})`);
  }

  const data: WorkloadReportResponse = await res.json();
  const measurement = data?.report?.measurement;
  if (typeof measurement !== 'string' || measurement.length === 0) {
    throw new Error('Measurement not found in workload report');
  }

  return measurement;
}