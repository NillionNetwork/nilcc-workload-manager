"use client";

import Link from "next/link";
import { useSettings } from "@/contexts/SettingsContext";

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
      {!apiKey && (
        <div className="bg-muted border border-border rounded-lg p-6">
          <div>
            <h3 className="text-lg font-medium text-foreground">
              Setup Required
            </h3>
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
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/workloads"
          style={{
            display: "block",
            padding: "1.5rem",
            border: "1px solid var(--nillion-border)",
            borderRadius: "0.5rem",
            backgroundColor: "var(--nillion-bg-secondary)",
            textDecoration: "none",
            transition: "all 200ms ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--nillion-primary)";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--nillion-border)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <h3
            style={{
              fontSize: "1.125rem",
              fontWeight: "600",
              color: "var(--nillion-text)",
              marginBottom: "0.5rem",
              textDecoration: "none",
            }}
          >
            View Workloads
          </h3>
          <p
            style={{
              color: "var(--nillion-text-secondary)",
              textDecoration: "none",
            }}
          >
            See all your running and scheduled workloads
          </p>
        </Link>

        <Link
          href="/workloads/create"
          style={{
            display: "block",
            padding: "1.5rem",
            border: "1px solid var(--nillion-border)",
            borderRadius: "0.5rem",
            backgroundColor: "var(--nillion-bg-secondary)",
            textDecoration: "none",
            transition: "all 200ms ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--nillion-primary)";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--nillion-border)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <h3
            style={{
              fontSize: "1.125rem",
              fontWeight: "600",
              color: "var(--nillion-text)",
              marginBottom: "0.5rem",
              textDecoration: "none",
            }}
          >
            Create Workload
          </h3>
          <p
            style={{
              color: "var(--nillion-text-secondary)",
              textDecoration: "none",
            }}
          >
            Deploy a new Docker container in nilCC
          </p>
        </Link>
      </div>
    </div>
  );
}
