import { NextRequest, NextResponse } from 'next/server';

interface VerifyAmdRequestBody {
  report: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: VerifyAmdRequestBody = await request.json();

    const { report } = body;

    // Validate required fields
    if (!report) {
      return NextResponse.json(
        {
          success: false,
          error: 'invalid_request',
          message: 'report is required',
        },
        { status: 400 }
      );
    }

    // POST to the nilcc-verifier service
    const verifierResponse = await fetch(
      'https://nilcc-verifier.nillion.network/v1/attestations/verify-amd',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ report }),
      }
    );

    const verifierData = await verifierResponse.json().catch(() => ({}));

    if (!verifierResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: 'verification_failed',
          message: verifierData?.message || 'Verification request failed',
          details: verifierData,
        },
        { status: verifierResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      ...verifierData,
    });
  } catch (error) {
    console.error('Verify-amd error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'internal_error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
