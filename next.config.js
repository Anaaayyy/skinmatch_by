/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      unoptimized: true,
      dangerouslyAllowSVG: true,
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'skinmatch.online',
          pathname: '/media/**',
        },
      ],
    },
    async rewrites() {
      return [
        {
          source: '/api/:path*',
          destination: 'http://annabuil.beget.tech/api/:path*',
        },
        {
          source: '/media/:path*',
          destination: 'http://annabuil.beget.tech/media/:path*',
        },
        {
          source: '/admin/:path*',
          destination: 'http://annabuil.beget.tech/admin/:path*',
        },
      ];
    },
  }
  
  module.exports = nextConfig