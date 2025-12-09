/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'example.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  turbopack: {
    root: 'C:/Users/Admin/migistus-app/frontend/migistus-homepage',
  },
  // No changes needed unless you have custom rewrites or redirects blocking /categories/[category]
};

module.exports = nextConfig;