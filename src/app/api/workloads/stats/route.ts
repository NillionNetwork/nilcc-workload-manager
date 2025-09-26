import { NextRequest } from 'next/server';
import { DEFAULT_NILCC_API_BASE } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workloadId } = body;
    
    if (!workloadId) {
      return Response.json(
        { errors: ['workloadId is required'], ts: new Date().toISOString() },
        { status: 400 }
      );
    }

    const apiToken = request.headers.get('authorization')?.replace('Bearer ', '') || '';
    const apiHost = request.headers.get('x-api-base-url') || DEFAULT_NILCC_API_BASE;

    if (!apiToken || !apiHost) {
      return Response.json(
        { errors: ['Missing authorization or API host'], ts: new Date().toISOString() },
        { status: 401 }
      );
    }

    const response = await fetch(`${apiHost}/api/v1/workloads/stats`, {
      method: 'POST',
      headers: {
        'x-api-key': apiToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ workloadId }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return Response.json(data, { status: response.status });
    }

    return Response.json(data);
  } catch (error) {
    console.error('Error fetching workload stats:', error);
    return Response.json(
      { errors: ['Internal server error'], ts: new Date().toISOString() },
      { status: 500 }
    );
  }
}