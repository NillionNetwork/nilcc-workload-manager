'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSettings } from '@/contexts/SettingsContext';
import {
  Card,
  CardContent,
  Button,
  Badge,
  Alert,
  Modal,
  Input,
} from '@/components/ui';
import { components } from '@/styles/design-system';
import {
  WorkloadResponse,
  Container,
  WorkloadEvent,
  SystemStats,
} from '@/lib/nilcc-types';
import WorkloadStats from '@/components/WorkloadStats';
import {
  ExternalLink,
  Trash2,
  RefreshCw,
  Settings,
  Calendar,
  Cpu,
  HardDrive,
  MemoryStick,
  Monitor,
  FileText,
  Terminal,
  Copy,
  Check,
  CreditCard,
  Play,
  Square,
  RotateCw,
  Activity,
} from 'lucide-react';

export default function WorkloadDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { client, apiKey } = useSettings();
  const [workload, setWorkload] = useState<WorkloadResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buffer time to allow backend to update status after actions
  const backendBufferTime = 3000; // 3 seconds

  // Logs state
  const [containers, setContainers] = useState<Container[]>([]);
  const [systemLogs, setSystemLogs] = useState<string[]>([]);
  const [containerLogs, setContainerLogs] = useState<
    Record<string, Record<'stdout' | 'stderr', string[]>>
  >({});
  const [selectedContainer, setSelectedContainer] = useState<string>('');
  const [activeLogsTab, setActiveLogsTab] = useState<'system' | 'container'>(
    'system'
  );
  const [activeStreamTab, setActiveStreamTab] = useState<'stdout' | 'stderr'>(
    'stderr'
  );
  const [systemLogsLoading, setSystemLogsLoading] = useState(false);
  const [containerLogsLoading, setContainerLogsLoading] = useState<
    Record<'stdout' | 'stderr', boolean>
  >({ stdout: false, stderr: false });
  const [logsError, setLogsError] = useState<string | null>(null);
  const [tailLogs, setTailLogs] = useState(true);
  const [copiedCompose, setCopiedCompose] = useState(false);

  // Action state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    action: 'delete' | 'start' | 'stop' | 'restart' | null;
    loading: boolean;
  }>({ isOpen: false, action: null, loading: false });
  const [confirmName, setConfirmName] = useState('');
  const [actionInProgress, setActionInProgress] = useState(false);
  const [stoppingWorkload, setStoppingWorkload] = useState(false);
  const [startingWorkload, setStartingWorkload] = useState(false);

  // Events state
  const [events, setEvents] = useState<WorkloadEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  // Stats state
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Ref for auto-scrolling logs
  const logsContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop =
        logsContainerRef.current.scrollHeight;
    }
  }, []);

  const fetchWorkload = useCallback(
    async (showLoader = true) => {
      if (!client || !id) return;

      try {
        if (showLoader) {
          setLoading(true);
        }
        setError(null);
        const data = await client.getWorkload(id as string);
        setWorkload(data);
      } catch (err) {
        if (err instanceof Error) {
          const errorWithResponse = err as Error & {
            response?: { data?: { errors?: string[] } };
          };
          setError(
            errorWithResponse.response?.data?.errors?.[0] ||
              err.message ||
              'Failed to fetch workload details'
          );
        } else {
          setError('Failed to fetch workload details');
        }
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    [client, id]
  );

  const fetchEvents = useCallback(async () => {
    if (!client || !id) return;

    try {
      setEventsLoading(true);
      const response = await client.listWorkloadEvents(id as string);
      setEvents(
        response.events.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
      );
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setEventsLoading(false);
    }
  }, [client, id]);

  const fetchContainers = useCallback(async () => {
    if (!client || !id || stoppingWorkload || startingWorkload) return;

    try {
      const containerList = await client.listContainers(id as string);
      setContainers(containerList);
      if (containerList.length > 0 && !selectedContainer) {
        const firstContainer = containerList[0];
        const containerName =
          (firstContainer.names && firstContainer.names[0]) ||
          firstContainer.name ||
          `container-${0}`;
        setSelectedContainer(containerName);
      }
    } catch (err) {
      console.error('Failed to fetch containers:', err);
    }
  }, [client, id, selectedContainer, stoppingWorkload, startingWorkload]);

  const fetchSystemLogs = useCallback(async () => {
    if (!client || !id || stoppingWorkload || startingWorkload) return;

    // Don't fetch logs unless status is awaitingCert or running
    if (
      !workload ||
      (workload.status !== 'awaitingCert' && workload.status !== 'running')
    ) {
      setSystemLogs([]);
      return;
    }

    try {
      setSystemLogsLoading(true);
      setLogsError(null);
      const response = await client.getSystemLogs({
        workloadId: id as string,
        tail: tailLogs,
        maxLines: 100,
      });
      setSystemLogs(response.lines);
      // Auto-scroll to bottom after a brief delay to ensure DOM is updated
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      if (err instanceof Error) {
        const errorWithResponse = err as Error & {
          response?: { status?: number };
        };
        // Handle 500 errors gracefully - logs might not be available during transitions
        if (errorWithResponse.response?.status === 500) {
          setLogsError(null);
          setSystemLogs([]);
          // Don't show error for 500s, just show empty logs
        } else {
          setLogsError(err.message);
        }
      } else {
        setLogsError('Failed to fetch system logs');
      }
    } finally {
      setSystemLogsLoading(false);
    }
  }, [
    client,
    id,
    tailLogs,
    scrollToBottom,
    stoppingWorkload,
    startingWorkload,
    workload,
  ]);

  const fetchContainerLogs = useCallback(
    async (containerName: string, stream: 'stdout' | 'stderr') => {
      if (!client || !id) return;

      // Don't fetch logs unless status is running (containers only exist when running)
      if (!workload || workload.status !== 'running') {
        setContainerLogs((prev) => ({
          ...prev,
          [containerName]: {
            ...prev[containerName],
            [stream]: [],
          },
        }));
        return;
      }

      try {
        setContainerLogsLoading((prev) => ({ ...prev, [stream]: true }));
        setLogsError(null);
        const response = await client.getContainerLogs({
          workloadId: id as string,
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
        // Auto-scroll to bottom after a brief delay to ensure DOM is updated
        setTimeout(scrollToBottom, 100);
      } catch (err) {
        if (err instanceof Error) {
          const errorWithResponse = err as Error & {
            response?: { status?: number };
          };
          // Handle 500 errors gracefully
          if (errorWithResponse.response?.status === 500) {
            setLogsError(null);
            setContainerLogs((prev) => ({
              ...prev,
              [containerName]: {
                ...prev[containerName],
                [stream]: [],
              },
            }));
          } else {
            setLogsError(err.message);
          }
        } else {
          setLogsError('Failed to fetch container logs');
        }
      } finally {
        setContainerLogsLoading((prev) => ({ ...prev, [stream]: false }));
      }
    },
    [client, id, tailLogs, scrollToBottom, workload]
  );

  const refreshLogs = useCallback(() => {
    // Don't refresh logs unless status is appropriate
    if (
      !workload ||
      (workload.status !== 'awaitingCert' && workload.status !== 'running')
    ) {
      return;
    }

    if (activeLogsTab === 'system') {
      fetchSystemLogs();
    } else if (selectedContainer && workload.status === 'running') {
      fetchContainerLogs(selectedContainer, activeStreamTab);
    }
  }, [
    activeLogsTab,
    selectedContainer,
    activeStreamTab,
    fetchSystemLogs,
    fetchContainerLogs,
    workload,
  ]);

  const fetchStats = useCallback(async () => {
    if (!client || !id || !workload || workload.status !== 'running') return;

    try {
      setStatsLoading(true);
      setStatsError(null);
      const data = await client.getWorkloadStats(id as string);
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      if (err instanceof Error) {
        setStatsError(err.message);
      } else {
        setStatsError('Failed to fetch system stats');
      }
    } finally {
      setStatsLoading(false);
    }
  }, [client, id, workload]);

  useEffect(() => {
    if (client && id) {
      fetchWorkload();
      fetchEvents();
    } else {
      setLoading(false);
    }
  }, [client, id, fetchWorkload, fetchEvents]);

  // Fetch system logs when workload is in an active state
  useEffect(() => {
    if (
      workload &&
      client &&
      id &&
      !actionInProgress && // Don't fetch during actions
      !stoppingWorkload && // Don't fetch when stopping
      !startingWorkload && // Don't fetch when starting
      (workload.status === 'running' || workload.status === 'awaitingCert')
    ) {
      fetchSystemLogs();
    }
  }, [
    workload,
    client,
    id,
    actionInProgress,
    stoppingWorkload,
    startingWorkload,
    fetchSystemLogs,
  ]);

  // Fetch containers only when workload is running
  useEffect(() => {
    if (
      workload &&
      workload.status === 'running' &&
      client &&
      id &&
      !actionInProgress &&
      !stoppingWorkload &&
      !startingWorkload
    ) {
      fetchContainers();
    }
  }, [
    workload,
    client,
    id,
    actionInProgress,
    stoppingWorkload,
    startingWorkload,
    fetchContainers,
  ]);

  // Fetch stats when workload is running (only on initial load or refresh)
  useEffect(() => {
    if (
      workload &&
      workload.status === 'running' &&
      client &&
      id &&
      !actionInProgress
    ) {
      fetchStats();
    }
  }, [workload, client, id, actionInProgress, fetchStats]);

  // Switch to system logs tab when workload is not running
  useEffect(() => {
    if (
      workload &&
      workload.status !== 'running' &&
      activeLogsTab === 'container'
    ) {
      setActiveLogsTab('system');
    }
  }, [workload, activeLogsTab]);

  // Fetch container logs when selected container or stream changes
  useEffect(() => {
    if (
      selectedContainer &&
      activeLogsTab === 'container' &&
      workload?.status === 'running' &&
      !actionInProgress
    ) {
      fetchContainerLogs(selectedContainer, activeStreamTab);
    }
  }, [
    selectedContainer,
    activeLogsTab,
    activeStreamTab,
    workload?.status,
    actionInProgress,
    fetchContainerLogs,
  ]);

  // Auto-refresh only when workload is starting or scheduled
  useEffect(() => {
    if (
      !client ||
      !id ||
      (workload?.status !== 'starting' && workload?.status !== 'scheduled')
    )
      return;

    // Different intervals for different states
    const refreshInterval = workload?.status === 'scheduled' ? 3000 : 15000;

    const interval = setInterval(() => {
      fetchWorkload(false); // Don't show loader for auto-refresh
      fetchEvents();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [client, id, workload?.status, fetchWorkload, fetchEvents]);

  const executeStartAction = async () => {
    if (!client || !workload) return;

    setActionInProgress(true);
    setStartingWorkload(true); // Block all fetches immediately

    try {
      await client.startWorkload(workload.workloadId);
      // Clear existing data since we're starting
      setSystemLogs([]);
      setContainers([]);
      setContainerLogs({});
      // Wait for backend to update status
      await new Promise((resolve) => setTimeout(resolve, backendBufferTime));
      // Now refresh to show status change
      await fetchWorkload();
      await fetchEvents();
      // Refresh logs after a short delay
      setTimeout(() => {
        fetchSystemLogs();
      }, 1000);
      setActionInProgress(false);
      setStartingWorkload(false);
    } catch (err) {
      setActionInProgress(false);
      setStartingWorkload(false);
      if (err instanceof Error) {
        const errorWithResponse = err as Error & {
          response?: { data?: { errors?: string[] } };
        };
        alert(
          `Failed to start workload: ${
            errorWithResponse.response?.data?.errors?.[0] || err.message
          }`
        );
      } else {
        alert('Failed to start workload');
      }
    }
  };

  const handleAction = async (
    action: 'delete' | 'start' | 'stop' | 'restart'
  ) => {
    if (!client || !workload) return;

    // Start action doesn't need confirmation
    if (action === 'start') {
      await executeStartAction();
    } else {
      setConfirmModal({ isOpen: true, action, loading: false });
      setConfirmName('');
    }
  };

  const executeAction = async () => {
    if (
      !client ||
      !workload ||
      confirmName !== workload.name ||
      !confirmModal.action
    ) {
      return;
    }

    setConfirmModal((prev) => ({ ...prev, loading: true }));
    setActionInProgress(true);

    try {
      switch (confirmModal.action) {
        case 'delete':
          await client.deleteWorkload(workload.workloadId);
          router.push('/workloads');
          break;
        case 'stop':
          setStoppingWorkload(true); // Block all fetches immediately
          await client.stopWorkload(workload.workloadId);
          setConfirmModal({ isOpen: false, action: null, loading: false });
          // Clear logs and containers BEFORE refresh to prevent errors
          setSystemLogs([]);
          setContainers([]);
          setContainerLogs({});
          setLogsError(null);
          // Clear selected container to prevent container logs fetch
          setSelectedContainer('');
          // Wait for backend to update status
          await new Promise((resolve) =>
            setTimeout(resolve, backendBufferTime)
          );
          // Now refresh to show status change
          await fetchWorkload();
          await fetchEvents();
          // Reset flags
          setActionInProgress(false);
          setStoppingWorkload(false);
          break;
        case 'restart':
          setStartingWorkload(true); // Block all fetches immediately
          await client.restartWorkload(workload.workloadId);
          setConfirmModal({ isOpen: false, action: null, loading: false });
          // Clear existing data since we're restarting
          setSystemLogs([]);
          setContainers([]);
          setContainerLogs({});
          // Wait for backend to update status
          await new Promise((resolve) =>
            setTimeout(resolve, backendBufferTime)
          );
          // Now refresh to show status change
          await fetchWorkload();
          await fetchEvents();
          // Refresh logs after a short delay
          setTimeout(() => {
            fetchSystemLogs();
          }, 1000);
          setActionInProgress(false);
          setStartingWorkload(false);
          break;
      }
      if (confirmModal.action === 'delete') {
        setConfirmModal({ isOpen: false, action: null, loading: false });
      }
      setActionInProgress(false);
    } catch (err) {
      setConfirmModal((prev) => ({ ...prev, loading: false }));
      setActionInProgress(false);
      if (err instanceof Error) {
        const errorWithResponse = err as Error & {
          response?: { data?: { errors?: string[] } };
        };
        alert(
          `Failed to ${confirmModal.action} workload: ${
            errorWithResponse.response?.data?.errors?.[0] || err.message
          }`
        );
      } else {
        alert(`Failed to ${confirmModal.action} workload`);
      }
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'running':
        return 'success';
      case 'starting':
      case 'scheduled':
      case 'awaitingCert':
        return 'warning';
      case 'error':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  if (!apiKey) {
    return (
      <div className={components.section}>
        <Alert variant="warning" className="flex items-center">
          <Settings className="h-4 w-4 mr-2" />
          <div>
            <p className="font-medium">API Key Required</p>
            <p className="text-sm mt-1">
              You need to set your API key in settings before you can view
              workload details.
            </p>
            <Link
              href="/settings"
              className="text-sm underline mt-1 inline-block"
            >
              Go to Settings
            </Link>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div className={components.section}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <div>
            <h2 className="text-sm font-bold text-foreground">
              {workload?.name || 'Workload Details'}
            </h2>
            {workload && (
              <p className="text-muted-foreground font-mono text-sm">
                Workload ID: {workload.workloadId}
              </p>
            )}
          </div>
        </div>

        <Button
          variant="secondary"
          onClick={() => fetchWorkload()}
          loading={loading}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="danger">
          <p className="font-medium">Failed to load workload details</p>
          <p className="text-sm mt-1">{error}</p>
        </Alert>
      )}

      {/* Loading State */}
      {loading && !error && (
        <Card>
          <CardContent>
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground mr-3" />
              <span className="text-muted-foreground">
                Loading workload details...
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workload Details */}
      {!loading && !error && workload && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Status and Access */}
              <Card>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-card-foreground">
                      Status
                    </h4>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getStatusVariant(workload.status)}>
                        {workload.status}
                      </Badge>
                      {actionInProgress && (
                        <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-sm text-muted-foreground">
                        Created
                      </label>
                      <div className="flex items-center mt-1">
                        <Calendar className="h-4 w-4 text-muted-foreground mr-2" />
                        <span className="text-sm text-card-foreground">
                          {new Date(workload.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">
                        Last Updated
                      </label>
                      <div className="flex items-center mt-1">
                        <Calendar className="h-4 w-4 text-muted-foreground mr-2" />
                        <span className="text-sm text-card-foreground">
                          {new Date(workload.updatedAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {workload.domain && (
                    <div className="space-y-3">
                      <div>
                        <label className={components.label}>
                          Application URL
                        </label>
                        <div className="flex items-center space-x-2">
                          <code className="flex-1 px-3 py-2 bg-muted border border-border rounded text-sm text-foreground">
                            https://{workload.domain}
                          </code>
                          {workload.status === 'running' && (
                            <a
                              href={`https://${workload.domain}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button size="sm">
                                <ExternalLink className="h-4 w-4 mr-1" />
                                Visit
                              </Button>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {workload.status === 'starting' && (
                    <Alert variant="info" className="mt-4">
                      <div className="flex items-start">
                        <Monitor className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Deployment in Progress</p>
                          <p className="text-sm mt-1">
                            Your workload is being deployed to nilCC. This
                            typically takes 3-6 minutes.
                          </p>
                        </div>
                      </div>
                    </Alert>
                  )}

                  {workload.status === 'awaitingCert' && (
                    <Alert variant="info" className="mt-4">
                      <div className="flex items-start">
                        <Monitor className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Awaiting Certificate</p>
                          <p className="text-sm mt-1">
                            Your workload is waiting for SSL certificate
                            provisioning. This usually completes within a few
                            moments.
                          </p>
                        </div>
                      </div>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Docker Configuration */}
              <Card>
                <CardContent>
                  <h4 className="text-lg font-semibold text-card-foreground mb-4">
                    Docker Configuration
                  </h4>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className={components.label}>Docker Compose</label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(workload.dockerCompose);
                          setCopiedCompose(true);
                          setTimeout(() => setCopiedCompose(false), 2000);
                        }}
                        className="text-xs"
                      >
                        {copiedCompose ? (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                    <pre className="bg-muted border border-border rounded p-4 text-sm overflow-x-auto text-foreground">
                      <code>{workload.dockerCompose}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>

              {/* Environment Variables */}
              {workload.envVars && Object.keys(workload.envVars).length > 0 && (
                <Card>
                  <CardContent>
                    <h4 className="text-lg font-semibold text-card-foreground mb-4">
                      Environment Variables
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(workload.envVars).map(([key, value]) => (
                        <div key={key} className="flex items-center space-x-2">
                          <code className="px-2 py-1 bg-muted text-foreground rounded text-sm font-mono">
                            {key}
                          </code>
                          <span className="text-muted-foreground">=</span>
                          <code className="px-2 py-1 bg-muted text-foreground rounded text-sm font-mono">
                            {value}
                          </code>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Logs Section */}
              <Card>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-card-foreground">
                      Logs
                    </h4>
                    {(workload.status === 'running' ||
                      workload.status === 'awaitingCert') && (
                      <div className="flex items-center space-x-3">
                        <label
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.875rem',
                            margin: 0,
                            marginRight: '0.5rem',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={tailLogs}
                            onChange={(e) => setTailLogs(e.target.checked)}
                            style={{ margin: 0 }}
                          />
                          <span
                            style={{ color: 'var(--nillion-text-secondary)' }}
                          >
                            Tail logs
                          </span>
                        </label>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={refreshLogs}
                          loading={
                            activeLogsTab === 'system'
                              ? systemLogsLoading
                              : containerLogsLoading[activeStreamTab]
                          }
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Refresh
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Logs Tabs */}
                  {(workload.status === 'running' ||
                    workload.status === 'awaitingCert') && (
                    <div
                      style={{
                        borderBottom: '2px solid var(--nillion-border)',
                        marginBottom: '1rem',
                      }}
                    >
                      <nav style={{ display: 'flex', margin: '0 -0.25rem' }}>
                        <button
                          onClick={() => setActiveLogsTab('system')}
                          style={{
                            padding: '0.75rem 1.5rem',
                            marginBottom: '-2px',
                            border: 'none',
                            borderBottom:
                              activeLogsTab === 'system'
                                ? '2px solid var(--nillion-primary)'
                                : '2px solid transparent',
                            backgroundColor:
                              activeLogsTab === 'system'
                                ? 'var(--nillion-bg)'
                                : 'transparent',
                            color:
                              activeLogsTab === 'system'
                                ? 'var(--nillion-primary)'
                                : 'var(--nillion-text-secondary)',
                            fontWeight: '600',
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            transition: 'all 200ms ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                          }}
                        >
                          <FileText style={{ height: '1rem', width: '1rem' }} />
                          System Logs
                        </button>
                        {workload.status === 'running' && (
                          <button
                            onClick={() => setActiveLogsTab('container')}
                            style={{
                              padding: '0.75rem 1.5rem',
                              marginBottom: '-2px',
                              border: 'none',
                              borderBottom:
                                activeLogsTab === 'container'
                                  ? '2px solid var(--nillion-primary)'
                                  : '2px solid transparent',
                              backgroundColor:
                                activeLogsTab === 'container'
                                  ? 'var(--nillion-bg)'
                                  : 'transparent',
                              color:
                                activeLogsTab === 'container'
                                  ? 'var(--nillion-primary)'
                                  : 'var(--nillion-text-secondary)',
                              fontWeight: '600',
                              fontSize: '0.875rem',
                              cursor: 'pointer',
                              transition: 'all 200ms ease',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                            }}
                          >
                            <Terminal
                              style={{ height: '1rem', width: '1rem' }}
                            />
                            Container Logs
                          </button>
                        )}
                      </nav>
                    </div>
                  )}

                  {/* Container Selection */}
                  {activeLogsTab === 'container' &&
                    containers.length > 0 &&
                    workload.status === 'running' && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                          Select Container
                        </label>
                        <select
                          value={selectedContainer}
                          onChange={(e) => setSelectedContainer(e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                        >
                          {containers.map((container, index) => {
                            const containerName =
                              (container.names && container.names[0]) ||
                              container.name ||
                              `container-${index}`;
                            const displayName =
                              (container.names && container.names[0]) ||
                              container.name ||
                              `Container ${index + 1}`;
                            return (
                              <option
                                key={`${containerName}-${index}`}
                                value={containerName}
                              >
                                {displayName} (
                                {container.state ||
                                  container.status ||
                                  'Unknown'}
                                )
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    )}

                  {/* Stream Tabs for Container Logs */}
                  {activeLogsTab === 'container' &&
                    workload.status === 'running' && (
                      <div
                        style={{
                          borderBottom: '2px solid var(--nillion-border)',
                          marginBottom: '1rem',
                        }}
                      >
                        <nav style={{ display: 'flex', margin: '0 -0.25rem' }}>
                          <button
                            onClick={() => setActiveStreamTab('stderr')}
                            style={{
                              padding: '0.5rem 1rem',
                              marginBottom: '-2px',
                              border: 'none',
                              borderBottom:
                                activeStreamTab === 'stderr'
                                  ? '2px solid var(--nillion-primary)'
                                  : '2px solid transparent',
                              backgroundColor:
                                activeStreamTab === 'stderr'
                                  ? 'var(--nillion-bg)'
                                  : 'transparent',
                              color:
                                activeStreamTab === 'stderr'
                                  ? 'var(--nillion-primary)'
                                  : 'var(--nillion-text-secondary)',
                              fontWeight: '600',
                              fontSize: '0.875rem',
                              cursor: 'pointer',
                              transition: 'all 200ms ease',
                              fontFamily: 'monospace',
                            }}
                          >
                            stderr
                          </button>
                          <button
                            onClick={() => setActiveStreamTab('stdout')}
                            style={{
                              padding: '0.5rem 1rem',
                              marginBottom: '-2px',
                              border: 'none',
                              borderBottom:
                                activeStreamTab === 'stdout'
                                  ? '2px solid var(--nillion-primary)'
                                  : '2px solid transparent',
                              backgroundColor:
                                activeStreamTab === 'stdout'
                                  ? 'var(--nillion-bg)'
                                  : 'transparent',
                              color:
                                activeStreamTab === 'stdout'
                                  ? 'var(--nillion-primary)'
                                  : 'var(--nillion-text-secondary)',
                              fontWeight: '600',
                              fontSize: '0.875rem',
                              cursor: 'pointer',
                              transition: 'all 200ms ease',
                              fontFamily: 'monospace',
                            }}
                          >
                            stdout
                          </button>
                        </nav>
                      </div>
                    )}

                  {/* Logs Display */}
                  <div
                    ref={logsContainerRef}
                    className="bg-muted rounded-lg p-4 h-96 overflow-auto font-mono text-sm"
                  >
                    {workload.status !== 'running' &&
                    workload.status !== 'awaitingCert' &&
                    workload.status !== 'starting' &&
                    workload.status !== 'scheduled' ? (
                      <div className="text-muted-foreground flex items-center justify-center h-full">
                        <div className="text-center">
                          <Terminal className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>Logs only appear for active workloads</p>
                          <p className="text-xs mt-1">
                            Start the workload to see logs
                          </p>
                        </div>
                      </div>
                    ) : logsError ? (
                      <div className="text-destructive">Error: {logsError}</div>
                    ) : (activeLogsTab === 'system' && systemLogsLoading) ||
                      (activeLogsTab === 'container' &&
                        containerLogsLoading[activeStreamTab]) ? (
                      <div className="text-muted-foreground flex items-center">
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Loading logs...
                      </div>
                    ) : activeLogsTab === 'system' ? (
                      systemLogs.length > 0 ? (
                        <div className="space-y-1">
                          {systemLogs.map((line, index) => (
                            <div
                              key={index}
                              className="text-foreground whitespace-pre-wrap break-words"
                            >
                              {line}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-muted-foreground">
                          {workload.status === 'starting' ||
                          workload.status === 'scheduled'
                            ? 'Logs will be available once deployment completes...'
                            : 'No logs available'}
                        </div>
                      )
                    ) : selectedContainer &&
                      containerLogs[selectedContainer] &&
                      containerLogs[selectedContainer][activeStreamTab] ? (
                      containerLogs[selectedContainer][activeStreamTab].length >
                      0 ? (
                        <div className="space-y-1">
                          {containerLogs[selectedContainer][
                            activeStreamTab
                          ].map((line, index) => (
                            <div
                              key={index}
                              className="text-foreground whitespace-pre-wrap break-words"
                            >
                              {line}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-muted-foreground">
                          No {activeStreamTab} logs available
                        </div>
                      )
                    ) : (
                      <div className="text-muted-foreground">
                        {selectedContainer
                          ? `No ${activeStreamTab} logs available`
                          : 'Select a container to view logs'}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Actions */}
              <Card>
                <CardContent>
                  <h4 className="text-lg font-semibold text-card-foreground mb-4">
                    Actions
                  </h4>
                  <div className="space-y-2">
                    {workload.status != 'stopped' && (
                      <>
                        <Button
                          variant="secondary"
                          onClick={() => handleAction('stop')}
                          className="w-full"
                        >
                          <Square className="h-4 w-4 mr-2" />
                          Stop Workload
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => handleAction('restart')}
                          className="w-full"
                        >
                          <RotateCw className="h-4 w-4 mr-2" />
                          Restart Workload
                        </Button>
                      </>
                    )}
                    {workload.status === 'stopped' && (
                      <Button
                        variant="primary"
                        onClick={() => handleAction('start')}
                        className="w-full"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start Workload
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      onClick={() => handleAction('delete')}
                      className="w-full"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Workload
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Resource Allocation */}
              <Card>
                <CardContent>
                  <h4 className="text-lg font-semibold text-card-foreground mb-4">
                    Resource Allocation
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <MemoryStick className="h-4 w-4 text-muted-foreground mr-2" />
                      <span className="text-sm text-muted-foreground">
                        Memory:
                      </span>
                      <span className="text-sm font-medium text-card-foreground ml-auto">
                        {workload.memory} MB
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Cpu className="h-4 w-4 text-muted-foreground mr-2" />
                      <span className="text-sm text-muted-foreground">
                        CPUs:
                      </span>
                      <span className="text-sm font-medium text-card-foreground ml-auto">
                        {workload.cpus}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <HardDrive className="h-4 w-4 text-muted-foreground mr-2" />
                      <span className="text-sm text-muted-foreground">
                        Storage:
                      </span>
                      <span className="text-sm font-medium text-card-foreground ml-auto">
                        {workload.disk} GB
                      </span>
                    </div>
                    {workload.gpus > 0 && (
                      <div className="flex items-center">
                        <Monitor className="h-4 w-4 text-muted-foreground mr-2" />
                        <span className="text-sm text-muted-foreground">
                          GPUs:
                        </span>
                        <span className="text-sm font-medium text-card-foreground ml-auto">
                          {workload.gpus}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <CreditCard className="h-4 w-4 text-muted-foreground mr-2" />
                      <span className="text-sm text-muted-foreground">
                        Cost:
                      </span>
                      <span className="text-sm font-medium text-card-foreground ml-auto">
                        {workload.creditRate ?? 0} credit
                        {(workload.creditRate ?? 0) !== 1 ? 's' : ''}/min
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* System Stats */}
              {workload.status === 'running' && (
                <WorkloadStats
                  stats={stats}
                  loading={statsLoading}
                  error={statsError}
                />
              )}

              {/* Events */}
              <Card>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-card-foreground flex items-center">
                      <Activity className="h-4 w-4 mr-2" />
                      Events
                    </h4>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={fetchEvents}
                      loading={eventsLoading}
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {events.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No events yet
                      </p>
                    ) : (
                      events.map((event) => (
                        <div
                          key={event.eventId}
                          className="text-sm border-b border-border pb-2 last:border-0"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium capitalize">
                              {event.details.kind === 'failedToStart'
                                ? 'Failed to Start'
                                : event.details.kind}
                            </span>
                            <time className="text-xs text-muted-foreground">
                              {new Date(event.timestamp).toLocaleTimeString()}
                            </time>
                          </div>
                          {event.details.kind === 'failedToStart' && (
                            <p className="text-xs text-destructive mt-1">
                              {event.details.error}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Confirmation Modal */}
          <Modal
            isOpen={confirmModal.isOpen}
            onClose={() => {
              setConfirmModal({ isOpen: false, action: null, loading: false });
              setConfirmName('');
            }}
            title={`Confirm ${confirmModal.action
              ?.charAt(0)
              .toUpperCase()}${confirmModal.action?.slice(1)}`}
          >
            <div className="space-y-4">
              <p className="font-medium">
                Are you sure you want to {confirmModal.action} this workload?
              </p>
              {confirmModal.action === 'delete' && (
                <p className="text-sm mt-1">This action cannot be undone.</p>
              )}

              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Type{' '}
                  <span className="font-mono font-semibold bg-secondary text-primary">
                    {workload.name}
                  </span>{' '}
                  to confirm:
                </p>
                <Input
                  type="text"
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                  placeholder="Enter workload name"
                  className="w-full"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setConfirmModal({
                      isOpen: false,
                      action: null,
                      loading: false,
                    });
                    setConfirmName('');
                  }}
                  disabled={confirmModal.loading}
                >
                  Cancel
                </Button>
                <Button
                  variant={
                    confirmModal.action === 'delete' ? 'danger' : 'primary'
                  }
                  onClick={executeAction}
                  disabled={
                    confirmName !== workload.name || confirmModal.loading
                  }
                  loading={confirmModal.loading}
                >
                  {confirmModal.action?.charAt(0).toUpperCase()}
                  {confirmModal.action?.slice(1)}
                </Button>
              </div>
            </div>
          </Modal>
        </>
      )}
    </div>
  );
}
