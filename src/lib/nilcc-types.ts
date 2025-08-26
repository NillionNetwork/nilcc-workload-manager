export interface WorkloadOptions {
  memory?: number;
  cpus?: number;
  disk?: number;
  gpu?: number;
  envVars?: Record<string, string>;
}

export interface CreateWorkloadRequest {
  name: string;
  memory: number;
  cpus: number;
  disk: number;
  gpus: number;
  envVars?: Record<string, string>;
  files?: Record<string, string>;
  
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
  creditRate: number;
  status: 'scheduled' | 'starting' | 'running' | 'stopped' | 'error';
  domain: string;
  accountId: string;
  envVars?: Record<string, string>;
  files?: Record<string, string>;
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
  id: string;
  name: string;
  cpus: number;
  gpus: number;
  memoryMb: number;
  diskGb: number;
  cost: number;
}