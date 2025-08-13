'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSettings } from '@/contexts/SettingsContext';
import { Card, CardContent, Button, Input, Textarea, Alert } from '@/components/ui';
import { components } from '@/styles/design-system';
import { Plus, Settings } from 'lucide-react';

export default function CreateWorkloadPage() {
  const router = useRouter();
  const { client, apiKey } = useSettings();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableServices, setAvailableServices] = useState<string[]>([]);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
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
  
  // Resources
  const [memory, setMemory] = useState('2048');
  const [cpus, setCpus] = useState('1');
  const [disk, setDisk] = useState('10');
  const [gpus, setGpus] = useState('0');
  
  // Environment variables
  const [envVars, setEnvVars] = useState<{ key: string; value: string }[]>([]);

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

  const dockerImageError = imageType === 'public' ? validateDockerImage(dockerImage) : null;

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
      const validEnvVars = envVars.filter(({ key, value }) => key.trim() && value.trim());
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
    if (!client) return;

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

      let workloadData: any = {
        name,
        description: description || undefined,
        memory: parseInt(memory),
        cpus: parseInt(cpus),
        disk: parseInt(disk),
        gpus: parseInt(gpus),
        envVars: Object.keys(envVarsObject).length > 0 ? envVarsObject : undefined,
      };

      if (imageType === 'public') {
        workloadData = {
          ...workloadData,
          dockerImage,
          containerPort: parseInt(containerPort),
          serviceName,
        };
      } else {
        workloadData = {
          ...workloadData,
          dockerCompose,
          serviceToExpose,
          servicePortToExpose: parseInt(servicePortToExpose),
        };
      }

      const response = await client.createWorkload(workloadData);
      router.push(`/workloads/${response.id}`);
    } catch (err: any) {
      setError(err.response?.data?.errors?.[0] || err.message || 'Failed to create workload');
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

  const updateEnvVar = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...envVars];
    updated[index][field] = value;
    setEnvVars(updated);
  };

  if (!apiKey) {
    return (
      <div className={components.section}>
        <Alert variant="warning" className="flex items-center">
          <Settings className="h-4 w-4 mr-2" />
          <div>
            <p className="font-medium">API Key Required</p>
            <p className="text-sm mt-1">
              You need to set your API key in settings before you can create workloads.
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
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Create New Workload</h1>
        <p className="text-gray-600 text-sm">Deploy a container in a Confidential VM</p>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="danger">
          <p className="font-medium">Failed to create workload</p>
          <p className="text-sm mt-1">{error}</p>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Information */}
        <Card>
          <CardContent className="py-4">
            <h2 className="text-base font-semibold text-gray-900 mb-3">Basic Information</h2>
            <div className="space-y-3">
              <div>
                <label className={components.label}>Workload Name *</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="my-secure-app"
                  required
                />
              </div>
              <div>
                <label className={components.label}>Description (optional)</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of your workload..."
                  rows={2}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Docker Configuration */}
        <Card>
          <CardContent className="py-4">
            <h2 className="text-base font-semibold text-gray-900 mb-3">Docker Configuration</h2>
            
            {/* Image Type Selection */}
            <div className="mb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setImageType('public')}
                  className={`p-3 border rounded-lg text-left transition-colors ${
                    imageType === 'public'
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center mb-1">
                    <div className={`w-3 h-3 rounded-full mr-2 ${
                      imageType === 'public' ? 'bg-blue-500' : 'bg-gray-300'
                    }`} />
                    <span className="font-medium text-sm">Public Docker Image</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Use an image from Docker Hub
                  </p>
                </button>
                
                <button
                  type="button"
                  onClick={() => setImageType('private')}
                  className={`p-3 border rounded-lg text-left transition-colors ${
                    imageType === 'private'
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center mb-1">
                    <div className={`w-3 h-3 rounded-full mr-2 ${
                      imageType === 'private' ? 'bg-blue-500' : 'bg-gray-300'
                    }`} />
                    <span className="font-medium text-sm">Docker Compose</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Full Docker Compose config
                  </p>
                </button>
              </div>
            </div>

            {/* Public Image Configuration */}
            {imageType === 'public' && (
              <div className="space-y-3">
                <div>
                  <label className={components.label}>Docker Image *</label>
                  <Input
                    value={dockerImage}
                    onChange={(e) => setDockerImage(e.target.value)}
                    placeholder="nginx:latest"
                    required
                    className={dockerImageError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
                  />
                  {dockerImageError && (
                    <p className="text-sm text-red-600 mt-1">{dockerImageError}</p>
                  )}
                </div>
                <div>
                  <label className={components.label}>Container Port</label>
                  <Input
                    type="number"
                    value={containerPort}
                    onChange={(e) => setContainerPort(e.target.value)}
                    placeholder="80"
                    min="1"
                    max="65535"
                    required
                  />
                  <p className={components.helperText}>
                    Port your app listens on
                  </p>
                </div>
                <div>
                  <label className={components.label}>Service Name</label>
                  <Input
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    placeholder="api"
                    required
                  />
                </div>
                
                {/* Compose Preview */}
                {dockerImage && (
                  <div>
                    <label className={components.label}>Docker Compose Preview</label>
                    <pre className="bg-gray-50 border border-gray-200 rounded p-3 text-sm overflow-x-auto">
                      <code>{generateComposePreview()}</code>
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Docker Compose Configuration */}
            {imageType === 'private' && (
              <div className="space-y-3">
                <div>
                  <label className={components.label}>Docker Compose Configuration *</label>
                  <Textarea
                    value={dockerCompose}
                    onChange={(e) => setDockerCompose(e.target.value)}
                    placeholder="Enter your Docker Compose YAML..."
                    rows={8}
                    className="font-mono text-sm"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={components.label}>Service to Expose *</label>
                    {availableServices.length > 0 ? (
                      <select
                        value={serviceToExpose}
                        onChange={(e) => setServiceToExpose(e.target.value)}
                        className={components.input.base}
                        required
                      >
                        <option value="">Select a service</option>
                        {availableServices.map(service => (
                          <option key={service} value={service}>
                            {service}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        value={serviceToExpose}
                        onChange={(e) => setServiceToExpose(e.target.value)}
                        placeholder="Enter service name"
                        required
                      />
                    )}
                    <p className={components.helperText}>
                      {availableServices.length > 0 
                        ? `Found ${availableServices.length} service${availableServices.length > 1 ? 's' : ''}`
                        : 'Enter Docker Compose to see services'
                      }
                    </p>
                  </div>
                  <div>
                    <label className={components.label}>Service Port *</label>
                    <Input
                      type="number"
                      value={servicePortToExpose}
                      onChange={(e) => setServicePortToExpose(e.target.value)}
                      placeholder="80"
                      required
                      min="1"
                      max="65535"
                    />
                    <p className={components.helperText}>
                      Port to expose
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resource Allocation */}
        <Card>
          <CardContent className="py-4">
            <h2 className="text-base font-semibold text-gray-900 mb-3">Resources</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className={components.label}>Memory (MB) *</label>
                <Input
                  type="number"
                  value={memory}
                  onChange={(e) => setMemory(e.target.value)}
                  min="512"
                  max="16384"
                  required
                />
              </div>
              <div>
                <label className={components.label}>CPUs *</label>
                <Input
                  type="number"
                  value={cpus}
                  onChange={(e) => setCpus(e.target.value)}
                  min="1"
                  max="8"
                  required
                />
              </div>
              <div>
                <label className={components.label}>Disk (GB) *</label>
                <Input
                  type="number"
                  value={disk}
                  onChange={(e) => setDisk(e.target.value)}
                  min="5"
                  max="100"
                  required
                />
              </div>
              <div>
                <label className={components.label}>GPUs (optional)</label>
                <Input
                  type="number"
                  value={gpus}
                  onChange={(e) => setGpus(e.target.value)}
                  min="0"
                  max="4"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Environment Variables */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-900">Environment Variables</h2>
              <Button type="button" variant="secondary" size="sm" onClick={addEnvVar}>
                <Plus className="h-4 w-4 mr-1" />
                Add Variable
              </Button>
            </div>
            
            {envVars.length === 0 ? (
              <p className="text-gray-500 text-sm">No environment variables added</p>
            ) : (
              <div className="space-y-2">
                {envVars.map((envVar, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <Input
                      value={envVar.key}
                      onChange={(e) => updateEnvVar(index, 'key', e.target.value)}
                      placeholder="VARIABLE_NAME"
                      className="font-mono"
                    />
                    <span className="text-gray-500">=</span>
                    <Input
                      value={envVar.value}
                      onChange={(e) => updateEnvVar(index, 'value', e.target.value)}
                      placeholder="value"
                      className="font-mono"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEnvVar(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <Link href="/workloads">
            <Button variant="ghost">Cancel</Button>
          </Link>
          <Button
            type="submit"
            loading={creating}
            disabled={!name || (imageType === 'public' ? (!dockerImage || !!dockerImageError) : !dockerCompose)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Workload
          </Button>
        </div>
      </form>
    </div>
  );
}