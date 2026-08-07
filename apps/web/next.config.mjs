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
    return {
      beforeFiles: [],
      afterFiles: [
        {
          source: '/api/v1/:path*',
          destination: `${controlPlaneOrigin}/api/v1/:path*`,
        },
      ],
      fallback: [],
    };
  },
};

export default nextConfig;
