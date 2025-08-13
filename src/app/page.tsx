'use client';

import Link from 'next/link';
import { useSettings } from '@/contexts/SettingsContext';

export default function Home() {
  const { apiKey } = useSettings();

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          nilCC Workload Manager
        </h1>
      </div>

      {/* API Key Status */}
      {!apiKey ? (
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-6">
          <div>
            <h3 className="text-lg font-medium text-gray-800">Setup Required</h3>
            <p className="text-gray-700">
              You need to configure your API key to start managing workloads.
            </p>
            <Link
              href="/settings"
              className="inline-flex items-center mt-2 text-gray-800 hover:text-gray-900 underline"
            >
              Go to Settings
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-300 rounded-lg p-6">
          <div>
            <p className="text-gray-700">
              Your API key is configured. You can now manage workloads.
            </p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/workloads"
          className="group rounded-lg border border-gray-200 p-6 hover:border-gray-300 transition-colors"
        >
          <h3 className="text-lg font-semibold text-gray-900">View Workloads</h3>
          <p className="text-gray-600">
            See all your running and scheduled workloads
          </p>
        </Link>

        <Link
          href="/workloads/create"
          className="group rounded-lg border border-gray-200 p-6 hover:border-gray-300 transition-colors"
        >
          <h3 className="text-lg font-semibold text-gray-900">Create Workload</h3>
          <p className="text-gray-600">
            Deploy a new Docker container securely
          </p>
        </Link>
      </div>
    </div>
  );
}
