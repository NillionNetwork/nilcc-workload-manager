import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

interface VerifyRequestBody {
  measurementHash: string;
  dockerComposeHash: string;
  nilccVersion: string;
  vcpus: number | string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as VerifyRequestBody;
    const measurementHashInput = (body.measurementHash || '').trim();
    const dockerComposeHash = (body.dockerComposeHash || '').trim();
    const nilccVersion = (body.nilccVersion || '').trim();
    const vcpus = String(body.vcpus ?? '').trim();

    if (!measurementHashInput || !dockerComposeHash || !nilccVersion || !vcpus) {
      return NextResponse.json({
        success: false,
        error: 'invalid_request',
        message: 'measurementHash, dockerComposeHash, nilccVersion, and vcpus are required'
      });
    }

    // Check for required environment variables
    const githubToken = process.env.GITHUB_TOKEN;
    const githubBranch = process.env.GITHUB_BRANCH || 'main';
    const owner = 'NillionNetwork';
    const repo = 'nilcc-workload-manager';

    if (!githubToken) {
      return NextResponse.json({
        success: false,
        error: 'configuration_error',
        message: 'GITHUB_TOKEN environment variable is not set'
      }, { status: 500 });
    }

    // Trigger GitHub Action workflow
    const workflowId = 'verify-measurement.yml';
    const workflowUrl = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`;

    const dispatchResponse = await fetch(workflowUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        ref: githubBranch,
        inputs: {
          docker_compose_hash: dockerComposeHash,
          nilcc_version: nilccVersion,
          vcpus: vcpus,
          measurement_hash: measurementHashInput,
        },
      }),
    });

    if (!dispatchResponse.ok) {
      const errorText = await dispatchResponse.text();
      return NextResponse.json({
        success: false,
        error: 'workflow_trigger_failed',
        message: `Failed to trigger workflow: ${errorText}`
      }, { status: dispatchResponse.status });
    }

    // Wait a moment for the workflow run to be created, then fetch the run ID
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Fetch the most recent run for this workflow and branch
    const runsUrl = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowId}/runs?branch=${githubBranch}&per_page=1`;
    const runsResponse = await fetch(runsUrl, {
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!runsResponse.ok) {
      return NextResponse.json({
        success: false,
        error: 'workflow_run_fetch_failed',
        message: 'Failed to fetch workflow run ID'
      }, { status: runsResponse.status });
    }

    const runsData = await runsResponse.json();
    const runId = runsData.workflow_runs?.[0]?.id;

    if (!runId) {
      return NextResponse.json({
        success: false,
        error: 'workflow_run_not_found',
        message: 'Workflow was triggered but run ID could not be determined'
      });
    }

    // Return the workflow run ID for polling
    return NextResponse.json({
      success: true,
      workflow_run_id: runId,
      status: 'queued',
      message: 'Verification workflow triggered. Please poll for results.',
    });
  } catch (error) {
    console.error('Error triggering workflow:', error);
    return NextResponse.json({
      success: false,
      error: 'verification_failed',
      message: error instanceof Error ? error.message : 'Measurement hash verification failed'
    }, { status: 500 });
  }
}


