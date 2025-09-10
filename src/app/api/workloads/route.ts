import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_NILCC_API_BASE = 'https://nilcc-api.sandbox.app-cluster.sandbox.nilogy.xyz';

export async function GET(request: NextRequest) {
  const authorization = request.headers.get('authorization');
  if (!authorization) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = authorization.replace('Bearer ', '');
  const apiBaseUrl = request.headers.get('x-api-base-url') || DEFAULT_NILCC_API_BASE;

  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/workloads/list`, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = errorText;
      
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error) {
          // Check if errorData.error is a string that needs to be parsed
          if (typeof errorData.error === 'string' && errorData.error.startsWith('{')) {
            const nestedError = JSON.parse(errorData.error);
            errorMessage = nestedError.error || errorData.error;
          } else if (typeof errorData.error === 'object') {
            // If it's already an object, extract the error field
            errorMessage = errorData.error.error || JSON.stringify(errorData.error);
          } else {
            // If it's just a string, use it directly
            errorMessage = errorData.error;
          }
        }
      } catch (e) {
        // If parsing fails, use the original error text
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error listing workloads:', error);
    return NextResponse.json(
      { error: 'Failed to list workloads' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authorization = request.headers.get('authorization');
  if (!authorization) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = authorization.replace('Bearer ', '');
  const apiBaseUrl = request.headers.get('x-api-base-url') || DEFAULT_NILCC_API_BASE;
  const body = await request.json();


  // Transform the request based on whether it's a public Docker image or Docker Compose
  interface NilccPayload {
    name: string;
    memory: number;
    cpus: number;
    disk: number;
    gpus: number;
    envVars?: Record<string, string>;
    files?: Record<string, string>;
    dockerCompose?: string;
    publicContainerName?: string;
    publicContainerPort?: number;
  }

  const nilccPayload: NilccPayload = {
    name: body.name,
    memory: body.memory,
    cpus: body.cpus,
    disk: body.disk,
    gpus: body.gpus,
    envVars: body.envVars,
    files: body.files,
  };

  if (body.dockerImage) {
    // Public Docker image - generate Docker Compose (nilCC doesn't support custom port mapping)
    const serviceName = body.serviceName || 'api';
    const containerPort = body.containerPort || 80;
    
    let dockerCompose = `services:
  ${serviceName}:
    image: ${body.dockerImage}`;
    
    // Only add expose if port is not 80
    if (containerPort !== 80) {
      dockerCompose += `
    expose:
      - "${containerPort}"`;
    }
    
    nilccPayload.dockerCompose = dockerCompose;
    nilccPayload.publicContainerName = serviceName;
    nilccPayload.publicContainerPort = containerPort;
  } else if (body.dockerCompose && body.serviceToExpose && body.servicePortToExpose) {
    // Docker Compose configuration
    nilccPayload.dockerCompose = body.dockerCompose;
    nilccPayload.publicContainerName = body.serviceToExpose;
    nilccPayload.publicContainerPort = body.servicePortToExpose;
  } else {
    return NextResponse.json(
      { error: 'Invalid workload configuration' },
      { status: 400 }
    );
  }


  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/workloads/create`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(nilccPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = errorText;
      
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error) {
          // Check if errorData.error is a string that needs to be parsed
          if (typeof errorData.error === 'string' && errorData.error.startsWith('{')) {
            const nestedError = JSON.parse(errorData.error);
            errorMessage = nestedError.error || errorData.error;
          } else if (typeof errorData.error === 'object') {
            // If it's already an object, extract the error field
            errorMessage = errorData.error.error || JSON.stringify(errorData.error);
          } else {
            // If it's just a string, use it directly
            errorMessage = errorData.error;
          }
        }
      } catch (e) {
        // If parsing fails, use the original error text
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating workload:', error);
    return NextResponse.json(
      { error: 'Failed to create workload' },
      { status: 500 }
    );
  }
}