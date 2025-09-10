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
    const response = await fetch(`${apiBaseUrl}/api/v1/accounts/me`, {
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
    console.error('Error fetching account:', error);
    return NextResponse.json(
      { error: 'Failed to fetch account' },
      { status: 500 }
    );
  }
}