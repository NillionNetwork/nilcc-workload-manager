import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_NILCC_API_BASE } from '@/lib/constants';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authorization = request.headers.get('authorization');
  if (!authorization) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = authorization.replace('Bearer ', '');
  const apiBaseUrl = request.headers.get('x-api-base-url') || DEFAULT_NILCC_API_BASE;
  await params;
  const body = await request.json();

  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/workloads/logs`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
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
    console.error('Error fetching system logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system logs' },
      { status: 500 }
    );
  }
}