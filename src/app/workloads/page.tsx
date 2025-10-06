'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSettings } from '@/contexts/SettingsContext';
import { Card, CardContent, Button, Alert } from '@/components/ui';
import { components } from '@/styles/design-system';
import { WorkloadResponse } from '@/lib/nilcc-types';
import {
  Layers,
  Plus,
  RefreshCw,
  Settings,
  Eye,
} from 'lucide-react';

export default function WorkloadsPage() {
  const { client, apiKey } = useSettings();
  const [workloads, setWorkloads] = useState<WorkloadResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkloads = useCallback(async () => {
    if (!client) return;

    try {
      setLoading(true);
      const data = await client.listWorkloads();
      setWorkloads(data);
    } catch (err) {
      console.error('Failed to fetch workloads:', err);
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


  if (!apiKey) {
    return (
      <div className={components.section}>
        <Alert variant="warning" className="flex items-center">
          <Settings className="h-4 w-4 mr-2" />
          <div>
            <p className="font-medium">API Key Required</p>
            <p className="text-sm mt-1">
              You need to set your API key in settings before you can view
              workloads.
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
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center mb-2">
            <Layers className="h-6 w-6 text-foreground mr-3" />
            <h1 className="text-2xl font-bold text-foreground">Workloads</h1>
          </div>
          <p className="text-muted-foreground">
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

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent>
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground mr-3" />
              <span className="text-muted-foreground">
                Loading workloads...
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && workloads.length === 0 && (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-card-foreground mb-2">
                No workloads found
              </h3>
              <p className="text-muted-foreground mb-6">
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
      {!loading && workloads.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workloads.map((workload) => (
            <Card
              key={workload.workloadId}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-card-foreground truncate">
                      {workload.name}
                    </h4>
                    <p className="text-sm text-muted-foreground truncate">
                      {workload.workloadId}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      workload.status === 'running'
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-primary text-primary bg-transparent'
                    }`}
                  >
                    {workload.status.toUpperCase()}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                  <p>
                    <span className="font-medium">Created:</span>{' '}
                    {new Date(workload.createdAt).toLocaleDateString()}
                  </p>
                  <p>
                    <span className="font-medium">Artifact Version:</span>{' '}
                    {workload.artifactsVersion || 'Default'}
                  </p>
                </div>

                <div className="flex items-center justify-end space-x-2">
                  <Link href={`/workloads/${workload.workloadId}`}>
                    <Button variant="secondary">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
