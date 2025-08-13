'use client';

import { useState } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { Card, CardContent, Button, Input, Alert } from '@/components/ui';
import { components } from '@/styles/design-system';
import { Settings, Eye, EyeOff, Trash2, Check } from 'lucide-react';

export default function SettingsPage() {
  const { apiKey, apiBaseUrl, setApiKey, setApiBaseUrl, clearApiKey } = useSettings();
  const [newApiKey, setNewApiKey] = useState('');
  const [newApiBaseUrl, setNewApiBaseUrl] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

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

  const maskedApiKey = apiKey ? `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}` : '';

  return (
    <div className={components.section}>
      {/* Header */}
      <div>
        <div className="flex items-center mb-4">
          <Settings className="h-6 w-6 text-gray-900 mr-3" />
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        </div>
        <p className="text-gray-600">
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
        <CardContent>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">API Key Configuration</h2>
          
          {/* Current API Key Status */}
          {apiKey && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-green-800">Current API Key</p>
                  <p className="text-green-700 font-mono text-sm">
                    {showApiKey ? apiKey : maskedApiKey}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleClear}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Set/Update API Key */}
          <div className="space-y-4">
            <div>
              <label className={components.label}>
                {apiKey ? 'Update API Key' : 'Enter API Key'}
              </label>
              <Input
                type="password"
                value={newApiKey}
                onChange={(e) => setNewApiKey(e.target.value)}
                placeholder="Enter your NilCC API key"
                className="font-mono"
              />
            </div>

            <div>
              <label className={components.label}>
                API Base URL
              </label>
              <Input
                type="url"
                value={newApiBaseUrl || apiBaseUrl}
                onChange={(e) => setNewApiBaseUrl(e.target.value)}
                placeholder={apiBaseUrl}
                className="font-mono"
              />
              <p className={components.helperText}>
                The base URL for the NilCC API (defaults to sandbox environment)
              </p>
            </div>

            <Button
              onClick={handleSave}
              disabled={!newApiKey.trim() && (!newApiBaseUrl.trim() || newApiBaseUrl.trim() === apiBaseUrl)}
            >
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}