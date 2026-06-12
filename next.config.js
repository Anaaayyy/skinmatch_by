/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      unoptimized: true,
      dangerouslyAllowSVG: true,
      remotePatterns: [
        {
          protocol: 'http',
          hostname: 'annabuil.beget.tech',
          pathname: '/media/**',
        },
      ],
    },
  }
  
  module.exports = nextConfig