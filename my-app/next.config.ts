// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;

const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_APP_URL: "https://dev.iqa3.tech",
    NEXT_PUBLIC_API_BASE_URL: "https://dev.iqa3.tech/api/v1",
    NEXT_PUBLIC_API_URL: "https://dev.iqa3.tech/api/v1",
    NEXT_PUBLIC_RECAPTCHA_SITE_KEY: "6LdfQZksAAAAAJO3ZE7XwPLSsIk-BdA5WVySgXjf",
    NEXT_PUBLIC_SOCKET_URL: "https://dev.iqa3.tech",
    NEXT_PUBLIC_USE_MOCK: "false",
  },
  images: {
    domains: [
      "i.pravatar.cc",
      "iqa3-media-storage.s3.eu-north-1.amazonaws.com",
      "iqa3-media-storage.s3.amazonaws.com",
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "iqa3-media-storage.s3.eu-north-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "iqa3-media-storage.s3.amazonaws.com",
      },
    ],
  },
};

module.exports = nextConfig;
