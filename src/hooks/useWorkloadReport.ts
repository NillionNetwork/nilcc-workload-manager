"use client";

import { useEffect, useState } from 'react';
import { WorkloadResponse } from '@/lib/nilcc-types';

export interface WorkloadReportData {
  rawReport: string;
  measurementHash: string;
  nilccVersion: string;
  vcpus: number;
  vmType: string;
}

export interface UseWorkloadReportResult {
  data: WorkloadReportData;
  loading: boolean;
  error: string | null;
}

export function useWorkloadReport(
  selectedWorkloadId: string,
  workloads: WorkloadResponse[]
): UseWorkloadReportResult {
  const [rawReport, setRawReport] = useState('');
  const [measurementHash, setMeasurementHash] = useState('');
  const [nilccVersion, setNilccVersion] = useState('');
  const [vcpus, setVcpus] = useState<number>(0);
  const [vmType, setVmType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedWorkloadId) return;
    let cancelled = false;

    const selectedWorkload = workloads.find(w => w.workloadId === selectedWorkloadId);
    if (!selectedWorkload?.domain) {
      setError('Workload has no domain');
      return;
    }

    const reportUrl = `https://${selectedWorkload.domain}/nilcc/api/v2/report`;

    setLoading(true);
    setError(null);

    fetch(reportUrl)
      .then(res => {
        if (!res.ok) throw new Error(`Failed to fetch report (${res.status})`);
        return res.json();
      })
      .then(data => {
        if (!cancelled) {
          const rawReportData = data?.raw_report;
          const measurement = data?.report?.measurement;
          const environment = data?.environment;

          if (rawReportData) {
            setRawReport(rawReportData);
          } else {
            setError('No raw_report found in response');
          }

          if (measurement) {
            setMeasurementHash(measurement);
          }

          if (environment) {
            setNilccVersion(environment.nilcc_version || '');
            setVcpus(environment.cpu_count || 0);
            setVmType(environment.vm_type || '');
          }
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Failed to fetch report');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [selectedWorkloadId, workloads]);

  return {
    data: {
      rawReport,
      measurementHash,
      nilccVersion,
      vcpus,
      vmType,
    },
    loading,
    error,
  };
}
