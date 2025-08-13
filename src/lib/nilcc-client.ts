import axios, { AxiosResponse } from 'axios';
import { CreateWorkloadRequest, WorkloadResponse } from './nilcc-types';

export class NilccClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly nilccApiBaseUrl: string;
  private readonly headers: Record<string, string>;

  constructor(apiKey: string, baseUrl: string = '/api', nilccApiBaseUrl?: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.nilccApiBaseUrl = nilccApiBaseUrl || 'https://nilcc-api.sandbox.app-cluster.sandbox.nilogy.xyz';
    this.headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'x-api-base-url': this.nilccApiBaseUrl,
    };
  }

  async createWorkload(data: CreateWorkloadRequest): Promise<WorkloadResponse> {
    const response: AxiosResponse<WorkloadResponse> = await axios.post(
      `${this.baseUrl}/workloads`,
      data,
      { headers: this.headers }
    );

    return response.data;
  }

  async deleteWorkload(workloadId: string): Promise<void> {
    await axios.delete(
      `${this.baseUrl}/workloads/${workloadId}`,
      { headers: this.headers }
    );
  }

  async getWorkload(workloadId: string): Promise<WorkloadResponse> {
    const response: AxiosResponse<WorkloadResponse> = await axios.get(
      `${this.baseUrl}/workloads/${workloadId}`,
      { headers: this.headers }
    );

    return response.data;
  }

  async listWorkloads(): Promise<WorkloadResponse[]> {
    const response: AxiosResponse<WorkloadResponse[]> = await axios.get(
      `${this.baseUrl}/workloads`,
      { headers: this.headers }
    );

    return response.data;
  }
}