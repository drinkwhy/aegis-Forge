/** @type {import('next').NextConfig} */
const controlPlaneOrigin = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080').replace(/\/api\/v1\/?$/, '');
const workspaceId = process.env.NEXT_PUBLIC_WORKSPACE_ID || 'd3b07384-d113-4a11-b541-ef81f212239d';

const nextConfig = {
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
    return [
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
        // Catch-all — proxies all /api/v1/* directly to control-plane
        source: '/api/v1/:path*',
        destination: `${controlPlaneOrigin}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
