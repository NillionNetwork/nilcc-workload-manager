'use client';

import { useState, useEffect, useCallback } from 'react';
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
  WorkloadEvent,
  SystemStats,
} from '@/lib/nilcc-types';
import WorkloadStats from '@/components/WorkloadStats';
import DockerComposeHash from '@/components/DockerComposeHash';
import LogsSection from '@/components/LogsSection';
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
  Copy,
  Check,
  CreditCard,
  RotateCw,
  Activity,
  Loader2,
  Eye,
  EyeOff,
  Package,
} from 'lucide-react';

type WorkloadStatus = WorkloadResponse['status'];

const STATUS_VARIANTS: Record<WorkloadStatus, 'success' | 'warning' | 'danger' | 'neutral'> =
  {
    running: 'success',
    starting: 'warning',
    scheduled: 'warning',
    awaitingCert: 'warning',
    error: 'danger',
    stopped: 'neutral',
  };

const AUTO_REFRESH_STATUSES = new Set<WorkloadStatus>([
  'starting',
  'scheduled',
  'awaitingCert',
]);
const FAST_REFRESH_STATUSES = new Set<WorkloadStatus>(['scheduled', 'awaitingCert']);
const LOADING_SPINNER_STATUSES = new Set<WorkloadStatus>(['starting', 'awaitingCert']);
const TAILABLE_STATUSES = new Set<WorkloadStatus>(['running', 'awaitingCert']);

const STATUS_ALERTS: Partial<
  Record<
    WorkloadStatus,
    {
      title: string;
      message: string;
    }
  >
> = {
  starting: {
    title: 'Deployment in Progress',
    message: 'Your workload is being deployed to nilCC. This typically takes 3-6 minutes.',
  },
  awaitingCert: {
    title: 'Awaiting Certificate',
    message:
      'Your workload is waiting for SSL certificate provisioning. This usually completes within a few moments.',
  },
};

export default function WorkloadDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { client, apiKey } = useSettings();
  const [workload, setWorkload] = useState<WorkloadResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Buffer time to allow backend to update status after actions
  const backendBufferTime = 3000; // 3 seconds

  // Logs state
  const [tailLogs, setTailLogs] = useState(true);
  const [copiedCompose, setCopiedCompose] = useState(false);
  const [showEnvValues, setShowEnvValues] = useState(false);

  // Action state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    action: 'delete' | 'restart' | null;
    loading: boolean;
  }>({ isOpen: false, action: null, loading: false });
  const [confirmName, setConfirmName] = useState('');
  const [actionInProgress, setActionInProgress] = useState(false);
  const [startingWorkload, setStartingWorkload] = useState(false);

  // Events state
  const [events, setEvents] = useState<WorkloadEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  // Stats state
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const status = workload?.status;
  const isRunning = status === 'running';
  const statusBadgeVariant = status ? STATUS_VARIANTS[status] : 'neutral';
  const showStatusSpinner = status ? LOADING_SPINNER_STATUSES.has(status) : false;
  const showTailLogsToggle = status ? TAILABLE_STATUSES.has(status) : false;
  const statusAlert = status ? STATUS_ALERTS[status] : undefined;
  const shouldAutoRefresh = status ? AUTO_REFRESH_STATUSES.has(status) : false;
  const refreshDelay = status && FAST_REFRESH_STATUSES.has(status) ? 3000 : 15000;
  const shouldHideLogs =
    startingWorkload ||
    actionInProgress ||
    confirmModal.action === 'delete' ||
    confirmModal.action === 'restart';
  const shouldLoadStats = Boolean(client && id && isRunning && !actionInProgress);

  const fetchWorkload = useCallback(
    async (showLoader = true) => {
      if (!client || !id) return;

      try {
        if (showLoader) {
          setLoading(true);
        }
        const data = await client.getWorkload(id as string);
        setWorkload(data);
      } catch (err) {
        console.error('Failed to fetch workload details:', err);
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

  const fetchStats = useCallback(async () => {
    if (!client || !id || !workload || workload.status !== 'running') return;

    try {
      setStatsLoading(true);
      const data = await client.getWorkloadStats(id as string);
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
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

  // Fetch stats when workload is running (only on initial load or refresh)
  useEffect(() => {
    if (shouldLoadStats) {
      fetchStats();
    }
  }, [shouldLoadStats, fetchStats]);

  // Auto-refresh only when workload is starting, scheduled, or awaitingCert
  useEffect(() => {
    if (!client || !id || !shouldAutoRefresh) {
      return;
    }

    const interval = setInterval(() => {
      fetchWorkload(false); // Don't show loader for auto-refresh
      fetchEvents();
    }, refreshDelay);

    return () => clearInterval(interval);
  }, [client, id, shouldAutoRefresh, refreshDelay, fetchWorkload, fetchEvents]);

  const handleAction = async (action: 'delete' | 'restart') => {
    if (!client || !workload) return;

    setConfirmModal({ isOpen: true, action, loading: false });
    setConfirmName('');
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

          setConfirmModal({ isOpen: false, action: null, loading: false });
          router.push('/workloads');
          break;
        case 'restart':
          setStartingWorkload(true); // Block all fetches immediately
          await client.restartWorkload(workload.workloadId);
          setConfirmModal({ isOpen: false, action: null, loading: false });
          // Wait for backend to update status
          await new Promise((resolve) =>
            setTimeout(resolve, backendBufferTime)
          );
          // Now refresh to show status change
          await fetchWorkload();
          await fetchEvents();
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
      console.error(`Failed to ${confirmModal.action} workload:`, err);
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

      {/* Loading State */}
      {loading && (
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
      {!loading && workload && (
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
                      <Badge variant={statusBadgeVariant}>
                        <span className="flex items-center gap-1">
                          {showStatusSpinner && (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          )}
                          {workload.status}
                        </span>
                      </Badge>
                      {actionInProgress && (
                        <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-4 gap-4 mb-4">
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

                    {workload.publicContainerName && (
                      <div>
                        <label className="text-sm text-muted-foreground">
                          Public Container
                        </label>
                        <div className="flex items-center mt-1">
                          <span className="text-sm text-card-foreground">
                            <code className="flex-1 px-1 py-1 bg-muted border border-border rounded text-sm text-foreground">
                              {workload.publicContainerName}
                            </code>
                          </span>
                        </div>
                      </div>
                    )}
                    {workload.publicContainerPort && (
                      <div>
                        <label className="text-sm text-muted-foreground">
                          Public Port
                        </label>
                        <div className="flex items-center mt-1">
                          <span className="text-sm text-card-foreground">
                            <code className="flex-1 px-1 py-1 bg-muted border border-border rounded text-sm text-foreground">
                              {workload.publicContainerPort}
                            </code>
                          </span>
                        </div>
                      </div>
                    )}
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
                        </div>

                        {workload.status === 'running' && (
                          <div className="my-3">
                            <a
                              href={`https://${workload.domain}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button size="sm" className="mr-3">
                                <ExternalLink className="h-4 w-4 mr-1" />
                                Visit Application
                              </Button>
                            </a>
                            <a
                              href={`https://${workload.domain}/nilcc/api/v2/report`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button size="sm" className="mr-3">
                                <ExternalLink className="h-4 w-4 mr-1" />
                                Attestation Report
                              </Button>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {statusAlert && (
                    <Alert variant="info" className="mt-4">
                      <div className="flex items-start">
                        <Monitor className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">{statusAlert.title}</p>
                          <p className="text-sm mt-1">{statusAlert.message}</p>
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
                    <DockerComposeHash
                      dockerCompose={workload.dockerCompose}
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Environment Variables */}
              {workload.envVars && Object.keys(workload.envVars).length > 0 && (
                <Card>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-card-foreground">
                        Environment Variables
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowEnvValues(!showEnvValues)}
                        className="text-xs"
                      >
                        {showEnvValues ? (
                          <>
                            <EyeOff className="h-3 w-3 mr-1" />
                            Hide Values
                          </>
                        ) : (
                          <>
                            <Eye className="h-3 w-3 mr-1" />
                            Show Values
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {Object.entries(workload.envVars).map(([key, value]) => (
                        <div key={key} className="flex items-center space-x-2">
                          <code className="px-2 py-1 bg-muted text-foreground rounded text-sm font-mono">
                            {key}
                          </code>
                          <span className="text-muted-foreground">=</span>
                          <code className="px-2 py-1 bg-muted text-foreground rounded text-sm font-mono">
                            {showEnvValues ? value : '••••••••'}
                          </code>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Files Section */}
              {workload.files && Object.keys(workload.files).length > 0 && (
                <Card>
                  <CardContent>
                    <h4 className="text-lg font-semibold text-card-foreground mb-4">
                      Mounted Files
                    </h4>
                    <div className="space-y-3">
                      {Object.entries(workload.files).map(([path, content]) => (
                        <div
                          key={path}
                          className="border border-border rounded-md p-3"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <code className="text-sm font-mono text-foreground">
                                {path}
                              </code>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {Math.ceil((content.length * 0.75) / 1024)}KB
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <p>
                              Mounted at:{' '}
                              <code className="text-xs bg-muted px-1 rounded">
                                $FILES/{path}
                              </code>
                            </p>
                            <p className="mt-1">
                              Use in docker-compose:{' '}
                              <code className="text-xs bg-muted px-1 rounded">
                                - $FILES/{path}:/path/in/container
                              </code>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Logs Section - Hide when restarting, or during delete action */}
              {!shouldHideLogs && (
                <Card>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-card-foreground">
                        Logs
                      </h4>
                      {showTailLogsToggle && (
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={tailLogs}
                            onChange={(e) => setTailLogs(e.target.checked)}
                          />
                          <span className="text-muted-foreground">
                            Tail logs
                          </span>
                        </label>
                      )}
                    </div>

                    <LogsSection
                      workload={workload}
                      client={client}
                      actionInProgress={actionInProgress}
                      startingWorkload={startingWorkload}
                      tailLogs={tailLogs}
                    />
                  </CardContent>
                </Card>
              )}
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
                    <>
                      <Button
                        variant="secondary"
                        onClick={() => handleAction('restart')}
                        className="w-full"
                      >
                        <RotateCw className="h-4 w-4 mr-2" />
                        Restart Workload
                      </Button>
                    </>

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
                    <div className="flex items-center">
                      <Package className="h-4 w-4 text-muted-foreground mr-2" />
                      <span className="text-sm text-muted-foreground">
                        Artifact Version:
                      </span>
                      <span className="text-sm font-medium text-card-foreground ml-auto">
                        {workload.artifactsVersion || 'Default'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* System Stats */}
              {isRunning && (
                <WorkloadStats
                  stats={stats}
                  loading={statsLoading}
                  error={null}
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
