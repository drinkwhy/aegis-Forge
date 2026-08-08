import path from 'path';

/** @type {import('next').NextConfig} */
const controlPlaneOrigin = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080').replace(/\/api\/v1\/?$/, '');

const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(process.cwd(), '../../'),
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
    const targetUrl = process.env.CONTROL_PLANE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || '';
    if (!targetUrl || targetUrl.includes('localhost') || targetUrl.includes('127.0.0.1')) {
      return [];
    }
    const origin = targetUrl.replace(/\/api\/v1\/?$/, '');
    return [
      {
        source: '/api/v1/health',
        destination: '/api/health',
      },
      {
        source: '/api/v1/:path*',
        destination: `${origin}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
