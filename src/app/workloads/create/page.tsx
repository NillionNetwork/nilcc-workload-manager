"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSettings } from "@/contexts/SettingsContext";
import {
  Card,
  CardContent,
  Button,
  Input,
  Textarea,
  Alert,
} from "@/components/ui";
import { Plus, Settings } from "lucide-react";
import { CreateWorkloadRequest } from "@/lib/nilcc-types";

export default function CreateWorkloadPage() {
  const router = useRouter();
  const { client, apiKey } = useSettings();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableServices, setAvailableServices] = useState<string[]>([]);

  // Form state
  const [name, setName] = useState("");
  const [imageType, setImageType] = useState<"public" | "private">("public");

  // Public image fields
  const [dockerImage, setDockerImage] = useState("");
  const [containerPort, setContainerPort] = useState("80");
  const [serviceName, setServiceName] = useState("api");

  // Private image fields
  const [dockerCompose, setDockerCompose] = useState(`services:
  web:
    image: caddy:2
    command: |
      caddy respond --listen :8080 --body '{"hello":"world"}' --header "Content-Type: application/json"`);
  const [serviceToExpose, setServiceToExpose] = useState("web");
  const [servicePortToExpose, setServicePortToExpose] = useState("8080");

  // Resources
  const [memory, setMemory] = useState("2048");
  const [cpus, setCpus] = useState("1");
  const [disk, setDisk] = useState("10");
  const [gpus, setGpus] = useState("0");

  // Environment variables
  const [envVars, setEnvVars] = useState<{ key: string; value: string }[]>([]);

  // Validation
  const validateDockerImage = (image: string): string | null => {
    if (!image) return null;

    // Must contain a colon for tag
    if (!image.includes(":")) {
      return "Docker image must include a tag (e.g., nginx:latest, node:18, redis:alpine)";
    }

    // Basic format validation
    const parts = image.split(":");
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      return "Invalid Docker image format. Use: image:tag";
    }

    return null;
  };

  const dockerImageError =
    imageType === "public" ? validateDockerImage(dockerImage) : null;

  // Parse Docker Compose to extract service names
  const parseDockerCompose = (yaml: string): string[] => {
    try {
      // Basic YAML parsing for services
      const lines = yaml.split("\n");
      const services: string[] = [];
      let inServices = false;
      let currentIndent = -1;

      for (const line of lines) {
        const trimmed = line.trim();
        const indent = line.length - line.trimStart().length;

        // Check if we're in the services section
        if (trimmed === "services:") {
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
        if (inServices && indent <= currentIndent && trimmed !== "") {
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
    if (imageType === "private" && dockerCompose) {
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
    if (imageType !== "public" || !dockerImage) return "";

    const service = serviceName || "api";

    let compose = `services:\n  ${service}:\n    image: ${dockerImage}`;

    // Only add expose if port is not 80
    if (containerPort !== "80") {
      compose += `\n    expose:\n      - "${containerPort}"`;
    }

    if (envVars.length > 0) {
      const validEnvVars = envVars.filter(
        ({ key, value }) => key.trim() && value.trim()
      );
      if (validEnvVars.length > 0) {
        compose += "\n    environment:";
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

      const baseData = {
        name,
        memory: parseInt(memory),
        cpus: parseInt(cpus),
        disk: parseInt(disk),
        gpus: parseInt(gpus),
        envVars:
          Object.keys(envVarsObject).length > 0 ? envVarsObject : undefined,
      };

      const workloadData =
        imageType === "public"
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
            "Failed to create workload"
        );
      } else {
        setError("Failed to create workload");
      }
    } finally {
      setCreating(false);
    }
  };

  const addEnvVar = () => {
    setEnvVars([...envVars, { key: "", value: "" }]);
  };

  const removeEnvVar = (index: number) => {
    setEnvVars(envVars.filter((_, i) => i !== index));
  };

  const updateEnvVar = (
    index: number,
    field: "key" | "value",
    value: string
  ) => {
    const updated = [...envVars];
    updated[index][field] = value;
    setEnvVars(updated);
  };

  if (!apiKey) {
    return (
      <div style={{ marginBottom: "1.5rem" }}>
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
    <div style={{ marginBottom: "1.5rem" }}>
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground">
          Create New Workload
        </h1>
        <p className="text-muted-foreground text-sm">
          Deploy a container in nilCC
        </p>
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
            <h2 className="text-base font-semibold text-card-foreground mb-3">
              Basic Information
            </h2>
            <div className="space-y-3">
              <div>
                <label>Workload Name *</label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="my-secure-app"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Docker Configuration */}
        <Card>
          <CardContent className="py-4">
            <h2 className="text-base font-semibold text-card-foreground mb-3">
              Docker Configuration
            </h2>

            {/* Image Type Selection */}
            <div style={{ marginBottom: "1.5rem" }}>
              <p
                style={{
                  marginBottom: "0.75rem",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                }}
              >
                Choose configuration type:
              </p>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    cursor: "pointer",
                    padding: "0.75rem",
                    border: "2px solid",
                    borderColor:
                      imageType === "public"
                        ? "var(--nillion-primary)"
                        : "var(--nillion-border)",
                    borderRadius: "0.375rem",
                    backgroundColor:
                      imageType === "public"
                        ? "var(--nillion-primary-lightest)"
                        : "transparent",
                    transition: "all 200ms ease",
                  }}
                >
                  <input
                    type="radio"
                    name="imageType"
                    value="public"
                    checked={imageType === "public"}
                    onChange={() => setImageType("public")}
                    style={{ marginTop: "0.125rem" }}
                  />
                  <div style={{ marginLeft: "0.5rem" }}>
                    <span
                      style={{
                        fontWeight: "600",
                        color: imageType === "public" ? "#000000" : "var(--nillion-text)",
                      }}
                    >
                      Public Docker Image
                    </span>
                    <p
                      style={{
                        fontSize: "0.875rem",
                        color: imageType === "public" ? "#666666" : "var(--nillion-text-secondary)",
                        marginTop: "0.25rem",
                      }}
                    >
                      Use an image from Docker Hub (e.g., nginx:latest, node:18)
                    </p>
                  </div>
                </label>

                <label
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    cursor: "pointer",
                    padding: "0.75rem",
                    border: "2px solid",
                    borderColor:
                      imageType === "private"
                        ? "var(--nillion-primary)"
                        : "var(--nillion-border)",
                    borderRadius: "0.375rem",
                    backgroundColor:
                      imageType === "private"
                        ? "var(--nillion-primary-lightest)"
                        : "transparent",
                    transition: "all 200ms ease",
                  }}
                >
                  <input
                    type="radio"
                    name="imageType"
                    value="private"
                    checked={imageType === "private"}
                    onChange={() => setImageType("private")}
                    style={{ marginTop: "0.125rem" }}
                  />
                  <div style={{ marginLeft: "0.5rem" }}>
                    <span
                      style={{
                        fontWeight: "600",
                        color: imageType === "private" ? "#000000" : "var(--nillion-text)",
                      }}
                    >
                      Docker Compose
                    </span>
                    <p
                      style={{
                        fontSize: "0.875rem",
                        color: imageType === "private" ? "#666666" : "var(--nillion-text-secondary)",
                        marginTop: "0.25rem",
                      }}
                    >
                      Full Docker Compose configuration with multiple services
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Divider */}
            <hr
              style={{
                border: "none",
                borderTop: "1px solid var(--nillion-border)",
                margin: "1.5rem 0",
              }}
            />

            {/* Public Image Configuration */}
            {imageType === "public" && (
              <div className="space-y-3">
                <div>
                  <label>Docker Image *</label>
                  <Input
                    type="text"
                    value={dockerImage}
                    onChange={(e) => setDockerImage(e.target.value)}
                    placeholder="nginx:latest"
                    required
                    style={
                      dockerImageError
                        ? { borderColor: "var(--nillion-destructive)" }
                        : {}
                    }
                  />
                  {dockerImageError && (
                    <p
                      style={{
                        fontSize: "0.875rem",
                        color: "var(--nillion-destructive)",
                        marginTop: "0.25rem",
                      }}
                    >
                      {dockerImageError}
                    </p>
                  )}
                </div>
                <div>
                  <label>Container Port</label>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--nillion-text-secondary)",
                    }}
                  >
                    Port your app listens on
                  </p>
                  <Input
                    type="number"
                    value={containerPort}
                    onChange={(e) => setContainerPort(e.target.value)}
                    placeholder="80"
                    min="1"
                    max="65535"
                    required
                  />
                </div>
                <div>
                  <label>Service Name</label>
                  <Input
                    type="text"
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    placeholder="api"
                    required
                  />
                </div>

                {/* Compose Preview */}
                {dockerImage && (
                  <div>
                    <label>Docker Compose Preview</label>
                    <pre className="bg-muted border border-border rounded p-3 text-sm overflow-x-auto text-foreground">
                      <code>{generateComposePreview()}</code>
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Docker Compose Configuration */}
            {imageType === "private" && (
              <div className="space-y-3">
                <div>
                  <label>Docker Compose Configuration *</label>
                  <Textarea
                    value={dockerCompose}
                    onChange={(e) => setDockerCompose(e.target.value)}
                    placeholder="Enter your Docker Compose YAML..."
                    rows={8}
                    style={{ fontFamily: "monospace", fontSize: "0.875rem" }}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label>Service to Expose *</label>
                    {availableServices.length > 0 ? (
                      <select
                        value={serviceToExpose}
                        onChange={(e) => setServiceToExpose(e.target.value)}
                        required
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
                      />
                    )}
                    <p
                      style={{
                        fontSize: "0.875rem",
                        color: "var(--nillion-text-secondary)",
                      }}
                    >
                      {availableServices.length > 0
                        ? `Found ${availableServices.length} service${
                            availableServices.length > 1 ? "s" : ""
                          }`
                        : "Enter Docker Compose to see services"}
                    </p>
                  </div>
                  <div>
                    <label>Service Port *</label>
                    <Input
                      type="number"
                      value={servicePortToExpose}
                      onChange={(e) => setServicePortToExpose(e.target.value)}
                      placeholder="80"
                      required
                      min="1"
                      max="65535"
                    />
                    <p
                      style={{
                        fontSize: "0.875rem",
                        color: "var(--nillion-text-secondary)",
                      }}
                    >
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
            <h2 className="text-base font-semibold text-card-foreground mb-3">
              Resources
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label>Memory (MB) *</label>
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
                <label>CPUs *</label>
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
                <label>Disk (GB) *</label>
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
                <label>GPUs (optional)</label>
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
              <h2 className="text-base font-semibold text-card-foreground">
                Environment Variables
              </h2>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={addEnvVar}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Variable
              </Button>
            </div>

            {envVars.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No environment variables added
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {envVars.map((envVar, index) => (
                  <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto', gap: '0.5rem', alignItems: 'center' }}>
                    <Input
                      type="text"
                      value={envVar.key}
                      onChange={(e) =>
                        updateEnvVar(index, "key", e.target.value)
                      }
                      placeholder="VARIABLE_NAME"
                      style={{ fontFamily: "monospace" }}
                    />
                    <span style={{ color: 'var(--nillion-text-secondary)', fontSize: '1.25rem', fontFamily: 'monospace', padding: '0 0.25rem' }}>=</span>
                    <Input
                      type="text"
                      value={envVar.value}
                      onChange={(e) =>
                        updateEnvVar(index, "value", e.target.value)
                      }
                      placeholder="value"
                      style={{ fontFamily: "monospace" }}
                    />
                    <button
                      type="button"
                      onClick={() => removeEnvVar(index)}
                      style={{
                        padding: '0.5rem 0.75rem',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        transition: 'color 200ms ease',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#dc2626'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#ef4444'}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Link href="/workloads">
            <Button variant="ghost">Cancel</Button>
          </Link>
          <Button
            type="submit"
            loading={creating}
            disabled={
              !name ||
              (imageType === "public"
                ? !dockerImage || !!dockerImageError
                : !dockerCompose)
            }
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Workload
          </Button>
        </div>
      </form>
    </div>
  );
}
