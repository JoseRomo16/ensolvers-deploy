import type { NextConfig } from 'next';

/**
 * Static export: `next build` emits plain HTML/CSS/JS into `out/`, with no Node
 * server rendering pages at request time. The exercise requires a pure SPA, and
 * this makes that verifiable rather than a claim — the artifact is static files
 * that any web server or CDN can host.
 *
 * Consequences, on purpose:
 *   - every component is a Client Component
 *   - no API routes, no middleware, no server-side data fetching
 *   - the SPA reaches the backend by absolute URL, so CORS is the mechanism
 */
const nextConfig: NextConfig = {
  output: 'export',
  // The image optimizer needs a server; there is none in a static export.
  images: { unoptimized: true },
  // Emit `/route/index.html` so static hosts resolve deep links without config.
  trailingSlash: true,
};

export default nextConfig;
