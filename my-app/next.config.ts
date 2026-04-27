// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;

const BACKEND_URL = "https://dev.iqa3.tech";

const nextConfig = {
  reactStrictMode: true,

  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${BACKEND_URL}/api/v1/:path*`,
      },
    ];
  },

  // TODO: remove once .env loading is fixed
  env: {
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    NEXT_PUBLIC_API_BASE_URL: "/api/v1",
    NEXT_PUBLIC_API_URL: "/api/v1",
    NEXT_PUBLIC_RECAPTCHA_SITE_KEY: "6LdfQZksAAAAAJO3ZE7XwPLSsIk-BdA5WVySgXjf",
    NEXT_PUBLIC_SOCKET_URL: BACKEND_URL,
    NEXT_PUBLIC_USE_MOCK: "false",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
      {
        protocol: "https",
        hostname: "iqa3-media-storage.s3.eu-north-1.amazonaws.com",
      },
    ],
  },
};

module.exports = nextConfig;