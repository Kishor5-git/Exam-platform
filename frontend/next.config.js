/** @type {import('next').Next.jsConfig} */
const nextConfig = {
  // experimental: {
  //   turbopack: {
  //     root: '..',
  //   },
  // },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
