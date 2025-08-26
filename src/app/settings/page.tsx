'use client';

import { useState, useEffect } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { Card, CardContent, Button, Input, Alert } from '@/components/ui';
import { components } from '@/styles/design-system';
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
} from 'lucide-react';
import { Account } from '@/lib/nilcc-types';

export default function SettingsPage() {
  const { apiKey, apiBaseUrl, setApiKey, setApiBaseUrl, clearApiKey, client } =
    useSettings();
  const [newApiKey, setNewApiKey] = useState('');
  const [newApiBaseUrl, setNewApiBaseUrl] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);

  const handleSave = () => {
    let hasChanges = false;

    if (newApiKey.trim()) {
      setApiKey(newApiKey.trim());
      setNewApiKey('');
      hasChanges = true;
    }

    if (newApiBaseUrl.trim() && newApiBaseUrl.trim() !== apiBaseUrl) {
      setApiBaseUrl(newApiBaseUrl.trim());
      setNewApiBaseUrl('');
      hasChanges = true;
    }

    if (hasChanges) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const handleClear = () => {
    clearApiKey();
    setNewApiKey('');
    setNewApiBaseUrl('');
  };

  const maskedApiKey = apiKey
    ? `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`
    : '';

  // Fetch account data when component mounts and API key is available
  useEffect(() => {
    const loadAccount = async () => {
      if (!client || !apiKey) return;

      setAccountLoading(true);
      setAccountError(null);

      try {
        const accountData = await client.getAccount();
        setAccount(accountData);
      } catch (error) {
        console.error('Failed to fetch account:', error);
        // Don't show error message, just fail silently
        // This handles invalid API keys gracefully
        setAccountError('Unable to fetch account information');
      } finally {
        setAccountLoading(false);
      }
    };

    loadAccount();
  }, [client, apiKey]);

  const fetchAccount = async () => {
    if (!client) return;

    setAccountLoading(true);
    setAccountError(null);

    try {
      const accountData = await client.getAccount();
      setAccount(accountData);
    } catch (error) {
      console.error('Failed to fetch account:', error);
      // Don't show error message, just fail silently
      // This handles invalid API keys gracefully
      setAccountError('Unable to fetch account information');
    } finally {
      setAccountLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

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
                {apiKey ? 'Update API Key' : 'Enter API Key'}
              </label>
              <Input
                type="password"
                value={newApiKey}
                onChange={(e) => setNewApiKey(e.target.value)}
                placeholder="Enter your NilCC API key"
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
                The base URL for the NilCC API (defaults to sandbox environment)
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
      {apiKey && !accountError && (
        <Card>
          <CardContent className="py-1">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-card-foreground">
                Account Information
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
                {/* Credits */}
                <div className="p-4 bg-accent border border-border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CreditCard className="h-4 w-4 text-muted-foreground mr-2" />
                      <span className="text-sm font-medium">
                        Credits Remaining
                      </span>
                    </div>
                    <span className="text-xl font-bold text-foreground">
                      {account.credits.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
