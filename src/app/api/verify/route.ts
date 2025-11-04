import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

interface VerifyRequestBody {
  measurementHash: string;
  dockerComposeHash: string;
  nilccVersion: string;
  vcpus: number | string;
}

interface GitHubWorkflowRun {
  id: number;
  created_at: string;
  status: string;
  conclusion: string | null;
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
    const owner = 'NillionNetwork';
    const repo = 'nilcc-workload-manager';
    const branch = 'main';

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

    // Record timestamp before dispatching to find the exact run we create
    const beforeDispatch = new Date().toISOString();

    const dispatchResponse = await fetch(workflowUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        ref: branch,
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

    // Poll for the run we just created by checking runs created after our dispatch
    // GitHub API doesn't return run_id from dispatch, so we need to find it
    let runId: number | null = null;
    let findAttempts = 0;
    const maxFindAttempts = 10;

    while (!runId && findAttempts < maxFindAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between checks
      
      const runsUrl = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowId}/runs?branch=${branch}&per_page=5`;
      const runsResponse = await fetch(runsUrl, {
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });

      if (runsResponse.ok) {
        const runsData = await runsResponse.json();
        // Find the run that was created after we dispatched (matches our timestamp)
        const ourRun = runsData.workflow_runs?.find((run: GitHubWorkflowRun) => {
          return new Date(run.created_at) >= new Date(beforeDispatch);
        });
        
        if (ourRun) {
          runId = ourRun.id;
          break;
        }
      }
      
      findAttempts++;
    }

    if (!runId) {
      return NextResponse.json({
        success: false,
        error: 'workflow_run_not_found',
        message: 'Workflow was triggered but run ID could not be determined. The run may not have been created yet.'
      });
    }

    // Poll the workflow until it completes
    const maxAttempts = 10;
    let attempts = 0;
    let status = 'queued';
    let verified = false;

    while (attempts < maxAttempts && status !== 'completed') {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds between checks
      
      const runUrl = `https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}`;
      const runResponse = await fetch(runUrl, {
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });

      if (runResponse.ok) {
        const runData = await runResponse.json();
        status = runData.status;
        
        if (status === 'completed') {
          // Fetch job to get logs and parse the verification result
          const jobsUrl = `https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}/jobs`;
          const jobsResponse = await fetch(jobsUrl, {
            headers: {
              'Authorization': `Bearer ${githubToken}`,
              'Accept': 'application/vnd.github+json',
              'X-GitHub-Api-Version': '2022-11-28',
            },
          });

          if (jobsResponse.ok) {
            const jobsData = await jobsResponse.json();
            const job = jobsData.jobs?.[0];
            
            if (job) {
              // Get the job logs to parse the verification result
              const logsUrl = `https://api.github.com/repos/${owner}/${repo}/actions/jobs/${job.id}/logs`;
              const logsResponse = await fetch(logsUrl, {
                headers: {
                  'Authorization': `Bearer ${githubToken}`,
                  'Accept': 'application/vnd.github+json',
                  'X-GitHub-Api-Version': '2022-11-28',
                },
              });

              if (logsResponse.ok) {
                const logsText = await logsResponse.text();
                // Parse the verified status from the logs
                // The "Output result" step prints: "VERIFICATION_RESULT: true" or "VERIFICATION_RESULT: false"
                const verifiedMatch = logsText.match(/VERIFICATION_RESULT:\s*(true|false)/i);
                if (verifiedMatch) {
                  verified = verifiedMatch[1].toLowerCase() === 'true';
                }
              }
            }
          }
          
          break;
        }
      }
      
      attempts++;
    }


    return NextResponse.json({
      success: true,
      quote: {
        verified,
        header: {
          tee_type: 'TEE_AMD_SEV_SNP'
        }
      },
      proof_of_cloud: verified
    });
  } catch {
    return NextResponse.json({
      success: false,
      error: 'verification_failed',
      message: 'Measurement hash verification failed'
    });
  }
}


