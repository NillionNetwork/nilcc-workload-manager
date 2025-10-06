"use client";

import { useState, useEffect } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { Card, CardContent, Button, Input, Alert } from "@/components/ui";
import { components } from "@/styles/design-system";
import {
  Settings,
  Eye,
  EyeOff,
  Trash2,
  Check,
  CreditCard,
  User,
  Calendar,
  RefreshCw,
  DollarSign,
} from "lucide-react";
import { Account, WorkloadResponse } from "@/lib/nilcc-types";
import Link from "next/link";

export default function SettingsPage() {
  const { apiKey, apiBaseUrl, setApiKey, setApiBaseUrl, clearApiKey, client } =
    useSettings();
  const [newApiKey, setNewApiKey] = useState("");
  const [newApiBaseUrl, setNewApiBaseUrl] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);
  const [accountLoading, setAccountLoading] = useState(false);
  const [workloads, setWorkloads] = useState<WorkloadResponse[]>([]);
  const [workloadsLoading, setWorkloadsLoading] = useState(false);

  const handleSave = () => {
    let hasChanges = false;

    if (newApiKey.trim()) {
      setApiKey(newApiKey.trim());
      setNewApiKey("");
      hasChanges = true;
    }

    if (newApiBaseUrl.trim() && newApiBaseUrl.trim() !== apiBaseUrl) {
      // Remove trailing slash if present
      const cleanedUrl = newApiBaseUrl.trim().replace(/\/$/, '');
      setApiBaseUrl(cleanedUrl);
      setNewApiBaseUrl("");
      hasChanges = true;
    }

    if (hasChanges) {
      setShowSuccess(true);
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  const handleClear = () => {
    clearApiKey();
    setNewApiKey("");
    setNewApiBaseUrl("");
  };

  const maskedApiKey = apiKey
    ? `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`
    : "";

  // Fetch account data when component mounts and API key is available
  useEffect(() => {
    const loadAccount = async () => {
      if (!client || !apiKey) return;

      setAccountLoading(true);

      try {
        const accountData = await client.getAccount();
        setAccount(accountData);
      } catch (error) {
        console.error("Failed to fetch account:", error);
      } finally {
        setAccountLoading(false);
      }
    };

    loadAccount();
  }, [client, apiKey]);

  // Fetch workloads for credit usage history
  useEffect(() => {
    const loadWorkloads = async () => {
      if (!client || !apiKey || !account?.accountId) return;

      setWorkloadsLoading(true);
      try {
        const workloadData = await client.listWorkloads();
        setWorkloads(workloadData);
      } catch (error) {
        console.error("Failed to fetch workloads:", error);
      } finally {
        setWorkloadsLoading(false);
      }
    };

    loadWorkloads();
  }, [client, apiKey, account?.accountId]);

  const fetchAccount = async () => {
    if (!client) return;

    setAccountLoading(true);

    try {
      const accountData = await client.getAccount();
      setAccount(accountData);
    } catch (error) {
      console.error("Failed to fetch account:", error);
    } finally {
      setAccountLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Calculate credit usage statistics
  const calculateCreditStats = () => {
    if (!workloads.length) return null;

    // Note: This is an estimate based on current running workloads
    // Actual historical usage would require event history or billing data
    let currentActiveCreditsPerMin = 0;

    workloads.forEach((workload) => {
      // Current active credits per minute
      if (workload.status === "running") {
        currentActiveCreditsPerMin += workload.creditRate;
      }
    });

    // Estimate based on current rate
    const estimatedDailyUsage = currentActiveCreditsPerMin * 60 * 24;
    const estimatedWeeklyUsage = estimatedDailyUsage * 7;
    const estimatedMonthlyUsage = estimatedDailyUsage * 30;

    return {
      currentActiveCreditsPerMin,
      estimatedDailyUsage: Math.floor(estimatedDailyUsage),
      estimatedWeeklyUsage: Math.floor(estimatedWeeklyUsage),
      estimatedMonthlyUsage: Math.floor(estimatedMonthlyUsage),
      hasRunningWorkloads: currentActiveCreditsPerMin > 0,
    };
  };

  const creditStats = calculateCreditStats();

  return (
    <div className={components.section}>
      {/* Header */}
      <div>
        <div className="flex items-center mb-1">
          <Settings className="h-5 w-5 text-foreground mr-2" />
          <h1 className="text-med font-semibold text-foreground">Settings</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Configure your NilCC API key to manage workloads
        </p>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <Alert variant="success" className="flex items-center">
          <Check className="h-4 w-4 mr-2" />
          API key saved successfully!
        </Alert>
      )}

      {/* API Key Configuration */}
      <Card>
        <CardContent className="py-1">
          <h4 className="text-sm font-medium text-card-foreground mb-3">
            API Key Configuration
          </h4>

          {/* Current API Key Status */}
          {apiKey && (
            <div className="mb-3 p-4 bg-accent border border-border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-accent-foreground">
                    Current API Key
                  </p>
                  <p className="text-muted-foreground font-mono text-xs">
                    {showApiKey ? apiKey : maskedApiKey}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button variant="danger" size="sm" onClick={handleClear}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Set/Update API Key */}
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">
                {apiKey ? "Update API Key" : "Enter API Key"}
              </label>
              <Input
                type="password"
                value={newApiKey}
                onChange={(e) => setNewApiKey(e.target.value)}
                placeholder="Your NilCC API key"
                className="font-mono h-8 text-sm mt-0.5"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground">
                API Base URL
              </label>
              <Input
                type="url"
                value={newApiBaseUrl || apiBaseUrl}
                onChange={(e) => setNewApiBaseUrl(e.target.value)}
                placeholder={apiBaseUrl}
                className="font-mono h-8 text-sm mt-0.5"
              />
              <p className="text-xs text-muted-foreground mt-1">
                The base URL for the NilCC API
              </p>
            </div>

            <Button
              size="sm"
              onClick={handleSave}
              disabled={
                !newApiKey.trim() &&
                (!newApiBaseUrl.trim() || newApiBaseUrl.trim() === apiBaseUrl)
              }
              className="h-8 text-sm"
            >
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Information */}
      {apiKey && account?.accountId && (
        <Card>
          <CardContent className="py-1">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-card-foreground">
                Account and Credits
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchAccount}
                loading={accountLoading}
                disabled={accountLoading}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {accountLoading && !account ? (
              <div className="text-muted-foreground text-center py-4">
                <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-1" />
                <p className="text-xs">Loading account information...</p>
              </div>
            ) : account ? (
              <div className="space-y-3">
                {/* Account Details */}
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <div className="flex items-center">
                    <User className="h-3 w-3 mr-1.5 text-muted-foreground" />
                    <span className="text-muted-foreground mr-1">Name:</span>
                    <span className="font-medium">{account.name}</span>
                  </div>
                  <span className="text-muted-foreground">•</span>
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1.5 text-muted-foreground" />
                    <span className="text-muted-foreground mr-1">Created:</span>
                    <span>{formatDate(account.createdAt)}</span>
                  </div>
                  <span className="text-muted-foreground">•</span>
                  <div className="flex items-center">
                    <span className="text-muted-foreground mr-1">ID:</span>
                    <span className="font-mono">{account.accountId}</span>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Enhanced Credit Balance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-4">
              <div className="p-4 bg-accent border border-border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <CreditCard className="h-4 w-4 text-muted-foreground mr-2" />
                    <span className="text-sm font-medium">
                      Available Credits
                    </span>
                  </div>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {account?.credits.toLocaleString()}
                </div>
                {creditStats && creditStats.currentActiveCreditsPerMin > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Using {creditStats.currentActiveCreditsPerMin} credits/min
                  </p>
                )}
              </div>

              <div className="p-4 bg-muted/50 border border-border rounded-lg">
                <div className="flex items-center mb-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground mr-2" />
                  <span className="text-sm font-medium">Estimated Monthly</span>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {creditStats?.estimatedMonthlyUsage.toLocaleString() || "0"}
                </div>
                {creditStats && creditStats.hasRunningWorkloads && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Based on current usage rate
                  </p>
                )}
              </div>
            </div>

            {/* Usage Estimates */}
            <div className="mb-3">
              <h5 className="text-xs font-medium text-muted-foreground mb-2">
                Estimated Usage (Based on Current Rate)
              </h5>
              {workloadsLoading ? (
                <div className="text-muted-foreground text-center py-2">
                  <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-1" />
                  <p className="text-xs">Loading usage data...</p>
                </div>
              ) : creditStats && creditStats.hasRunningWorkloads ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Per day</span>
                    <span className="font-medium">
                      {creditStats.estimatedDailyUsage.toLocaleString()} credits
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Per week</span>
                    <span className="font-medium">
                      {creditStats.estimatedWeeklyUsage.toLocaleString()}{" "}
                      credits
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Per month</span>
                    <span className="font-medium">
                      {creditStats.estimatedMonthlyUsage.toLocaleString()}{" "}
                      credits
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No active workloads
                </p>
              )}
            </div>

            {/* Active Workloads Summary */}
            {workloads.length > 0 && (
              <div className="border-t border-border pt-3">
                <h5 className="text-xs font-medium text-muted-foreground mb-2">
                  Active Workloads
                </h5>
                <div className="space-y-1">
                  {workloads
                    .filter((w) => w.status === "running")
                    .slice(0, 5)
                    .map((workload) => (
                      <div
                        key={workload.workloadId}
                        className="flex items-center justify-between text-xs"
                      >
                        <Link
                          href={`/workloads/${workload.workloadId}`}
                          className="font-mono truncate max-w-[200px] hover:text-primary transition-colors"
                        >
                          {workload.name}
                        </Link>
                        <span className="text-muted-foreground">
                          {workload.creditRate} credits/min
                        </span>
                      </div>
                    ))}
                  {workloads.filter((w) => w.status === "running").length ===
                    0 && (
                    <p className="text-xs text-muted-foreground">
                      No active workloads
                    </p>
                  )}
                  {workloads.filter((w) => w.status === "running").length >
                    5 && (
                    <Link
                      href="/workloads"
                      className="text-xs text-primary hover:underline inline-block mt-1"
                    >
                      View all{" "}
                      {workloads.filter((w) => w.status === "running").length}{" "}
                      active workloads →
                    </Link>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
