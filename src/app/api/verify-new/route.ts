import { NextRequest, NextResponse } from 'next/server';

interface VerifyNewRequestBody {
  report: string;
  docker_compose_hash: string;
  nilcc_version: string;
  vcpus: number;
  vm_type: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: VerifyNewRequestBody = await request.json();

    const { report, docker_compose_hash, nilcc_version, vcpus, vm_type } = body;

    // Validate required fields
    if (!report || !docker_compose_hash || !nilcc_version || vcpus === undefined || !vm_type) {
      return NextResponse.json(
        {
          success: false,
          error: 'invalid_request',
          message: 'report, docker_compose_hash, nilcc_version, vcpus, and vm_type are required',
        },
        { status: 400 }
      );
    }

    // POST to the nilcc-verifier service
    const verifierResponse = await fetch(
      'https://nilcc-verifier.nillion.network/v1/attestations/verify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          report,
          docker_compose_hash,
          nilcc_version,
          vcpus,
          vm_type,
        }),
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
    console.error('Verify-new error:', error);
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
