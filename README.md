# nilCC Workload Manager

This Next.js application provides a UI for creating, restarting, and monitoring workloads that run on nilCC (Nillion Confidential Compute). Use it to submit Docker Compose deployments, inspect runtime logs, and watch system stats for every workload in your nilCC account.

nilCC Workload Manager: https://nilcc.nillion.com

## Prerequisites

- Node.js 18.18+ (LTS recommended)
- npm 9+ (ships with recent Node releases)
- A nilCC API key (see the [nilCC quickstart](https://docs.nillion.com/build/compute/quickstart))

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure the API endpoint:
   ```bash
   cp .env.example .env
   # edit .env and set NEXT_PUBLIC_NILCC_API_BASE
   ```
   Refer to the [nilCC docs](https://docs.nillion.com/build/compute/overview) for endpoint guidance and authentication details.

3. (Optional) Configure GitHub Actions for verification:
   The verify feature uses GitHub Actions to run Docker-based verification. To enable this:
   - Create a GitHub Personal Access Token with `actions:write` and `actions:read` permissions
   - Set the following environment variables in your deployment (e.g., Vercel):
     - `GITHUB_TOKEN`: Your GitHub Personal Access Token (required)
     - `GITHUB_BRANCH`: Branch to trigger workflows on (defaults to `main` if not set)
4. Run the local dev server:
   ```bash
   npm run dev
   ```
   The app is available at http://localhost:3000.

## Available Scripts

- `npm run dev` – start the development server with hot reloading.
- `npm run build` – create an optimized production build.
- `npm run start` – serve the last production build locally.
- `npm run lint` – run the ESLint ruleset used in CI.

## Features

### Verification

The verify tab allows you to verify measurement hashes for nilCC workloads. Since the application runs on Vercel (which doesn't support Docker), verification is performed via GitHub Actions. When you click "Verify", the app:

1. Triggers a GitHub Action workflow that runs the Docker-based nilcc-verifier
2. Polls the workflow status until completion
3. Displays the verification result

**Note**: This feature requires the `GITHUB_TOKEN` environment variable to be set in your deployment environment.

## Working With nilCC

The UI surfaces workload status, Docker Compose configuration, environment variables, attached files, and live logs. Actions such as restarting or deleting workloads are dispatched directly to the nilCC API using the configured credentials. For platform capabilities, security guarantees, and advanced deployment flows, consult the official [nilCC documentation](https://docs.nillion.com/build/compute/overview).
