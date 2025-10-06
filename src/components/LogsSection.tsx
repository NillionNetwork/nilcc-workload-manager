'use client';

import { useState, useEffect, useCallback } from 'react';
import { Tabs, Tab } from '@/components/ui';
import { FileText, Terminal } from 'lucide-react';
import { NilccClient } from '@/lib/nilcc-client';
import { WorkloadResponse, Container } from '@/lib/nilcc-types';
import SystemLogs from './SystemLogs';
import ContainerLogs from './ContainerLogs';

interface LogsSectionProps {
  workload: WorkloadResponse;
  client: NilccClient;
  actionInProgress: boolean;
  stoppingWorkload: boolean;
  startingWorkload: boolean;
  tailLogs: boolean;
}

export default function LogsSection({
  workload,
  client,
  actionInProgress,
  stoppingWorkload,
  startingWorkload,
  tailLogs,
}: LogsSectionProps) {
  const [containers, setContainers] = useState<Container[]>([]);

  // Calculate if any action is in progress
  const anyActionInProgress =
    actionInProgress || stoppingWorkload || startingWorkload;

  const fetchContainers = useCallback(async () => {
    if (
      anyActionInProgress ||
      (workload.status !== 'running' && workload.status !== 'awaitingCert')
    ) {
      return;
    }

    try {
      const containersList = await client.listContainers(workload.workloadId);
      setContainers(containersList);
    } catch (err) {
      if (err instanceof Error) {
        const errorWithResponse = err as Error & {
          response?: { status?: number };
        };

        // Don't show errors for 500 status codes during transitions
        if (errorWithResponse.response?.status === 500) {
          return;
        }

        console.error('Failed to fetch containers:', err);
      }
    }
  }, [
    workload.workloadId,
    workload.status,
    client,
    anyActionInProgress,
  ]);

  // Fetch containers when workload becomes running
  useEffect(() => {
    if (workload.status === 'running' || workload.status === 'awaitingCert') {
      fetchContainers();

      // Set up interval to refresh containers list
      const interval = setInterval(fetchContainers, 10000); // Every 10 seconds
      return () => clearInterval(interval);
    } else {
      setContainers([]);
    }
  }, [fetchContainers, workload.status]);

  return (
    <Tabs defaultTab={0}>
      <Tab
        label={
          <>
            <FileText className="h-4 w-4 mr-2" />
            System
          </>
        }
      >
        <SystemLogs
          workload={workload}
          client={client}
          actionInProgress={anyActionInProgress}
          tailLogs={tailLogs}
          isActive={
            workload.status === 'starting' ||
            workload.status === 'running' ||
            workload.status === 'awaitingCert'
          }
        />
      </Tab>
      <Tab
        label={
          <>
            <Terminal className="h-4 w-4 mr-2" />
            Container
          </>
        }
      >
        <ContainerLogs
          workload={workload}
          client={client}
          containers={containers}
          actionInProgress={anyActionInProgress}
          tailLogs={tailLogs}
          isActive={
            workload.status === 'running' || workload.status === 'awaitingCert'
          }
        />
      </Tab>
    </Tabs>
  );
}
