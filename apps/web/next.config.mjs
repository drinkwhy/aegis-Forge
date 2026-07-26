/** @type {import('next').NextConfig} */
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
        destination: 'http://localhost:8080/api/v1/workspaces/d3b07384-d113-4a11-b541-ef81f212239d/campaigns',
      },
      {
        source: '/api/v1/findings',
        destination: 'http://localhost:8080/api/v1/workspaces/d3b07384-d113-4a11-b541-ef81f212239d/findings',
      },
      {
        source: '/api/v1/:path*',
        destination: 'http://localhost:8080/api/v1/:path*',
      },
    ];
  },
};

export default nextConfig;
