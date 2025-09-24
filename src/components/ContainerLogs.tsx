'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Tabs, Tab } from '@/components/ui';
import { Terminal, RefreshCw, Loader2 } from 'lucide-react';
import { NilccClient } from '@/lib/nilcc-client';
import { WorkloadResponse, Container } from '@/lib/nilcc-types';
import { useError } from '@/contexts/ErrorContext';

interface ContainerLogsProps {
  workload: WorkloadResponse;
  client: NilccClient;
  containers: Container[];
  actionInProgress: boolean;
  tailLogs: boolean;
  isActive: boolean;
}

export default function ContainerLogs({
  workload,
  client,
  containers,
  actionInProgress,
  tailLogs,
  isActive,
}: ContainerLogsProps) {
  const { addError } = useError();
  const [containerLogs, setContainerLogs] = useState<
    Record<string, Record<'stdout' | 'stderr', string[]>>
  >({});
  const [selectedContainer, setSelectedContainer] = useState<string>('');
  const [containerLogsLoading, setContainerLogsLoading] = useState<
    Record<'stdout' | 'stderr', boolean>
  >({
    stdout: false,
    stderr: false,
  });
  const logsContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop =
        logsContainerRef.current.scrollHeight;
    }
  }, []);

  // Auto-select first container when containers change
  useEffect(() => {
    if (containers.length > 0 && !selectedContainer) {
      const firstContainer = containers[0];
      const containerName =
        firstContainer.names?.[0] || firstContainer.name || 'unknown';
      setSelectedContainer(containerName);
    }
  }, [containers, selectedContainer]);

  const fetchContainerLogs = useCallback(
    async (containerName: string, stream: 'stdout' | 'stderr') => {
      if (
        !isActive ||
        actionInProgress ||
        !['running', 'awaitingCert'].includes(workload.status)
      ) {
        return;
      }

      try {
        setContainerLogsLoading((prev) => ({ ...prev, [stream]: true }));
        const response = await client.getContainerLogs({
          workloadId: workload.workloadId,
          container: containerName,
          tail: tailLogs,
          stream: stream,
          maxLines: 100,
        });

        setContainerLogs((prev) => ({
          ...prev,
          [containerName]: {
            ...prev[containerName],
            [stream]: response.lines,
          },
        }));

        setTimeout(scrollToBottom, 100);
      } catch (err) {
        if (err instanceof Error) {
          const errorWithResponse = err as Error & {
            response?: { status?: number };
          };

          // Don't show errors for 500 status codes during transitions
          if (errorWithResponse.response?.status === 500) {
            return;
          }

          console.error(
            `Failed to fetch ${stream} logs for container ${containerName}:`,
            err
          );
          addError(
            `Failed to fetch ${stream} logs for container ${containerName}`
          );
        }
      } finally {
        setContainerLogsLoading((prev) => ({ ...prev, [stream]: false }));
      }
    },
    [
      workload.workloadId,
      workload.status,
      client,
      addError,
      tailLogs,
      actionInProgress,
      isActive,
      scrollToBottom,
    ]
  );

  // Auto-refresh container logs
  useEffect(() => {
    if (
      !isActive ||
      actionInProgress ||
      !selectedContainer ||
      !['running', 'awaitingCert'].includes(workload.status)
    ) {
      return;
    }

    // Initial fetch for both streams
    fetchContainerLogs(selectedContainer, 'stdout');
    fetchContainerLogs(selectedContainer, 'stderr');

    // Set up interval for auto-refresh
    const interval = setInterval(() => {
      fetchContainerLogs(selectedContainer, 'stdout');
      fetchContainerLogs(selectedContainer, 'stderr');
    }, 5000);

    return () => clearInterval(interval);
  }, [
    fetchContainerLogs,
    isActive,
    selectedContainer,
    workload.status,
    actionInProgress,
  ]);

  // Clear logs when workload actions are performed
  useEffect(() => {
    if (actionInProgress) {
      setContainerLogs({});
    }
  }, [actionInProgress]);

  const handleContainerChange = (containerName: string) => {
    setSelectedContainer(containerName);
    // Clear existing logs for new container
    setContainerLogs((prev) => ({
      ...prev,
      [containerName]: { stdout: [], stderr: [] },
    }));
  };

  const handleRefresh = () => {
    if (selectedContainer) {
      fetchContainerLogs(selectedContainer, 'stdout');
      fetchContainerLogs(selectedContainer, 'stderr');
    }
  };

  const canShowLogs = ['running', 'awaitingCert'].includes(workload.status);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Terminal className="h-4 w-4 mr-2" />
          <span className="font-medium">Container Logs</span>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleRefresh}
          disabled={
            !canShowLogs ||
            !selectedContainer ||
            containerLogsLoading.stderr ||
            containerLogsLoading.stdout
          }
        >
          {containerLogsLoading.stderr || containerLogsLoading.stdout ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {/* Container Selection */}
      {containers.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-2">Container:</label>
          <select
            value={selectedContainer}
            onChange={(e) => handleContainerChange(e.target.value)}
            className="w-full p-2 text-sm border border-border rounded-md bg-background"
          >
            {containers.map((container) => {
              const containerName =
                container.names?.[0] || container.name || 'unknown';
              return (
                <option key={containerName} value={containerName}>
                  {containerName} ({container.image})
                </option>
              );
            })}
          </select>
        </div>
      )}

      {/* Stream Tabs and Logs Display */}
      {selectedContainer ? (
        <Tabs defaultTab={0}>
          <Tab label="stderr">
            <div
              ref={logsContainerRef}
              className="bg-muted/50 border rounded-md p-3 h-80 overflow-y-auto font-mono text-xs"
            >
              {!canShowLogs ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Container logs only appear for running workloads
                </div>
              ) : containerLogsLoading.stderr &&
                (containerLogs[selectedContainer]?.stderr || []).length ===
                  0 ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-4 w-4 animate-spin mr-2 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Loading stderr logs...
                  </span>
                </div>
              ) : (containerLogs[selectedContainer]?.stderr || []).length >
                0 ? (
                <div className="space-y-1">
                  {(containerLogs[selectedContainer]?.stderr || []).map(
                    (line, index) => (
                      <div
                        key={index}
                        className="whitespace-pre-wrap break-words"
                      >
                        {line}
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No stderr logs available for {selectedContainer}
                </div>
              )}
            </div>
          </Tab>
          <Tab label="stdout">
            <div
              ref={logsContainerRef}
              className="bg-muted/50 border rounded-md p-3 h-80 overflow-y-auto font-mono text-xs"
            >
              {!canShowLogs ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Container logs only appear for running workloads
                </div>
              ) : containerLogsLoading.stdout &&
                (containerLogs[selectedContainer]?.stdout || []).length ===
                  0 ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-4 w-4 animate-spin mr-2 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Loading stdout logs...
                  </span>
                </div>
              ) : (containerLogs[selectedContainer]?.stdout || []).length >
                0 ? (
                <div className="space-y-1">
                  {(containerLogs[selectedContainer]?.stdout || []).map(
                    (line, index) => (
                      <div
                        key={index}
                        className="whitespace-pre-wrap break-words"
                      >
                        {line}
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No stdout logs available for {selectedContainer}
                </div>
              )}
            </div>
          </Tab>
        </Tabs>
      ) : (
        <div className="bg-muted/50 border rounded-md p-3 h-80 overflow-y-auto font-mono text-xs">
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No containers available
          </div>
        </div>
      )}
    </div>
  );
}
