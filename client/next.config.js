/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.vietqr.io' },
      { protocol: 'https', hostname: '**' }, // cho phep anh san pham tu nhieu nguon, co the gioi han lai sau
    ],
  },
  async rewrites() {
    // Proxy /api/* sang backend Express khi can goi truc tiep tu Server Component,
    // doi voi Client Component van nen goi qua axios instance trong src/lib/api.js
    return [];
  },
};

module.exports = nextConfig;
