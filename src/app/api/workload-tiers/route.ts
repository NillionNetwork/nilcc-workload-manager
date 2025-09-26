import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_NILCC_API_BASE } from '@/lib/constants';

export async function GET(request: NextRequest) {
  const authorization = request.headers.get('authorization');
  if (!authorization) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = authorization.replace('Bearer ', '');
  const apiBaseUrl = request.headers.get('x-api-base-url') || DEFAULT_NILCC_API_BASE;

  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/workload-tiers/list`, {
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
    console.error('Error fetching workload tiers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workload tiers' },
      { status: 500 }
    );
  }
}