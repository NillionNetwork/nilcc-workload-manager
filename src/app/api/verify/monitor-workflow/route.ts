import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const runId = searchParams.get('run_id');

    if (!runId) {
      return NextResponse.json({
        success: false,
        error: 'invalid_request',
        message: 'run_id query parameter is required'
      }, { status: 400 });
    }

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

    // Fetch workflow run details
    const runUrl = `https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}`;
    const runResponse = await fetch(runUrl, {
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      return NextResponse.json({
        success: false,
        error: 'workflow_run_fetch_failed',
        message: `Failed to fetch workflow run: ${errorText}`
      }, { status: runResponse.status });
    }

    const runData = await runResponse.json();

    // Determine status
    const status = runData.status; // queued, in_progress, completed
    const conclusion = runData.conclusion; // success, failure, cancelled, etc. (null if not completed)

    // Determine verification result from workflow conclusion
    // The workflow exits with code 1 if verification fails, so conclusion is reliable
    let verified = null;
    if (status === 'completed') {
      if (conclusion === 'success') {
        verified = true;
      } else if (conclusion === 'failure') {
        verified = false;
      }
    }

    return NextResponse.json({
      success: true,
      status,
      conclusion,
      workflow_run_id: runId,
      verified,
      html_url: runData.html_url,
      // Include full response for debugging
      run_data: {
        status,
        conclusion,
        created_at: runData.created_at,
        updated_at: runData.updated_at,
      },
    });
  } catch (error) {
    console.error('Error monitoring workflow:', error);
    return NextResponse.json({
      success: false,
      error: 'monitoring_failed',
      message: error instanceof Error ? error.message : 'Failed to monitor workflow'
    }, { status: 500 });
  }
}

