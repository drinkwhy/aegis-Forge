/** @type {import('next').NextConfig} */
const controlPlaneOrigin = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

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
        destination: `${controlPlaneOrigin}/api/v1/workspaces/d3b07384-d113-4a11-b541-ef81f212239d/campaigns`,
      },
      {
        source: '/api/v1/findings',
        destination: `${controlPlaneOrigin}/api/v1/workspaces/d3b07384-d113-4a11-b541-ef81f212239d/findings`,
      },
      {
        source: '/api/v1/remediations',
        destination: `${controlPlaneOrigin}/api/v1/workspaces/d3b07384-d113-4a11-b541-ef81f212239d/remediations`,
      },
      {
        source: '/api/v1/:path*',
        destination: `${controlPlaneOrigin}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
