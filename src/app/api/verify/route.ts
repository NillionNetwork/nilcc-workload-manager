import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'node:child_process';

export const runtime = 'nodejs';

interface VerifyRequestBody {
  measurementHash: string;
  dockerComposeHash: string;
  nilccVersion: string;
  vcpus: number | string;
}

function runDocker(args: string[]): Promise<{ stdout: string; stderr: string; code: number | null }>{
  return new Promise((resolve) => {
    const child = spawn('docker', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    child.on('close', (code) => resolve({ stdout, stderr, code }));
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as VerifyRequestBody;
    const measurementHashInput = (body.measurementHash || '').trim();
    const dockerComposeHash = (body.dockerComposeHash || '').trim();
    const nilccVersion = (body.nilccVersion || '').trim();
    const vcpus = String(body.vcpus ?? '').trim();

    if (!measurementHashInput || !dockerComposeHash || !nilccVersion || !vcpus) {
      return NextResponse.json({ verified: false });
    }

    const args = [
      'run',
      '-v',
      '/tmp/nilcc-verifier-cache:/tmp/nilcc-verifier-cache',
      '--rm',
      'ghcr.io/nillionnetwork/nilcc-verifier:latest',
      'measurement-hash',
      dockerComposeHash,
      nilccVersion,
      '--vm-type',
      'cpu',
      '--cpus',
      vcpus,
    ];

    const { stdout, stderr, code } = await runDocker(args);
    if (code !== 0) {
      return NextResponse.json({ verified: false });
    }

    const computedMeasurementHash = stdout.trim();
    const verified = computedMeasurementHash === measurementHashInput;

    return NextResponse.json({ verified });
  } catch {
    return NextResponse.json({ verified: false });
  }
}


