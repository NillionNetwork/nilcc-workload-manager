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
3. Run the local dev server:
   ```bash
   npm run dev
   ```
   The app is available at http://localhost:3000.

## Available Scripts

- `npm run dev` – start the development server with hot reloading.
- `npm run build` – create an optimized production build.
- `npm run start` – serve the last production build locally.
- `npm run lint` – run the ESLint ruleset used in CI.

## Working With nilCC

The UI surfaces workload status, Docker Compose configuration, environment variables, attached files, and live logs. Actions such as restarting or deleting workloads are dispatched directly to the nilCC API using the configured credentials. For platform capabilities, security guarantees, and advanced deployment flows, consult the official [nilCC documentation](https://docs.nillion.com/build/compute/overview).
