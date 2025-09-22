'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSettings } from '@/contexts/SettingsContext';
import { useError } from '@/contexts/ErrorContext';
import {
  Card,
  CardContent,
  Button,
  Input,
  Textarea,
  Alert,
} from '@/components/ui';
import { Plus, Settings, ChevronDown, ChevronRight } from 'lucide-react';
import {
  CreateWorkloadRequest,
  WorkloadTier,
  DockerCredential,
  Artifact,
} from '@/lib/nilcc-types';
import DockerComposeHash from '@/components/DockerComposeHash';

export default function CreateWorkloadPage() {
  const router = useRouter();
  const { client, apiKey } = useSettings();
  const { addError } = useError();
  const [creating, setCreating] = useState(false);
  const [availableServices, setAvailableServices] = useState<string[]>([]);

  // Tier state
  const [tiers, setTiers] = useState<WorkloadTier[]>([]);
  const [selectedTierId, setSelectedTierId] = useState<string>('');
  const [loadingTiers, setLoadingTiers] = useState(true);

  // Artifact state
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [selectedArtifactVersion, setSelectedArtifactVersion] =
    useState<string>('');
  const [loadingArtifacts, setLoadingArtifacts] = useState(true);

  // Form state
  const [name, setName] = useState('');
  const [imageType, setImageType] = useState<'public' | 'private'>('private');

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

  // Docker Registry Credentials
  const [dockerCredentials, setDockerCredentials] = useState<
    DockerCredential[]
  >([]);

  // Files - using Map for better performance with many files
  const [uploadedFiles, setUploadedFiles] = useState<Map<string, string>>(
    new Map()
  );
  const [filenameSanitized, setFilenameSanitized] = useState(false);

  // Docker Compose Hash visibility
  const [showDockerHash, setShowDockerHash] = useState(false);


  // Get selected tier details
  const selectedTier = tiers.find((t) => t.tierId === selectedTierId);

  // Fetch available tiers on mount
  useEffect(() => {
    if (client && apiKey) {
      setLoadingTiers(true);
      client
        .listWorkloadTiers()
        .then((fetchedTiers) => {
          setTiers(fetchedTiers);
          // Auto-select first tier if available
          if (fetchedTiers.length > 0) {
            setSelectedTierId(fetchedTiers[0].tierId);
          }
        })
        .catch((err) => {
          console.error('Failed to fetch tiers:', err);
          if (err instanceof Error) {
            const errorWithResponse = err as Error & {
              response?: {
                data?: { errors?: string[]; error?: string };
                status?: number;
              };
            };
            const errorMessage =
              errorWithResponse.response?.data?.error ||
              errorWithResponse.response?.data?.errors?.[0] ||
              err.message ||
              'Failed to load available tiers';
            addError(
              `Failed to load workload tiers: ${errorMessage}`,
              errorWithResponse.response?.status
            );
          } else {
            addError('Failed to load available workload tiers');
          }
        })
        .finally(() => {
          setLoadingTiers(false);
        });
    }
  }, [client, apiKey, addError]);

  // Fetch available artifacts on mount
  useEffect(() => {
    if (client && apiKey) {
      setLoadingArtifacts(true);
      client
        .listArtifacts()
        .then((fetchedArtifacts) => {
          setArtifacts(fetchedArtifacts);
          // Default to first artifact (latest) if available
          if (fetchedArtifacts.length > 0) {
            setSelectedArtifactVersion(fetchedArtifacts[0].version);
          }
        })
        .catch((err) => {
          console.error('Failed to fetch artifacts:', err);
          if (err instanceof Error) {
            const errorWithResponse = err as Error & {
              response?: {
                data?: { errors?: string[]; error?: string };
                status?: number;
              };
            };
            const errorMessage =
              errorWithResponse.response?.data?.error ||
              errorWithResponse.response?.data?.errors?.[0] ||
              err.message ||
              'Failed to load available artifacts';
            addError(
              `Failed to load artifacts: ${errorMessage}`,
              errorWithResponse.response?.status
            );
          } else {
            addError('Failed to load available artifacts');
          }
        })
        .finally(() => {
          setLoadingArtifacts(false);
        });
    }
  }, [client, apiKey, addError]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !selectedTier) return;

    // Validate Docker image
    if (dockerImageError) {
      addError(dockerImageError);
      return;
    }

    try {
      setCreating(true);

      // Convert env vars to object
      const envVarsObject: { [key: string]: string } = {};
      envVars.forEach(({ key, value }) => {
        if (key.trim() && value.trim()) {
          envVarsObject[key.trim()] = value.trim();
        }
      });

      // Convert files Map to object
      const filesObject: { [key: string]: string } = {};
      uploadedFiles.forEach((content, path) => {
        filesObject[path] = content;
      });

      const baseData = {
        name,
        memory: selectedTier.memoryMb,
        cpus: selectedTier.cpus,
        disk: selectedTier.diskGb,
        gpus: selectedTier.gpus,
        artifactsVersion: selectedArtifactVersion || undefined,
        envVars:
          Object.keys(envVarsObject).length > 0 ? envVarsObject : undefined,
        files: Object.keys(filesObject).length > 0 ? filesObject : undefined,
        dockerCredentials:
          dockerCredentials.length > 0 ? dockerCredentials : undefined,
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
          response?: {
            data?: { errors?: string[]; error?: string };
            status?: number;
          };
        };

        // Try to extract error from different possible structures
        let errorMessage = 'Failed to create workload';

        if (errorWithResponse.response?.data?.error) {
          errorMessage = errorWithResponse.response.data.error;
        } else if (errorWithResponse.response?.data?.errors?.[0]) {
          errorMessage = errorWithResponse.response.data.errors[0];
        } else if (err.message) {
          errorMessage = err.message;
        }

        addError(
          `Failed to create workload: ${errorMessage}`,
          errorWithResponse.response?.status
        );
      } else {
        addError('Failed to create workload');
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

  // Docker Credentials functions
  const addDockerCredential = () => {
    setDockerCredentials([
      ...dockerCredentials,
      { server: '', username: '', password: '' },
    ]);
  };

  const removeDockerCredential = (index: number) => {
    setDockerCredentials(dockerCredentials.filter((_, i) => i !== index));
  };

  const updateDockerCredential = (
    index: number,
    field: 'server' | 'username' | 'password',
    value: string
  ) => {
    const updated = [...dockerCredentials];
    updated[index][field] = value;
    setDockerCredentials(updated);
  };

  // File handling functions
  const removeFile = (path: string) => {
    const newFiles = new Map(uploadedFiles);
    newFiles.delete(path);
    setUploadedFiles(newFiles);

    // Clear sanitization warning if no files left
    if (newFiles.size === 0) {
      setFilenameSanitized(false);
    }
  };

  const sanitizeFilePath = (path: string): string => {
    // Replace spaces with underscores and remove any characters not matching the pattern
    return path.replace(/\s+/g, '_').replace(/[^\w\/._-]/g, '');
  };

  const handleFileSelect = async (fileList: FileList) => {
    const newFiles = new Map(uploadedFiles);
    let anySanitized = false;

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const originalPath = file.webkitRelativePath || file.name;
      const path = sanitizeFilePath(originalPath);

      // Track if any filename was changed
      if (path !== originalPath) {
        anySanitized = true;
        console.log(`Filename sanitized: "${originalPath}" → "${path}"`);
      }

      // Read file as base64
      const base64Content = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target?.result as string;
          resolve(base64.split(',')[1]); // Remove data URL prefix
        };
        reader.readAsDataURL(file);
      });

      newFiles.set(path, base64Content);
    }

    setUploadedFiles(newFiles);
    setFilenameSanitized(anySanitized);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const items = e.dataTransfer.items;
    const fileList: File[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) fileList.push(file);
      }
    }

    if (fileList.length > 0) {
      // Create a DataTransfer object to properly convert File[] to FileList
      const dataTransfer = new DataTransfer();
      fileList.forEach((file) => dataTransfer.items.add(file));
      handleFileSelect(dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
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

      <form onSubmit={handleSubmit} className="space-y-2">
        {/* Basic Info, Resource Tier, and Artifact Selection */}
        <Card className="my-4">
          <CardContent className="">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[1fr_2fr_1fr] gap-4">
              {/* Basic Information */}
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
                  placeholder="my-private-workload"
                  required
                  className="h-8 text-sm mt-0.5"
                />
              </div>

              {/* Resource Tier */}
              <div>
                <h4 className="text-xs font-medium text-card-foreground mb-1">
                  Resource Tier
                </h4>
                <label className="text-xs text-muted-foreground block mb-2">
                  Select tier to set CPU, Memory, Disk & Cost
                </label>
                {loadingTiers && (
                  <p className="text-muted-foreground text-xs mt-0.5">
                    Loading tiers...
                  </p>
                )}
                {!loadingTiers && tiers.length > 0 && (
                  <select
                    value={selectedTierId}
                    onChange={(e) => setSelectedTierId(e.target.value)}
                    className="w-full p-2 text-xs border border-border rounded-md bg-background"
                    required
                  >
                    {tiers.map((tier) => (
                      <option key={tier.tierId} value={tier.tierId}>
                        {tier.name} - {tier.cpus} CPU • {tier.memoryMb}MB RAM •{' '}
                        {tier.diskGb}GB Disk • {tier.cost} credit/min
                      </option>
                    ))}
                  </select>
                )}
                {!loadingTiers && tiers.length === 0 && (
                  <Alert variant="warning" className="px-2 mt-0.5">
                    <p className="text-xs">No tiers available</p>
                  </Alert>
                )}
              </div>

              {/* Artifact Version Selection */}
              <div>
                <h4 className="text-xs font-medium text-card-foreground mb-1">
                  Artifact Version
                </h4>
                <label className="text-xs text-muted-foreground block mb-2">
                  Select the VM image version
                </label>
                {loadingArtifacts && (
                  <p className="text-muted-foreground text-xs mt-0.5">
                    Loading artifact versions...
                  </p>
                )}
                {!loadingArtifacts && artifacts.length > 0 && (
                  <select
                    value={selectedArtifactVersion}
                    onChange={(e) => setSelectedArtifactVersion(e.target.value)}
                    className="w-full p-2 text-xs border border-border rounded-md bg-background"
                  >
                    {artifacts.map((artifact) => (
                      <option key={artifact.version} value={artifact.version}>
                        {artifact.version} (Built:{' '}
                        {new Date(artifact.builtAt).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                )}
                {!loadingArtifacts && artifacts.length === 0 && (
                  <Alert variant="warning" className="px-2 mt-0.5">
                    <p className="text-xs">
                      No artifact versions available. Using default.
                    </p>
                  </Alert>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Docker Configuration */}
        <Card className="my-4">
          <CardContent>
            <h4 className="text-xs font-medium text-card-foreground mb-1">
              Docker Configuration
            </h4>

            {/* Image Type Selection - Compact */}
            <div className="flex gap-3 mb-2">
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

                {dockerCompose && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => setShowDockerHash(!showDockerHash)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                    >
                      {showDockerHash ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                      Show Docker Compose Hash
                    </button>
                    {showDockerHash && (
                      <DockerComposeHash
                        dockerCompose={dockerCompose}
                        className="mt-2"
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Docker Registry Credentials */}
        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-xs font-medium text-card-foreground">
                Docker Registry Credentials (Optional)
              </h4>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addDockerCredential}
                className="h-6 text-xs px-2"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            {dockerCredentials.length === 0 ? (
              <p className="text-muted-foreground text-xs">
                No registry credentials
              </p>
            ) : (
              <div className="space-y-2">
                {dockerCredentials.map((cred, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex gap-1.5 items-center">
                      <Input
                        type="text"
                        value={cred.server}
                        onChange={(e) =>
                          updateDockerCredential(
                            index,
                            'server',
                            e.target.value
                          )
                        }
                        placeholder="registry.example.com"
                        className="h-6 text-xs px-2"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDockerCredential(index)}
                        className="h-6 px-1.5 text-xs text-destructive hover:text-destructive"
                      >
                        ×
                      </Button>
                    </div>
                    <div className="flex gap-1.5">
                      <Input
                        type="text"
                        value={cred.username}
                        onChange={(e) =>
                          updateDockerCredential(
                            index,
                            'username',
                            e.target.value
                          )
                        }
                        placeholder="username"
                        className="h-6 text-xs px-2"
                      />
                      <Input
                        type="password"
                        value={cred.password}
                        onChange={(e) =>
                          updateDockerCredential(
                            index,
                            'password',
                            e.target.value
                          )
                        }
                        placeholder="password"
                        className="h-6 text-xs px-2"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Files */}
        <Card>
          <CardContent>
            <h4 className="text-xs font-medium text-card-foreground mb-1">
              Files (Optional)
            </h4>

            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-border rounded-md p-4 text-center mb-2 hover:border-primary/50 transition-colors"
              style={{
                borderColor:
                  uploadedFiles.size > 0 ? 'var(--nillion-primary)' : undefined,
                backgroundColor:
                  uploadedFiles.size > 0
                    ? 'var(--nillion-primary-alpha)'
                    : undefined,
              }}
            >
              <p className="text-xs text-muted-foreground mb-2">
                Drop files or folders here
              </p>
              <div className="flex gap-2 justify-center">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    multiple
                    onChange={(e) =>
                      e.target.files && handleFileSelect(e.target.files)
                    }
                    className="hidden"
                    style={{ display: 'none' }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 text-xs px-2"
                    onClick={(e) => {
                      e.preventDefault();
                      const input =
                        e.currentTarget.parentElement?.querySelector(
                          'input[type="file"]'
                        ) as HTMLInputElement;
                      input?.click();
                    }}
                  >
                    Select Files
                  </Button>
                </label>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    // @ts-expect-error - webkitdirectory is a non-standard attribute
                    webkitdirectory="true"
                    multiple
                    onChange={(e) =>
                      e.target.files && handleFileSelect(e.target.files)
                    }
                    className="hidden"
                    style={{ display: 'none' }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 text-xs px-2"
                    onClick={(e) => {
                      e.preventDefault();
                      const input =
                        e.currentTarget.parentElement?.querySelector(
                          'input[type="file"]'
                        ) as HTMLInputElement;
                      input?.click();
                    }}
                  >
                    Select Folder
                  </Button>
                </label>
              </div>
            </div>

            {/* File list */}
            {uploadedFiles.size > 0 && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground mb-1">
                  {uploadedFiles.size} file{uploadedFiles.size === 1 ? '' : 's'}{' '}
                  selected
                </p>
                {filenameSanitized && (
                  <Alert variant="warning" className="mb-2 p-2">
                    <p className="text-xs">
                      Filenames were automatically adjusted to meet requirements
                      (spaces → underscores, special characters removed)
                    </p>
                  </Alert>
                )}
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {Array.from(uploadedFiles.entries()).map(
                    ([path, content]) => (
                      <div
                        key={path}
                        className="flex items-center justify-between text-xs p-1 rounded bg-muted/50"
                      >
                        <span className="font-mono truncate" title={path}>
                          {path}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">
                            {Math.ceil((content.length * 0.75) / 1024)}KB
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(path)}
                            className="h-5 w-5 p-0 text-destructive hover:text-destructive"
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Environment Variables */}
        <Card>
          <CardContent>
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
