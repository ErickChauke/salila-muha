/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/api/:path*",
          destination: "http://13.244.64.123/api/:path*",
        },
        {
          source: "/socket.io/:path*",
          destination: "http://13.244.64.123/socket.io/:path*",
        },
      ],
    };
  },
};

module.exports = nextConfig;
