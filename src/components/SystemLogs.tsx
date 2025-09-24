'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui';
import { FileText, RefreshCw, Loader2 } from 'lucide-react';
import { NilccClient } from '@/lib/nilcc-client';
import { WorkloadResponse } from '@/lib/nilcc-types';
import { useError } from '@/contexts/ErrorContext';

interface SystemLogsProps {
  workload: WorkloadResponse;
  client: NilccClient;
  actionInProgress: boolean;
  tailLogs: boolean;
  isActive: boolean;
}

export default function SystemLogs({
  workload,
  client,
  actionInProgress,
  tailLogs,
  isActive,
}: SystemLogsProps) {
  const { addError } = useError();
  const [systemLogs, setSystemLogs] = useState<string[]>([]);
  const [systemLogsLoading, setSystemLogsLoading] = useState(false);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop =
        logsContainerRef.current.scrollHeight;
    }
  }, []);

  const fetchSystemLogs = useCallback(async () => {
    if (
      !isActive ||
      actionInProgress ||
      !['starting', 'awaitingCert', 'running'].includes(workload.status)
    ) {
      return;
    }

    try {
      setSystemLogsLoading(true);
      const response = await client.getSystemLogs({
        workloadId: workload.workloadId,
        tail: tailLogs,
        source: 'cvm-agent',
        maxLines: 100,
      });

      setSystemLogs((prevLogs) => {
        const newLogs = response.lines;

        // If this is the first load, just set the logs
        if (prevLogs.length === 0) {
          setTimeout(scrollToBottom, 100);
          return newLogs;
        }

        // Check if the new logs are completely different (e.g., cleared/rotated)
        if (newLogs.length > 0 && prevLogs.length > 0) {
          const lastPrevLog = prevLogs[prevLogs.length - 1];
          const hasLastLogInNew = newLogs.includes(lastPrevLog);

          if (!hasLastLogInNew) {
            // Logs were cleared/rotated, replace entirely
            setTimeout(scrollToBottom, 100);
            return newLogs;
          }

          // Find where the previous logs end in the new logs
          const lastPrevLogIndex = newLogs.lastIndexOf(lastPrevLog);
          if (
            lastPrevLogIndex !== -1 &&
            lastPrevLogIndex < newLogs.length - 1
          ) {
            // There are new logs after the last previous log
            const newLines = newLogs.slice(lastPrevLogIndex + 1);
            setTimeout(scrollToBottom, 100);
            return [...prevLogs, ...newLines];
          }
        }

        // No new logs to add
        return prevLogs;
      });
    } catch (err) {
      if (err instanceof Error) {
        const errorWithResponse = err as Error & {
          response?: { status?: number };
        };

        // Don't show errors for 500 status codes during transitions
        if (errorWithResponse.response?.status === 500) {
          return;
        }

        console.error('Failed to fetch system logs:', err);
        addError('Failed to fetch system logs');
      }
    } finally {
      setSystemLogsLoading(false);
    }
  }, [
    workload.workloadId,
    workload.status,
    client,
    addError,
    tailLogs,
    actionInProgress,
    isActive,
    scrollToBottom,
  ]);

  // Auto-refresh logs
  useEffect(() => {
    if (
      !isActive ||
      actionInProgress ||
      !['starting', 'awaitingCert', 'running'].includes(workload.status)
    ) {
      return;
    }

    // Initial fetch
    fetchSystemLogs();

    // Set up interval for auto-refresh
    const interval = setInterval(fetchSystemLogs, 5000);

    return () => clearInterval(interval);
  }, [fetchSystemLogs, isActive, workload.status, actionInProgress]);

  // Clear logs when workload actions are performed
  useEffect(() => {
    if (actionInProgress) {
      setSystemLogs([]);
    }
  }, [actionInProgress]);

  const canShowLogs = ['starting', 'awaitingCert', 'running'].includes(
    workload.status
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <FileText className="h-4 w-4 mr-2" />
          <span className="font-medium">System Logs</span>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={fetchSystemLogs}
          disabled={!canShowLogs || systemLogsLoading}
        >
          {systemLogsLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      <div
        ref={logsContainerRef}
        className="bg-muted/50 border rounded-md p-3 h-80 overflow-y-auto font-mono text-xs"
      >
        {!canShowLogs ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Logs only appear for active workloads
          </div>
        ) : systemLogsLoading && systemLogs.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-4 w-4 animate-spin mr-2 text-muted-foreground" />
            <span className="text-muted-foreground">Loading logs...</span>
          </div>
        ) : systemLogs.length > 0 ? (
          <div className="space-y-1">
            {systemLogs.map((line, index) => (
              <div key={index} className="whitespace-pre-wrap break-words">
                {line}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No system logs available
          </div>
        )}
      </div>
    </div>
  );
}
