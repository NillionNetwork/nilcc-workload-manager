import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_NILCC_API_BASE = 'https://nilcc-api.sandbox.app-cluster.sandbox.nilogy.xyz';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authorization = request.headers.get('authorization');
  if (!authorization) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = authorization.replace('Bearer ', '');
  const apiBaseUrl = request.headers.get('x-api-base-url') || DEFAULT_NILCC_API_BASE;
  const { id } = await params;

  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/workloads/${id}`, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching workload:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workload' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authorization = request.headers.get('authorization');
  if (!authorization) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = authorization.replace('Bearer ', '');
  const apiBaseUrl = request.headers.get('x-api-base-url') || DEFAULT_NILCC_API_BASE;
  const { id } = await params;

  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/workloads/delete`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ workloadId: id }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: errorText },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting workload:', error);
    return NextResponse.json(
      { error: 'Failed to delete workload' },
      { status: 500 }
    );
  }
}