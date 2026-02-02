export interface Artifact {
  version: string;
  builtAt: string;
}

export interface WorkloadOptions {
  memory?: number;
  cpus?: number;
  disk?: number;
  gpu?: number;
  envVars?: Record<string, string>;
}

export interface DockerCredential {
  server: string;
  username: string;
  password: string;
}

export interface CreateWorkloadRequest {
  name: string;
  memory: number;
  cpus: number;
  disk: number;
  gpus: number;
  artifactsVersion?: string;
  envVars?: Record<string, string>;
  files?: Record<string, string>;
  dockerCredentials?: DockerCredential[];
  heartbeat?: {
    measurementHashUrl: string;
  };

  // For public Docker images
  dockerImage?: string;
  containerPort?: number;
  serviceName?: string;

  // For Docker Compose configurations
  dockerCompose?: string;
  serviceToExpose?: string;
  servicePortToExpose?: number;
}

export interface WorkloadResponse {
  workloadId: string;
  name: string;
  dockerCompose: string;
  publicContainerName: string;
  publicContainerPort: number;
  memory: number;
  cpus: number;
  disk: number;
  gpus: number;
  artifactsVersion?: string;
  creditRate: number;
  status: 'scheduled' | 'starting' | 'awaitingCert' | 'running' | 'stopped' | 'error';
  domain: string;
  accountId: string;
  envVars?: Record<string, string>;
  files?: Record<string, string>;
  heartbeat?: {
    measurementHashUrl: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ApiErrorResponse {
  errors: string[];
  ts: string;
  errorsTrace?: string;
}

export interface Container {
  name?: string;
  names?: string[];
  image: string;
  imageId: string;
  status?: string;
  state?: string;
}

export interface ListContainersRequest {
  workloadId: string;
}

export interface WorkloadContainerLogsRequest {
  workloadId: string;
  container: string;
  tail: boolean;
  stream: 'stdout' | 'stderr';
  maxLines?: number;
}

export interface WorkloadSystemLogsRequest {
  workloadId: string;
  tail: boolean;
  source?: 'cvm-agent';
  maxLines?: number;
}

export interface LogsResponse {
  lines: string[];
}

export interface WorkloadTier {
  tierId: string;
  name: string;
  cpus: number;
  gpus: number;
  memoryMb: number;
  diskGb: number;
  cost: number;
}

export interface Account {
  accountId: string;
  name: string;
  credits: number;
  createdAt: string;
}

export type WorkloadEventKind = 
  | { kind: 'created' }
  | { kind: 'starting' }
  | { kind: 'awaitingCert' }
  | { kind: 'stopped' }
  | { kind: 'vmRestarted' }
  | { kind: 'forcedRestart' }
  | { kind: 'running' }
  | { kind: 'failedToStart'; error: string };

export interface WorkloadEvent {
  eventId: string;
  details: WorkloadEventKind;
  timestamp: string;
}

export interface ListWorkloadEventsRequest {
  workloadId: string;
}

export interface ListWorkloadEventsResponse {
  events: WorkloadEvent[];
}

export interface SystemStats {
  memory: {
    total: number;
    used: number;
  };
  cpus: Array<{
    name: string;
    usage: number;
    frequency: number;
  }>;
  disks: Array<{
    name: string;
    mountPoint: string;
    filesystem: string;
    size: number;
    used: number;
  }>;
}