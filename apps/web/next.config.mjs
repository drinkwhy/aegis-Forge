/** @type {import('next').NextConfig} */
const controlPlaneOrigin = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080').replace(/\/api\/v1\/?$/, '');
const workspaceId = process.env.NEXT_PUBLIC_WORKSPACE_ID || 'd3b07384-d113-4a11-b541-ef81f212239d';

const nextConfig = {
  output: 'standalone',
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return {
      // beforeFiles: checked before filesystem. Empty — let Next.js routes match first.
      beforeFiles: [],
      // afterFiles: checked AFTER Next.js filesystem routes fail. Proxy everything else.
      afterFiles: [
        {
          source: '/api/v1/campaigns',
          destination: `${controlPlaneOrigin}/api/v1/workspaces/${workspaceId}/campaigns`,
        },
        {
          source: '/api/v1/findings',
          destination: `${controlPlaneOrigin}/api/v1/workspaces/${workspaceId}/findings`,
        },
        {
          source: '/api/v1/remediations',
          destination: `${controlPlaneOrigin}/api/v1/workspaces/${workspaceId}/remediations`,
        },
        {
          // Catch-all — only hits if no Next.js API route matched
          source: '/api/v1/:path*',
          destination: `${controlPlaneOrigin}/api/v1/:path*`,
        },
      ],
      // fallback: last resort
      fallback: [],
    };
  },
};

export default nextConfig;
