'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSettings } from '@/contexts/SettingsContext';
import { Card, CardContent, Button, Badge, Alert } from '@/components/ui';
import { components } from '@/styles/design-system';
import { WorkloadResponse } from '@/lib/nilcc-types';
import { Layers, Plus, ExternalLink, RefreshCw, Settings, Eye } from 'lucide-react';

export default function WorkloadsPage() {
  const { client, apiKey } = useSettings();
  const [workloads, setWorkloads] = useState<WorkloadResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkloads = useCallback(async () => {
    if (!client) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await client.listWorkloads();
      setWorkloads(data);
    } catch (err) {
      if (err instanceof Error) {
        const errorWithResponse = err as Error & { response?: { data?: { errors?: string[] } } };
        setError(errorWithResponse.response?.data?.errors?.[0] || err.message || 'Failed to fetch workloads');
      } else {
        setError('Failed to fetch workloads');
      }
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    if (client) {
      fetchWorkloads();
    } else {
      setLoading(false);
    }
  }, [client, fetchWorkloads]);

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
              You need to set your API key in settings before you can view workloads.
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
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center mb-2">
            <Layers className="h-6 w-6 text-gray-900 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">Workloads</h1>
          </div>
          <p className="text-gray-600">
            Manage your nilCC container deployments
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            onClick={fetchWorkloads}
            loading={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Link href="/workloads/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Workload
            </Button>
          </Link>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="danger">
          <p className="font-medium">Failed to load workloads</p>
          <p className="text-sm mt-1">{error}</p>
        </Alert>
      )}

      {/* Loading State */}
      {loading && !error && (
        <Card>
          <CardContent>
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400 mr-3" />
              <span className="text-gray-600">Loading workloads...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && workloads.length === 0 && (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <Layers className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No workloads found</h3>
              <p className="text-gray-600 mb-6">
                Get started by creating your first secure workload
              </p>
              <Link href="/workloads/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Workload
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workloads Grid */}
      {!loading && !error && workloads.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workloads.map((workload) => (
            <Card key={workload.id} className="hover:shadow-md transition-shadow">
              <CardContent>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {workload.name}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">
                      {workload.id}
                    </p>
                  </div>
                  <Badge variant={getStatusVariant(workload.status)}>
                    {workload.status}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <p>
                    <span className="font-medium">Created:</span>{' '}
                    {new Date(workload.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <Link href={`/workloads/${workload.id}`} className="flex-1">
                    <Button variant="secondary" className="w-full">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </Link>
                  
                  {workload.domain && workload.status === 'running' && (
                    <a
                      href={`https://${workload.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}