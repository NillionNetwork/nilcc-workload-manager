'use client';

import Link from 'next/link';
import { useSettings } from '@/contexts/SettingsContext';

export default function Home() {
  const { apiKey } = useSettings();

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          nilCC Workload Manager
        </h1>
      </div>

      {/* API Key Status */}
      {!apiKey ? (
        <div className="bg-muted border border-border rounded-lg p-6">
          <div>
            <h3 className="text-lg font-medium text-foreground">Setup Required</h3>
            <p className="text-muted-foreground">
              You need to configure your API key to start managing workloads.
            </p>
            <Link
              href="/settings"
              className="inline-flex items-center mt-2 text-foreground hover:text-primary underline"
            >
              Go to Settings
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-accent border border-border rounded-lg p-6">
          <div>
            <p className="text-accent-foreground">
              Your API key is configured. You can now manage workloads.
            </p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/workloads"
          className="group rounded-lg border border-border bg-card p-6 hover:bg-accent transition-colors"
        >
          <h3 className="text-lg font-semibold text-card-foreground">View Workloads</h3>
          <p className="text-muted-foreground">
            See all your running and scheduled workloads
          </p>
        </Link>

        <Link
          href="/workloads/create"
          className="group rounded-lg border border-border bg-card p-6 hover:bg-accent transition-colors"
        >
          <h3 className="text-lg font-semibold text-card-foreground">Create Workload</h3>
          <p className="text-muted-foreground">
            Deploy a new Docker container securely
          </p>
        </Link>
      </div>
    </div>
  );
}
