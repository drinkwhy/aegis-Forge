/** @type {import('next').NextConfig} */
const controlPlaneOrigin = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080').replace(/\/api\/v1\/?$/, '');

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
    const rawApiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
    const isExternal = rawApiUrl && !rawApiUrl.includes('localhost') && !rawApiUrl.includes('127.0.0.1');
    if (!isExternal) {
      return [];
    }
    const origin = rawApiUrl.replace(/\/api\/v1\/?$/, '');
    return [
      {
        source: '/api/v1/:path*',
        destination: `${origin}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
