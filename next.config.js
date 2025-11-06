/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // In production, API runs on localhost:3001, Next.js proxies to it
    // In development, use the API_URL env var or default to localhost:3001
    const isProduction = process.env.NODE_ENV === 'production';
    const apiUrl = isProduction 
      ? 'http://localhost:3001' 
      : (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');
    
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;

