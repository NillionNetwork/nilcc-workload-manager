'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSettings } from '@/contexts/SettingsContext';
import {
  Card,
  CardContent,
  Button,
  Input,
  Textarea,
  Alert,
} from '@/components/ui';
import { Plus, Settings } from 'lucide-react';
import { CreateWorkloadRequest, WorkloadTier } from '@/lib/nilcc-types';

export default function CreateWorkloadPage() {
  const router = useRouter();
  const { client, apiKey } = useSettings();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableServices, setAvailableServices] = useState<string[]>([]);

  // Tier state
  const [tiers, setTiers] = useState<WorkloadTier[]>([]);
  const [selectedTierId, setSelectedTierId] = useState<string>('');
  const [loadingTiers, setLoadingTiers] = useState(true);
  const [tiersError, setTiersError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [imageType, setImageType] = useState<'public' | 'private'>('public');

  // Public image fields
  const [dockerImage, setDockerImage] = useState('');
  const [containerPort, setContainerPort] = useState('80');
  const [serviceName, setServiceName] = useState('api');

  // Private image fields
  const [dockerCompose, setDockerCompose] = useState(`services:
  web:
    image: caddy:2
    command: |
      caddy respond --listen :8080 --body '{"hello":"world"}' --header "Content-Type: application/json"`);
  const [serviceToExpose, setServiceToExpose] = useState('web');
  const [servicePortToExpose, setServicePortToExpose] = useState('8080');

  // Environment variables
  const [envVars, setEnvVars] = useState<{ key: string; value: string }[]>([]);

  // Get selected tier details
  const selectedTier = tiers.find((t) => t.id === selectedTierId);

  // Fetch available tiers on mount
  useEffect(() => {
    if (client && apiKey) {
      setLoadingTiers(true);
      client
        .listWorkloadTiers()
        .then((fetchedTiers) => {
          setTiers(fetchedTiers);
          // Auto-select if only one tier
          if (fetchedTiers.length === 1) {
            setSelectedTierId(fetchedTiers[0].id);
          }
          setTiersError(null);
        })
        .catch((err) => {
          console.error('Failed to fetch tiers:', err);
          setTiersError('Failed to load available tiers. Please try again.');
        })
        .finally(() => {
          setLoadingTiers(false);
        });
    }
  }, [client, apiKey]);

  // Validation
  const validateDockerImage = (image: string): string | null => {
    if (!image) return null;

    // Must contain a colon for tag
    if (!image.includes(':')) {
      return 'Docker image must include a tag (e.g., nginx:latest, node:18, redis:alpine)';
    }

    // Basic format validation
    const parts = image.split(':');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      return 'Invalid Docker image format. Use: image:tag';
    }

    return null;
  };

  const dockerImageError =
    imageType === 'public' ? validateDockerImage(dockerImage) : null;

  // Parse Docker Compose to extract service names
  const parseDockerCompose = (yaml: string): string[] => {
    try {
      // Basic YAML parsing for services
      const lines = yaml.split('\n');
      const services: string[] = [];
      let inServices = false;
      let currentIndent = -1;

      for (const line of lines) {
        const trimmed = line.trim();
        const indent = line.length - line.trimStart().length;

        // Check if we're in the services section
        if (trimmed === 'services:') {
          inServices = true;
          currentIndent = indent;
          continue;
        }

        // If we're in services and at the right indentation level
        if (inServices && indent === currentIndent + 2) {
          const match = trimmed.match(/^([a-zA-Z0-9_-]+):/);
          if (match) {
            services.push(match[1]);
          }
        }

        // Exit services section if we're back at the root level
        if (inServices && indent <= currentIndent && trimmed !== '') {
          inServices = false;
        }
      }

      return services;
    } catch {
      return [];
    }
  };

  // Update available services when Docker Compose changes
  useEffect(() => {
    if (imageType === 'private' && dockerCompose) {
      const services = parseDockerCompose(dockerCompose);
      setAvailableServices(services);

      // Auto-select first service if current selection is invalid
      if (services.length > 0 && !services.includes(serviceToExpose)) {
        setServiceToExpose(services[0]);
      }
    }
  }, [dockerCompose, imageType, serviceToExpose]);

  // Generate compose preview for public images
  const generateComposePreview = (): string => {
    if (imageType !== 'public' || !dockerImage) return '';

    const service = serviceName || 'api';

    let compose = `services:\n  ${service}:\n    image: ${dockerImage}`;

    // Only add expose if port is not 80
    if (containerPort !== '80') {
      compose += `\n    expose:\n      - "${containerPort}"`;
    }

    if (envVars.length > 0) {
      const validEnvVars = envVars.filter(
        ({ key, value }) => key.trim() && value.trim()
      );
      if (validEnvVars.length > 0) {
        compose += '\n    environment:';
        validEnvVars.forEach(({ key, value }) => {
          compose += `\n      - ${key.trim()}=${value.trim()}`;
        });
      }
    }

    return compose;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !selectedTier) return;

    // Validate Docker image
    if (dockerImageError) {
      setError(dockerImageError);
      return;
    }

    try {
      setCreating(true);
      setError(null);

      // Convert env vars to object
      const envVarsObject: { [key: string]: string } = {};
      envVars.forEach(({ key, value }) => {
        if (key.trim() && value.trim()) {
          envVarsObject[key.trim()] = value.trim();
        }
      });

      const baseData = {
        name,
        memory: selectedTier.memoryMb,
        cpus: selectedTier.cpus,
        disk: selectedTier.diskGb,
        gpus: selectedTier.gpus,
        envVars:
          Object.keys(envVarsObject).length > 0 ? envVarsObject : undefined,
      };

      const workloadData =
        imageType === 'public'
          ? {
              ...baseData,
              dockerImage,
              containerPort: parseInt(containerPort),
              serviceName,
            }
          : {
              ...baseData,
              dockerCompose,
              serviceToExpose,
              servicePortToExpose: parseInt(servicePortToExpose),
            };

      const response = await client.createWorkload(
        workloadData as CreateWorkloadRequest
      );
      router.push(`/workloads/${response.workloadId}`);
    } catch (err) {
      if (err instanceof Error) {
        const errorWithResponse = err as Error & {
          response?: { data?: { errors?: string[] } };
        };
        setError(
          errorWithResponse.response?.data?.errors?.[0] ||
            err.message ||
            'Failed to create workload'
        );
      } else {
        setError('Failed to create workload');
      }
    } finally {
      setCreating(false);
    }
  };

  const addEnvVar = () => {
    setEnvVars([...envVars, { key: '', value: '' }]);
  };

  const removeEnvVar = (index: number) => {
    setEnvVars(envVars.filter((_, i) => i !== index));
  };

  const updateEnvVar = (
    index: number,
    field: 'key' | 'value',
    value: string
  ) => {
    const updated = [...envVars];
    updated[index][field] = value;
    setEnvVars(updated);
  };

  if (!apiKey) {
    return (
      <div style={{ marginBottom: '1.5rem' }}>
        <Alert variant="warning" className="flex items-center">
          <Settings className="h-4 w-4 mr-2" />
          <div>
            <p className="font-medium">API Key Required</p>
            <p className="text-sm mt-1">
              You need to set your API key in settings before you can create
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
    <div style={{ marginBottom: '1rem' }}>
      {/* Header */}
      <div className="mb-2">
        <h2 className="text-lg font-semibold text-foreground">
          Create New Workload
        </h2>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="danger">
          <p className="font-medium">Failed to create workload</p>
          <p className="text-sm mt-1">{error}</p>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-2">
        {/* Combined Basic Info and Tier Selection */}
        <Card>
          <CardContent className="py-1">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Left Column - Basic Info */}
              <div>
                <h4 className="text-xs font-medium text-card-foreground mb-1">
                  Basic Information
                </h4>
                <label className="text-xs text-muted-foreground block">
                  Workload Name
                </label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="my-secure-app"
                  required
                  className="h-8 text-sm mt-0.5"
                />
              </div>

              {/* Right Column - Tier Selection */}
              <div>
                <h4 className="text-xs font-medium text-card-foreground mb-1">
                  Resource Tier
                </h4>
                <label
                  className="text-xs text-muted-foreground block"
                  style={{ marginBottom: '14px' }}
                >
                  Select tier to set CPU, Memory, Disk & Cost
                </label>
                {loadingTiers && (
                  <p className="text-muted-foreground text-xs mt-0.5">
                    Loading tiers...
                  </p>
                )}
                {!loadingTiers && !tiersError && tiers.length > 0 && (
                  <div className="mt-0.5">
                    {/* Always show as radio buttons for consistency */}
                    {tiers.map((tier) => (
                      <label
                        key={tier.id}
                        className={`block p-1.5 border rounded-md cursor-pointer transition-all text-xs ${
                          selectedTierId === tier.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="tier"
                          value={tier.id}
                          checked={selectedTierId === tier.id}
                          onChange={() => setSelectedTierId(tier.id)}
                          className="sr-only"
                        />
                        <div>
                          <p className="font-medium">{tier.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {tier.cpus} CPU • {tier.memoryMb}MB RAM •{' '}
                            {tier.diskGb}GB Disk • {tier.cost} credit/min
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
                {!loadingTiers && !tiersError && tiers.length === 0 && (
                  <Alert variant="warning" className="py-1 px-2 mt-0.5">
                    <p className="text-xs">No tiers available</p>
                  </Alert>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Docker Configuration */}
        <Card>
          <CardContent className="py-2">
            <h4 className="text-xs font-medium text-card-foreground mb-1">
              Docker Configuration
            </h4>

            {/* Image Type Selection - Compact */}
            <div className="flex gap-3 mb-2">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="imageType"
                  value="public"
                  checked={imageType === 'public'}
                  onChange={() => setImageType('public')}
                  className="h-3 w-3"
                />
                <span className="text-xs">Docker Image</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="imageType"
                  value="private"
                  checked={imageType === 'private'}
                  onChange={() => setImageType('private')}
                  className="h-3 w-3"
                />
                <span className="text-xs">Docker Compose</span>
              </label>
            </div>

            {/* Public Image Configuration */}
            {imageType === 'public' && (
              <div className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground">
                      Docker Image *
                    </label>
                    <Input
                      type="text"
                      value={dockerImage}
                      onChange={(e) => setDockerImage(e.target.value)}
                      placeholder="nginx:latest"
                      required
                      className="h-7 text-xs mt-0.5"
                      style={
                        dockerImageError
                          ? { borderColor: 'var(--nillion-destructive)' }
                          : {}
                      }
                    />
                    {dockerImageError && (
                      <p className="text-xs text-destructive mt-0.5">
                        Must include tag
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">
                      Container Port
                    </label>
                    <Input
                      type="number"
                      value={containerPort}
                      onChange={(e) => setContainerPort(e.target.value)}
                      placeholder="80"
                      min="1"
                      max="65535"
                      required
                      className="h-7 text-xs mt-0.5"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">
                      Service Name
                    </label>
                    <Input
                      type="text"
                      value={serviceName}
                      onChange={(e) => setServiceName(e.target.value)}
                      placeholder="api"
                      required
                      className="h-7 text-xs mt-0.5"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Docker Compose Configuration */}
            {imageType === 'private' && (
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-muted-foreground">
                    Docker Compose YAML *
                  </label>
                  <Textarea
                    value={dockerCompose}
                    onChange={(e) => setDockerCompose(e.target.value)}
                    placeholder="Enter your Docker Compose YAML..."
                    rows={5}
                    className="mt-0.5 resize-none"
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '0.7rem',
                      lineHeight: '1.2',
                    }}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground">
                      Service to Expose
                    </label>
                    {availableServices.length > 0 ? (
                      <select
                        value={serviceToExpose}
                        onChange={(e) => setServiceToExpose(e.target.value)}
                        required
                        className="w-full px-2 border border-input bg-background rounded-md"
                      >
                        <option value="">Select a service</option>
                        {availableServices.map((service) => (
                          <option key={service} value={service}>
                            {service}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        type="text"
                        value={serviceToExpose}
                        onChange={(e) => setServiceToExpose(e.target.value)}
                        placeholder="Enter service name"
                        required
                        className="h-7 text-xs mt-0.5"
                      />
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">
                      Port to Expose *
                    </label>
                    <Input
                      type="number"
                      value={servicePortToExpose}
                      onChange={(e) => setServicePortToExpose(e.target.value)}
                      placeholder="80"
                      required
                      min="1"
                      max="65535"
                      className="h-7 text-xs mt-0.5"
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Environment Variables */}
        <Card>
          <CardContent className="py-2">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-xs font-medium text-card-foreground">
                Environment Variables (Optional)
              </h4>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addEnvVar}
                className="h-6 text-xs px-2"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            {envVars.length === 0 ? (
              <p className="text-muted-foreground text-xs">
                No environment variables
              </p>
            ) : (
              <div className="space-y-1">
                {envVars.map((envVar, index) => (
                  <div key={index} className="flex gap-1.5 items-center">
                    <Input
                      type="text"
                      value={envVar.key}
                      onChange={(e) =>
                        updateEnvVar(index, 'key', e.target.value)
                      }
                      placeholder="KEY"
                      className="h-6 font-mono text-xs px-2"
                    />
                    <span className="text-muted-foreground text-xs">=</span>
                    <Input
                      type="text"
                      value={envVar.value}
                      onChange={(e) =>
                        updateEnvVar(index, 'value', e.target.value)
                      }
                      placeholder="value"
                      className="h-6 font-mono text-xs px-2"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEnvVar(index)}
                      className="h-6 px-1.5 text-xs text-destructive hover:text-destructive"
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <Link href="/workloads">
            <Button variant="ghost" size="sm" className="h-7 text-xs">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            loading={creating}
            disabled={
              !name ||
              !selectedTierId ||
              loadingTiers ||
              (imageType === 'public'
                ? !dockerImage || !!dockerImageError
                : !dockerCompose)
            }
          >
            <Plus className="h-3 w-3 mr-1" />
            Create Workload
          </Button>
        </div>
      </form>
    </div>
  );
}
