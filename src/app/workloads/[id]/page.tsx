'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSettings } from '@/contexts/SettingsContext';
import { Card, CardContent, Button, Badge, Alert } from '@/components/ui';
import { components } from '@/styles/design-system';
import { WorkloadResponse } from '@/lib/nilcc-types';
import { 
  ExternalLink, 
  Trash2, 
  RefreshCw, 
  Settings, 
  Calendar,
  Cpu,
  HardDrive,
  MemoryStick,
  Monitor
} from 'lucide-react';

export default function WorkloadDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { client, apiKey } = useSettings();
  const [workload, setWorkload] = useState<WorkloadResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchWorkload = useCallback(async (showLoader = true) => {
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
        const errorWithResponse = err as Error & { response?: { data?: { errors?: string[] } } };
        setError(errorWithResponse.response?.data?.errors?.[0] || err.message || 'Failed to fetch workload details');
      } else {
        setError('Failed to fetch workload details');
      }
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }, [client, id]);

  useEffect(() => {
    if (client && id) {
      fetchWorkload();
    } else {
      setLoading(false);
    }
  }, [client, id, fetchWorkload]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!client || !id) return;

    const interval = setInterval(() => {
      fetchWorkload(false); // Don't show loader for auto-refresh
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [client, id, fetchWorkload]);

  const handleDelete = async () => {
    if (!client || !workload || !confirm(`Are you sure you want to delete "${workload.name}"?`)) return;

    try {
      setDeleting(true);
      await client.deleteWorkload(workload.id);
      router.push('/workloads');
    } catch (err) {
      if (err instanceof Error) {
        const errorWithResponse = err as Error & { response?: { data?: { errors?: string[] } } };
        alert(`Failed to delete workload: ${errorWithResponse.response?.data?.errors?.[0] || err.message}`);
      } else {
        alert('Failed to delete workload');
      }
      setDeleting(false);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'running': return 'success';
      case 'starting': case 'scheduled': return 'warning';
      case 'error': return 'danger';
      default: return 'neutral';
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
              You need to set your API key in settings before you can view workload details.
            </p>
            <Link href="/settings" className="text-sm underline mt-1 inline-block">
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {workload?.name || 'Workload Details'}
            </h1>
            {workload && (
              <p className="text-muted-foreground font-mono text-sm">{workload.id}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            onClick={() => fetchWorkload()}
            loading={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {workload && (
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={deleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
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
              <span className="text-muted-foreground">Loading workload details...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workload Details */}
      {!loading && !error && workload && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status and Access */}
            <Card>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-card-foreground">Status & Access</h2>
                  <Badge variant={getStatusVariant(workload.status)}>
                    {workload.status}
                  </Badge>
                </div>
                
                {workload.domain && (
                  <div className="space-y-3">
                    <div>
                      <label className={components.label}>Application URL</label>
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
                          Your workload is being deployed to nilCC. This typically takes 3-6 minutes.
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
                <h2 className="text-lg font-semibold text-card-foreground mb-4">Docker Configuration</h2>
                <div>
                  <label className={components.label}>Docker Compose</label>
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
                  <h2 className="text-lg font-semibold text-card-foreground mb-4">Environment Variables</h2>
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
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Resource Allocation */}
            <Card>
              <CardContent>
                <h2 className="text-lg font-semibold text-card-foreground mb-4">Resources</h2>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <MemoryStick className="h-4 w-4 text-muted-foreground mr-2" />
                    <span className="text-sm text-muted-foreground">Memory:</span>
                    <span className="text-sm font-medium text-card-foreground ml-auto">
                      {workload.memory} MB
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Cpu className="h-4 w-4 text-muted-foreground mr-2" />
                    <span className="text-sm text-muted-foreground">CPUs:</span>
                    <span className="text-sm font-medium text-card-foreground ml-auto">
                      {workload.cpus}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <HardDrive className="h-4 w-4 text-muted-foreground mr-2" />
                    <span className="text-sm text-muted-foreground">Storage:</span>
                    <span className="text-sm font-medium text-card-foreground ml-auto">
                      {workload.disk} GB
                    </span>
                  </div>
                  {workload.gpus > 0 && (
                    <div className="flex items-center">
                      <Monitor className="h-4 w-4 text-muted-foreground mr-2" />
                      <span className="text-sm text-muted-foreground">GPUs:</span>
                      <span className="text-sm font-medium text-card-foreground ml-auto">
                        {workload.gpus}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card>
              <CardContent>
                <h2 className="text-lg font-semibold text-card-foreground mb-4">Metadata</h2>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-muted-foreground">Created</label>
                    <div className="flex items-center mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground mr-2" />
                      <span className="text-sm text-card-foreground">
                        {new Date(workload.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Last Updated</label>
                    <div className="flex items-center mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground mr-2" />
                      <span className="text-sm text-card-foreground">
                        {new Date(workload.updatedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  {workload.description && (
                    <div>
                      <label className="text-sm text-muted-foreground">Description</label>
                      <p className="text-sm text-card-foreground mt-1">{workload.description}</p>
                    </div>
                  )}
                  {workload.tags && workload.tags.length > 0 && (
                    <div>
                      <label className="text-sm text-muted-foreground">Tags</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {workload.tags.map((tag, index) => (
                          <Badge key={index} variant="neutral">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}